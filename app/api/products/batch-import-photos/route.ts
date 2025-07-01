import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

interface BatchImportRequest {
  totalBatches?: number // Number of batches to process in this request
  batchSize?: number // Size of each batch
  startFrom?: number // Starting offset
  onlyMissingPhotos?: boolean
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to upload base64 image to Supabase Storage
async function uploadBase64Image(
  supabase: any,
  base64Data: string,
  fileName: string
): Promise<string | null> {
  try {
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Clean, 'base64')
    
    const { data, error } = await supabase
      .storage
      .from('products')
      .upload(`images/${fileName}`, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (error) {
      console.error('Error uploading image:', error)
      return null
    }
    
    const { data: { publicUrl } } = supabase
      .storage
      .from('products')
      .getPublicUrl(`images/${fileName}`)
    
    return publicUrl
  } catch (error) {
    console.error('Error processing image:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[BATCH IMPORT PHOTOS] ========== Starting batch photo import ==========')
  
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { 
      totalBatches = 10,
      batchSize = 50,
      startFrom = 0,
      onlyMissingPhotos = true 
    }: BatchImportRequest = await request.json()

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get total count of products that need photos
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)

    if (onlyMissingPhotos) {
      countQuery = countQuery.is('main_image_url', null)
    }

    const { count: totalProducts } = await countQuery

    console.log(`[BATCH IMPORT PHOTOS] Total products to process: ${totalProducts}`)

    // Odoo connection setup
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!

    const common = xmlrpc.createClient({ 
      url: `${url}/xmlrpc/2/common`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })
    
    const models = xmlrpc.createClient({ 
      url: `${url}/xmlrpc/2/object`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })

    // Authenticate once
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Failed to authenticate with Odoo' }, { status: 401 })
    }

    // Process statistics
    let totalProcessed = 0
    let totalUpdated = 0
    let totalFailed = 0
    const batchResults: any[] = []

    // Process batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const currentOffset = startFrom + (batchIndex * batchSize)
      
      // Check if we've processed all products
      if (currentOffset >= (totalProducts || 0)) {
        console.log(`[BATCH IMPORT PHOTOS] All products processed. Stopping at batch ${batchIndex}`)
        break
      }

      console.log(`[BATCH IMPORT PHOTOS] Processing batch ${batchIndex + 1}/${totalBatches} (offset: ${currentOffset})`)

      // Get batch of products
      let query = supabase
        .from('products')
        .select('id, name, odoo_id, main_image_url')
        .not('odoo_id', 'is', null)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + batchSize - 1)

      if (onlyMissingPhotos) {
        query = query.is('main_image_url', null)
      }

      const { data: products, error: productsError } = await query

      if (productsError) {
        console.error(`[BATCH IMPORT PHOTOS] Error fetching batch ${batchIndex + 1}:`, productsError)
        continue
      }

      if (!products || products.length === 0) {
        console.log(`[BATCH IMPORT PHOTOS] No products in batch ${batchIndex + 1}`)
        continue
      }

      // Collect odoo_ids for this batch
      const odooIds = products.map(p => p.odoo_id).filter(Boolean)

      // Fetch products from Odoo
      const odooProducts = await new Promise<any[]>((resolve, reject) => {
        models.methodCall('execute_kw', [
          db, uid, apiKey,
          'product.product', 'search_read',
          [[['id', 'in', odooIds]]],
          { 
            fields: ['id', 'name', 'image_1920']
          }
        ], (err: any, result: any) => {
          if (err) reject(err)
          else resolve(result)
        })
      })

      const odooProductMap = new Map(odooProducts.map(p => [p.id, p]))

      let batchUpdated = 0
      let batchFailed = 0

      // Process each product in the batch
      for (const product of products) {
        try {
          const odooProduct = odooProductMap.get(product.odoo_id)
          
          if (!odooProduct || !odooProduct.image_1920) {
            continue
          }

          // Upload image
          const fileName = `${product.odoo_id}-${Date.now()}.jpg`
          const imageUrl = await uploadBase64Image(adminSupabase, odooProduct.image_1920, fileName)

          if (imageUrl) {
            // Update product
            const { error: updateError } = await supabase
              .from('products')
              .update({
                main_image_url: imageUrl,
                odoo_image: odooProduct.image_1920
              })
              .eq('id', product.id)

            if (!updateError) {
              // Handle product_images table
              const { data: existingImage } = await supabase
                .from('product_images')
                .select('id')
                .eq('product_id', product.id)
                .eq('is_primary', true)
                .single()

              if (existingImage) {
                await supabase
                  .from('product_images')
                  .update({
                    image_url: imageUrl,
                    alt_text: product.name
                  })
                  .eq('id', existingImage.id)
              } else {
                await supabase
                  .from('product_images')
                  .insert({
                    product_id: product.id,
                    image_url: imageUrl,
                    alt_text: product.name,
                    position: 0,
                    is_primary: true
                  })
              }

              batchUpdated++
            } else {
              batchFailed++
            }
          } else {
            batchFailed++
          }

        } catch (error: any) {
          batchFailed++
          console.error(`[BATCH IMPORT PHOTOS] Error processing product ${product.id}:`, error)
        }
      }

      totalProcessed += products.length
      totalUpdated += batchUpdated
      totalFailed += batchFailed

      batchResults.push({
        batchNumber: batchIndex + 1,
        offset: currentOffset,
        processed: products.length,
        updated: batchUpdated,
        failed: batchFailed
      })

      console.log(`[BATCH IMPORT PHOTOS] Batch ${batchIndex + 1} completed: ${batchUpdated} updated, ${batchFailed} failed`)

      // Add a small delay between batches to avoid overloading
      if (batchIndex < totalBatches - 1) {
        await delay(500)
      }
    }

    // Log the import action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'BATCH_IMPORT_PRODUCT_PHOTOS_FROM_ODOO',
        entity_type: 'product',
        details: {
          totalBatches: batchResults.length,
          batchSize,
          startFrom,
          totalProcessed,
          totalUpdated,
          totalFailed,
          batchResults,
          duration: `${Date.now() - startTime}ms`
        }
      })

    // Create sync log
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'products',
        status: totalFailed > 0 ? 'partial' : 'success',
        records_synced: totalUpdated,
        records_failed: totalFailed,
        error_message: totalFailed > 0 ? `${totalFailed} photos failed to import` : null,
        metadata: {
          type: 'batch_photo_import',
          totalBatches: batchResults.length,
          batchSize,
          startFrom,
          onlyMissingPhotos
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })

    const response = {
      success: true,
      stats: {
        totalProducts,
        totalProcessed,
        totalUpdated,
        totalFailed,
        batchesProcessed: batchResults.length,
        remainingProducts: Math.max(0, (totalProducts || 0) - (startFrom + totalProcessed))
      },
      batchResults,
      duration: `${Date.now() - startTime}ms`,
      nextOffset: startFrom + totalProcessed
    }

    console.log('[BATCH IMPORT PHOTOS] ========== Batch import completed ==========', response.stats)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[BATCH IMPORT PHOTOS] Error:', error)
    
    const supabase = await createClient()
    const admin = await checkIsAdmin(request)
    
    if (admin) {
      await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'products',
          status: 'error',
          records_synced: 0,
          records_failed: 0,
          error_message: error.message || 'Unknown error occurred',
          metadata: { type: 'batch_photo_import' },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
    }
    
    return NextResponse.json(
      { error: error.message || 'Error in batch photo import' },
      { status: 500 }
    )
  }
}