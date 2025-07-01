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
    
    const { type = 'consultants' } = await request.json()

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
    
    // Ensure storage buckets exist
    const { data: buckets } = await adminSupabase.storage.listBuckets()
    const consultantProfilesBucket = buckets?.find(b => b.name === 'consultant-profiles')
    const productsBucket = buckets?.find(b => b.name === 'products')
    
    if (!consultantProfilesBucket) {
      await adminSupabase.storage.createBucket('consultant-profiles', { public: true })
    }
    if (!productsBucket) {
      await adminSupabase.storage.createBucket('products', { public: true })
    }

    let updated = 0
    let errors = 0
    const errorDetails: any[] = []

    if (type === 'consultants') {
      // Get consultants with Odoo IDs
      const { data: consultants, error: consultError } = await supabase
        .from('consultants')
        .select('id, odoo_id, full_name, email')
        .not('odoo_id', 'is', null)
        .order('created_at', { ascending: false })

      if (consultError) throw consultError

      for (const consultant of consultants || []) {
        try {
          // Fetch photo from Odoo
          const partners = await new Promise<any[]>((resolve, reject) => {
            models.methodCall('execute_kw', [
              odooDb, uid, odooApiKey,
              'res.partner', 'read',
              [[consultant.odoo_id]],
              { fields: ['image_1920'] }
            ], (err: any, result: any) => {
              if (err) reject(err)
              else resolve(result)
            })
          })

          if (partners && partners[0] && partners[0].image_1920) {
            const imageBase64 = partners[0].image_1920
            const imageBuffer = Buffer.from(imageBase64, 'base64')
            const fileName = `consultant-${consultant.odoo_id}.jpg`
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await adminSupabase.storage
              .from('consultant-profiles')
              .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true
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
                console.log(`✅ Updated photo for ${consultant.full_name}`)
              } else {
                throw updateError
              }
            } else {
              throw uploadError
            }
          }
        } catch (error: any) {
          errors++
          errorDetails.push({
            name: consultant.full_name,
            error: error.message
          })
          console.error(`❌ Error updating photo for ${consultant.full_name}:`, error)
        }
      }
    } else if (type === 'products') {
      // Get products with Odoo IDs
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, odoo_id, name, sku')
        .not('odoo_id', 'is', null)
        .order('created_at', { ascending: false })

      if (productError) throw productError

      // Process in batches to avoid timeout
      const BATCH_SIZE = 20
      for (let i = 0; i < (products || []).length; i += BATCH_SIZE) {
        const batch = products?.slice(i, i + BATCH_SIZE) || []
        const odooIds = batch.map(p => p.odoo_id)

        try {
          // Fetch products from Odoo
          const odooProducts = await new Promise<any[]>((resolve, reject) => {
            models.methodCall('execute_kw', [
              odooDb, uid, odooApiKey,
              'product.product', 'read',
              [odooIds],
              { fields: ['id', 'image_1920'] }
            ], (err: any, result: any) => {
              if (err) reject(err)
              else resolve(result)
            })
          })

          for (const odooProduct of odooProducts) {
            if (odooProduct.image_1920) {
              const product = batch.find(p => p.odoo_id === odooProduct.id)
              if (!product) continue

              try {
                const imageBase64 = odooProduct.image_1920
                const imageBuffer = Buffer.from(imageBase64, 'base64')
                const fileName = `product-${product.odoo_id}.jpg`
                
                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await adminSupabase.storage
                  .from('products')
                  .upload(fileName, imageBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                  })
                
                if (!uploadError) {
                  const { data: { publicUrl } } = adminSupabase.storage
                    .from('products')
                    .getPublicUrl(fileName)
                  
                  // Update product record
                  const { error: updateError } = await supabase
                    .from('products')
                    .update({
                      main_image_url: publicUrl,
                      odoo_image: imageBase64
                    })
                    .eq('id', product.id)
                  
                  if (!updateError) {
                    updated++
                    console.log(`✅ Updated photo for ${product.name}`)
                  } else {
                    throw updateError
                  }
                } else {
                  throw uploadError
                }
              } catch (error: any) {
                errors++
                errorDetails.push({
                  name: product.name,
                  error: error.message
                })
                console.error(`❌ Error updating photo for ${product.name}:`, error)
              }
            }
          }
        } catch (error: any) {
          console.error('Error fetching batch from Odoo:', error)
          errors += batch.length
        }

        // Add delay between batches
        if (i + BATCH_SIZE < (products || []).length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    return NextResponse.json({
      success: true,
      type,
      updated,
      errors,
      errorDetails: errorDetails.slice(0, 5),
      message: `${updated} fotos atualizadas com sucesso`
    })

  } catch (error: any) {
    console.error('Error updating photos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar fotos' },
      { status: 500 }
    )
  }
}