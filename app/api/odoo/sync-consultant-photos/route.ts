import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

interface SyncOptions {
  matchOnly?: boolean // Only match consultants, don't import photos
  importOnly?: boolean // Only import photos for already matched consultants
  forceUpdate?: boolean // Update even if photo already exists
  limit?: number // Limit number of consultants to process
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    const options: SyncOptions = await request.json()
    const { 
      matchOnly = false, 
      importOnly = false, 
      forceUpdate = false,
      limit 
    } = options

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
    
    const results = {
      matched: 0,
      photosImported: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    }

    // Step 1: Match consultants by email (unless importOnly)
    if (!importOnly) {
      console.log('🔍 Starting consultant matching...')
      
      // Get all consultants without odoo_id
      const { data: unmatchedConsultants } = await supabase
        .from('consultants')
        .select('id, email, full_name')
        .is('odoo_id', null)
        .order('created_at', { ascending: false })

      if (unmatchedConsultants && unmatchedConsultants.length > 0) {
        // Get all consultant partners from Odoo
        const odooPartners = await new Promise<any[]>((resolve, reject) => {
          models.methodCall('execute_kw', [
            odooDb, uid, odooApiKey,
            'res.partner', 'search_read',
            [[['is_company', '=', false], ['partner_type', '=', 'consultant']]],
            { 
              fields: ['id', 'email', 'name', 'image_1920'],
              limit: 2000
            }
          ], (err: any, result: any) => {
            if (err) reject(err)
            else resolve(result)
          })
        })

        // Create email map for faster lookup
        const odooByEmail = new Map()
        odooPartners.forEach(partner => {
          if (partner.email) {
            odooByEmail.set(partner.email.toLowerCase(), partner)
          }
        })

        // Match consultants
        for (const consultant of unmatchedConsultants) {
          if (!consultant.email) continue
          
          const odooPartner = odooByEmail.get(consultant.email.toLowerCase())
          if (odooPartner) {
            const { error } = await supabase
              .from('consultants')
              .update({ 
                odoo_id: odooPartner.id,
                odoo_image_1920: odooPartner.image_1920 || null
              })
              .eq('id', consultant.id)

            if (!error) {
              results.matched++
              results.details.push({
                action: 'matched',
                consultant: consultant.full_name,
                email: consultant.email,
                odoo_id: odooPartner.id
              })
            }
          }
        }
      }
    }

    // Step 2: Import photos (unless matchOnly)
    if (!matchOnly) {
      console.log('📸 Starting photo import...')
      
      // Ensure storage bucket exists
      const { data: buckets } = await adminSupabase.storage.listBuckets()
      if (!buckets?.find(b => b.name === 'consultant-profiles')) {
        await adminSupabase.storage.createBucket('consultant-profiles', { public: true })
      }

      // Build query for consultants with odoo_id
      let query = supabase
        .from('consultants')
        .select('id, odoo_id, full_name, email, profile_image_url')
        .not('odoo_id', 'is', null)
        .order('created_at', { ascending: false })

      if (!forceUpdate) {
        query = query.is('profile_image_url', null)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data: consultantsToUpdate } = await query

      // Process in batches
      const BATCH_SIZE = 10
      for (let i = 0; i < (consultantsToUpdate || []).length; i += BATCH_SIZE) {
        const batch = consultantsToUpdate?.slice(i, i + BATCH_SIZE) || []
        const odooIds = batch.map(c => c.odoo_id)

        try {
          // Fetch photos from Odoo
          const odooData = await new Promise<any[]>((resolve, reject) => {
            models.methodCall('execute_kw', [
              odooDb, uid, odooApiKey,
              'res.partner', 'read',
              [odooIds],
              { fields: ['id', 'image_1920', 'name'] }
            ], (err: any, result: any) => {
              if (err) reject(err)
              else resolve(result)
            })
          })

          // Create map for easier lookup
          const odooMap = new Map(odooData.map(p => [p.id, p]))

          // Process each consultant in batch
          for (const consultant of batch) {
            const odooPartner = odooMap.get(consultant.odoo_id)
            
            if (odooPartner && odooPartner.image_1920) {
              try {
                const imageBase64 = odooPartner.image_1920
                const imageBuffer = Buffer.from(imageBase64, 'base64')
                const timestamp = Date.now()
                const fileName = `consultant-${consultant.odoo_id}-${timestamp}.jpg`
                
                // Upload to storage
                const { error: uploadError } = await adminSupabase.storage
                  .from('consultant-profiles')
                  .upload(fileName, imageBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false
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
                    results.photosImported++
                    results.details.push({
                      action: 'photo_imported',
                      consultant: consultant.full_name,
                      imageUrl: publicUrl
                    })
                  } else {
                    throw updateError
                  }
                } else {
                  throw uploadError
                }
              } catch (error: any) {
                results.errors++
                results.details.push({
                  action: 'error',
                  consultant: consultant.full_name,
                  error: error.message
                })
              }
            } else {
              results.skipped++
              results.details.push({
                action: 'skipped',
                consultant: consultant.full_name,
                reason: 'No photo in Odoo'
              })
            }
          }
        } catch (error: any) {
          console.error('Batch error:', error)
          results.errors += batch.length
        }

        // Delay between batches
        if (i + BATCH_SIZE < (consultantsToUpdate || []).length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    // Get final statistics
    const { count: totalConsultants } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })

    const { count: withOdooId } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)

    const { count: withPhotos } = await supabase
      .from('consultants')
      .select('*', { count: 'exact', head: true })
      .not('profile_image_url', 'is', null)

    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: totalConsultants || 0,
        linked: withOdooId || 0,
        withPhotos: withPhotos || 0,
        percentLinked: totalConsultants ? ((withOdooId || 0) / totalConsultants * 100).toFixed(1) : 0,
        percentWithPhotos: totalConsultants ? ((withPhotos || 0) / totalConsultants * 100).toFixed(1) : 0
      },
      message: `Sincronização concluída: ${results.matched} correspondências, ${results.photosImported} fotos importadas`
    })

  } catch (error: any) {
    console.error('Error syncing consultant photos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao sincronizar fotos de consultoras' },
      { status: 500 }
    )
  }
}