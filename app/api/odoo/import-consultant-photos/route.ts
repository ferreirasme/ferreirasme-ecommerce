import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    const { 
      limit = 50, // Process in smaller batches by default
      offset = 0,
      consultantId // Optional: import for specific consultant
    } = await request.json()

    // Odoo configuration
    const odooUrl = process.env.ODOO_URL
    const odooDb = process.env.ODOO_DB
    const odooUsername = process.env.ODOO_USERNAME
    const odooApiKey = process.env.ODOO_API_KEY

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      return NextResponse.json({ 
        error: 'Configuração Odoo incompleta' 
      }, { status: 500 })
    }

    // Authenticate with Odoo
    const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` })
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [odooDb, odooUsername, odooApiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Falha na autenticação Odoo' }, { status: 401 })
    }

    const models = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` })
    
    // Ensure storage bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets()
    const consultantProfilesBucket = buckets?.find(b => b.name === 'consultant-profiles')
    
    if (!consultantProfilesBucket) {
      await adminSupabase.storage.createBucket('consultant-profiles', { public: true })
    }

    // Build query
    let query = supabase
      .from('consultants')
      .select('id, odoo_id, full_name, email, profile_image_url')
      .not('odoo_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (consultantId) {
      query = query.eq('id', consultantId)
    }

    const { data: consultants, error: consultError } = await query

    if (consultError) throw consultError

    let updated = 0
    let skipped = 0
    let errors = 0
    const results: any[] = []

    for (const consultant of consultants || []) {
      try {
        // Skip if already has profile image
        if (consultant.profile_image_url) {
          skipped++
          results.push({
            name: consultant.full_name,
            status: 'skipped',
            reason: 'Already has profile image'
          })
          continue
        }

        // Fetch photo from Odoo
        const partners = await new Promise<any[]>((resolve, reject) => {
          models.methodCall('execute_kw', [
            odooDb, uid, odooApiKey,
            'res.partner', 'read',
            [[consultant.odoo_id]],
            { fields: ['image_1920', 'name'] }
          ], (err: any, result: any) => {
            if (err) reject(err)
            else resolve(result)
          })
        })

        if (partners && partners[0] && partners[0].image_1920) {
          const imageBase64 = partners[0].image_1920
          const imageBuffer = Buffer.from(imageBase64, 'base64')
          
          // Generate unique filename
          const timestamp = Date.now()
          const fileName = `consultant-${consultant.odoo_id}-${timestamp}.jpg`
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await adminSupabase.storage
            .from('consultant-profiles')
            .upload(fileName, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: false // Don't overwrite existing files
            })
          
          if (!uploadError) {
            const { data: { publicUrl } } = adminSupabase.storage
              .from('consultant-profiles')
              .getPublicUrl(fileName)
            
            // Update consultant record
            const { error: updateError } = await supabase
              .from('consultants')
              .update({
                profile_image_url: publicUrl,
                odoo_image_1920: imageBase64
              })
              .eq('id', consultant.id)
            
            if (!updateError) {
              updated++
              results.push({
                name: consultant.full_name,
                status: 'success',
                imageUrl: publicUrl
              })
              console.log(`✅ Updated photo for ${consultant.full_name}`)
            } else {
              throw updateError
            }
          } else {
            throw uploadError
          }
        } else {
          skipped++
          results.push({
            name: consultant.full_name,
            status: 'skipped',
            reason: 'No photo in Odoo'
          })
          console.log(`⚠️ No photo found in Odoo for ${consultant.full_name}`)
        }
      } catch (error: any) {
        errors++
        results.push({
          name: consultant.full_name,
          status: 'error',
          error: error.message
        })
        console.error(`❌ Error updating photo for ${consultant.full_name}:`, error)
      }
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      errors,
      processed: consultants?.length || 0,
      totalConsultants: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
      results: results.slice(0, 20), // Show first 20 results
      message: `${updated} fotos importadas com sucesso`
    })

  } catch (error: any) {
    console.error('Error importing consultant photos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao importar fotos de consultoras' },
      { status: 500 }
    )
  }
}

// GET endpoint to check import status
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get statistics
    const { data: totalConsultants, count: total } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })

    const { data: withOdooId, count: linked } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)

    const { data: withPhotos, count: photos } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })
      .not('profile_image_url', 'is', null)

    const { data: needsPhoto, count: pending } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)
      .is('profile_image_url', null)

    return NextResponse.json({
      success: true,
      stats: {
        total: total || 0,
        linked: linked || 0,
        withPhotos: photos || 0,
        needsPhoto: pending || 0,
        percentLinked: total ? ((linked || 0) / total * 100).toFixed(1) : 0,
        percentWithPhotos: total ? ((photos || 0) / total * 100).toFixed(1) : 0
      }
    })

  } catch (error: any) {
    console.error('Error getting import status:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao obter status de importação' },
      { status: 500 }
    )
  }
}