import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

interface ImportPhotosRequest {
  batchSize?: number
  offset?: number
  onlyMissingPhotos?: boolean // If true, only import photos for products without images
}

// Helper function to upload base64 image to Supabase Storage
async function uploadBase64Image(
  supabase: any,
  base64Data: string,
  fileName: string
): Promise<string | null> {
  try {
    // Remove base64 prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Clean, 'base64')
    
    // Upload to storage
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
    
    // Get public URL
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
  console.log('[IMPORT PHOTOS] ========== Starting photo import process ==========')
  
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { 
      batchSize = 50, 
      offset = 0,
      onlyMissingPhotos = true 
    }: ImportPhotosRequest = await request.json()

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get products with odoo_id that need photos
    let query = supabase
      .from('products')
      .select('id, name, odoo_id, main_image_url')
      .not('odoo_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)

    if (onlyMissingPhotos) {
      query = query.is('main_image_url', null)
    }

    const { data: products, error: productsError } = await query

    if (productsError) throw productsError

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products to process',
        stats: {
          processed: 0,
          updated: 0,
          failed: 0
        }
      })
    }

    console.log(`[IMPORT PHOTOS] Found ${products.length} products to process`)

    // Odoo connection
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!

    // Create XML-RPC clients
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

    // Authenticate
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Failed to authenticate with Odoo' }, { status: 401 })
    }

    // Collect all odoo_ids
    const odooIds = products.map(p => p.odoo_id).filter(Boolean)

    // Fetch products with images from Odoo in batch
    console.log(`[IMPORT PHOTOS] Fetching ${odooIds.length} products from Odoo...`)
    const odooProducts = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'product.product', 'search_read',
        [[['id', 'in', odooIds]]],
        { 
          fields: ['id', 'name', 'image_1920', 'image_1024', 'image_512', 'image_256', 'image_128']
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    // Create a map for easy lookup
    const odooProductMap = new Map(odooProducts.map(p => [p.id, p]))

    let updated = 0
    let failed = 0
    const errors: any[] = []

    // Process each product
    for (const product of products) {
      try {
        const odooProduct = odooProductMap.get(product.odoo_id)
        
        if (!odooProduct) {
          console.warn(`[IMPORT PHOTOS] Odoo product not found for ID: ${product.odoo_id}`)
          failed++
          continue
        }

        // Get the best available image
        const imageData = odooProduct.image_1920 || 
                         odooProduct.image_1024 || 
                         odooProduct.image_512 || 
                         odooProduct.image_256 || 
                         odooProduct.image_128

        if (!imageData) {
          console.log(`[IMPORT PHOTOS] No image found for product: ${product.name} (Odoo ID: ${product.odoo_id})`)
          continue
        }

        // Upload image
        const fileName = `${product.odoo_id}-${Date.now()}.jpg`
        const imageUrl = await uploadBase64Image(adminSupabase, imageData, fileName)

        if (imageUrl) {
          // Update product with image URL
          const { error: updateError } = await supabase
            .from('products')
            .update({
              main_image_url: imageUrl,
              odoo_image: imageData // Store base64 as backup
            })
            .eq('id', product.id)

          if (updateError) throw updateError

          // Update or create product_images record
          const { data: existingImage } = await supabase
            .from('product_images')
            .select('id')
            .eq('product_id', product.id)
            .eq('is_primary', true)
            .single()

          if (existingImage) {
            // Update existing image
            await supabase
              .from('product_images')
              .update({
                image_url: imageUrl,
                alt_text: product.name
              })
              .eq('id', existingImage.id)
          } else {
            // Create new image record
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

          updated++
          console.log(`[IMPORT PHOTOS] Updated photo for: ${product.name}`)
        } else {
          failed++
          errors.push({
            productId: product.id,
            productName: product.name,
            odooId: product.odoo_id,
            error: 'Failed to upload image'
          })
        }

      } catch (error: any) {
        failed++
        errors.push({
          productId: product.id,
          productName: product.name,
          odooId: product.odoo_id,
          error: error.message
        })
        console.error(`[IMPORT PHOTOS] Error processing product ${product.id}:`, error)
      }
    }

    // Log the import action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'IMPORT_PRODUCT_PHOTOS_FROM_ODOO',
        entity_type: 'product',
        details: {
          batchSize,
          offset,
          processed: products.length,
          updated,
          failed,
          errors: errors.slice(0, 10),
          duration: `${Date.now() - startTime}ms`
        }
      })

    // Create sync log
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'products',
        status: failed > 0 ? 'partial' : 'success',
        records_synced: updated,
        records_failed: failed,
        error_message: failed > 0 ? `${failed} photos failed to import` : null,
        metadata: {
          type: 'photo_import',
          batchSize,
          offset,
          onlyMissingPhotos
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })

    const response = {
      success: true,
      stats: {
        processed: products.length,
        updated,
        failed,
        hasMore: products.length === batchSize // Indicates if there might be more products
      },
      errors: errors.slice(0, 5),
      duration: `${Date.now() - startTime}ms`
    }

    console.log('[IMPORT PHOTOS] ========== Import completed ==========', response)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[IMPORT PHOTOS] Error:', error)
    
    // Log failed sync
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
          metadata: { type: 'photo_import' },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
    }
    
    return NextResponse.json(
      { error: error.message || 'Error importing photos' },
      { status: 500 }
    )
  }
}