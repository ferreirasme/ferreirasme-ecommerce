import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

// Helper function to generate SKU if not provided
function generateSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PROD-${timestamp}-${random}`
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  console.log('[ODOO PRODUCTS IMPORT] ========== Starting product import process ==========', {
    timestamp: new Date().toISOString(),
    requestHeaders: Object.fromEntries(request.headers.entries())
  })
  
  try {
    // Check if user is admin
    console.log('[ODOO PRODUCTS IMPORT] Checking admin authentication...')
    const admin = await checkIsAdmin(request)
    if (!admin) {
      console.log('[ODOO PRODUCTS IMPORT] Access denied - user is not admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('[ODOO PRODUCTS IMPORT] Admin authenticated:', {
      adminId: admin.id,
      adminEmail: admin.email,
      timestamp: new Date().toISOString()
    })

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Odoo connection details
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!
    
    console.log('[ODOO PRODUCTS IMPORT] Odoo configuration:', {
      url: url ? `${url.substring(0, 20)}...` : 'NOT SET',
      database: db || 'NOT SET',
      username: username || 'NOT SET',
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString()
    })

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
    console.log('[ODOO PRODUCTS IMPORT] Authenticating with Odoo XML-RPC...')
    const authStartTime = Date.now()
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) {
          console.error('[ODOO PRODUCTS IMPORT] Authentication failed:', {
            error: err.message || err,
            duration: `${Date.now() - authStartTime}ms`
          })
          reject(err)
        } else {
          console.log('[ODOO PRODUCTS IMPORT] Authentication successful:', {
            uid,
            duration: `${Date.now() - authStartTime}ms`,
            timestamp: new Date().toISOString()
          })
          resolve(uid)
        }
      })
    })

    if (!uid) {
      console.log('[ODOO PRODUCTS IMPORT] Authentication failed - no UID returned')
      return NextResponse.json({ error: 'Falha na autenticação com Odoo' }, { status: 401 })
    }

    // First, fetch all categories from Odoo
    console.log('[ODOO PRODUCTS IMPORT] Fetching categories from Odoo...')
    const categoriesFetchStartTime = Date.now()
    const odooCategories = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'product.category', 'search_read',
        [[]],
        { 
          fields: ['id', 'name', 'parent_id', 'complete_name'],
          order: 'parent_left'
        }
      ], (err: any, result: any) => {
        if (err) {
          console.error('[ODOO PRODUCTS IMPORT] Failed to fetch categories:', {
            error: err.message || err,
            duration: `${Date.now() - categoriesFetchStartTime}ms`
          })
          reject(err)
        } else {
          console.log('[ODOO PRODUCTS IMPORT] Categories fetched successfully:', {
            count: result.length,
            duration: `${Date.now() - categoriesFetchStartTime}ms`,
            timestamp: new Date().toISOString()
          })
          resolve(result)
        }
      })
    })

    // Create category mappings
    console.log('[ODOO PRODUCTS IMPORT] Creating category mappings...')
    const categoryMappingStartTime = Date.now()
    const categoryMap = new Map<number, string>()
    let categoriesCreated = 0
    let categoriesExisting = 0
    
    for (const odooCategory of odooCategories) {
      // Check if category mapping already exists
      const { data: existingMapping } = await supabase
        .from('category_mappings')
        .select('local_category_id')
        .eq('odoo_category_id', odooCategory.id)
        .single()
      
      if (existingMapping?.local_category_id) {
        categoryMap.set(odooCategory.id, existingMapping.local_category_id)
      } else {
        // Create or find local category
        const slug = generateSlug(odooCategory.name)
        
        // Check if category exists by slug
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .single()
        
        let categoryId: string
        
        if (existingCategory) {
          categoryId = existingCategory.id
          categoriesExisting++
        } else {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              name: odooCategory.name,
              slug: slug,
              description: `Imported from Odoo: ${odooCategory.complete_name}`
            })
            .select('id')
            .single()
          
          if (categoryError || !newCategory) {
            console.error('[ODOO PRODUCTS IMPORT] Failed to create category:', {
              categoryName: odooCategory.name,
              odooId: odooCategory.id,
              error: categoryError?.message
            })
            continue
          }
          
          categoryId = newCategory.id
          categoriesCreated++
        }
        
        // Create mapping
        await supabase
          .from('category_mappings')
          .insert({
            odoo_category_id: odooCategory.id,
            odoo_category_name: odooCategory.complete_name || odooCategory.name,
            local_category_id: categoryId
          })
        
        categoryMap.set(odooCategory.id, categoryId)
      }
    }
    
    console.log('[ODOO PRODUCTS IMPORT] Category mapping completed:', {
      totalCategories: odooCategories.length,
      mapped: categoryMap.size,
      created: categoriesCreated,
      existing: categoriesExisting,
      duration: `${Date.now() - categoryMappingStartTime}ms`,
      timestamp: new Date().toISOString()
    })

    // Fetch all products from Odoo
    console.log('[ODOO PRODUCTS IMPORT] Fetching products from Odoo...')
    const productsFetchStartTime = Date.now()
    const products = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'product.product', 'search_read',
        [[['sale_ok', '=', true]]], // Only saleable products
        { 
          fields: [
            'id', 'name', 'default_code', 'list_price', 'standard_price',
            'qty_available', 'barcode', 'categ_id', 'image_1920',
            'description', 'description_sale', 'active', 'type',
            'weight', 'volume', 'sale_line_warn', 'purchase_line_warn'
          ],
          limit: 5000 // Adjust as needed
        }
      ], (err: any, result: any) => {
        if (err) {
          console.error('[ODOO PRODUCTS IMPORT] Failed to fetch products:', {
            error: err.message || err,
            duration: `${Date.now() - productsFetchStartTime}ms`
          })
          reject(err)
        } else {
          console.log('[ODOO PRODUCTS IMPORT] Products fetched successfully:', {
            count: result.length,
            duration: `${Date.now() - productsFetchStartTime}ms`,
            timestamp: new Date().toISOString()
          })
          resolve(result)
        }
      })
    })

    console.log(`[ODOO PRODUCTS IMPORT] Found ${products.length} products in Odoo`)

    let created = 0
    let updated = 0
    let errors = 0
    let skipped = 0
    let imagesProcessed = 0
    let imagesFailed = 0
    const errorDetails: any[] = []
    const processStartTime = Date.now()
    
    console.log('[ODOO PRODUCTS IMPORT] Starting to process products...', {
      totalProducts: products.length,
      timestamp: new Date().toISOString()
    })

    // Process each product
    for (let index = 0; index < products.length; index++) {
      const product = products[index]
      const productStartTime = Date.now()
      
      // Log progress every 25 products
      if (index > 0 && index % 25 === 0) {
        console.log('[ODOO PRODUCTS IMPORT] Progress update:', {
          processed: index,
          total: products.length,
          percentage: `${Math.round((index / products.length) * 100)}%`,
          created,
          updated,
          errors,
          skipped,
          imagesProcessed,
          imagesFailed,
          duration: `${Date.now() - processStartTime}ms`,
          averageTimePerProduct: `${Math.round((Date.now() - processStartTime) / index)}ms`
        })
      }
      try {
        // Skip service products (only process stockable products)
        if (product.type === 'service') {
          console.log('[ODOO PRODUCTS IMPORT] Skipping service product:', {
            productName: product.name,
            productId: product.id,
            type: product.type
          })
          skipped++
          continue
        }

        // Check if product already exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, odoo_id')
          .eq('odoo_id', product.id)
          .single()

        // Generate SKU if not provided
        const sku = product.default_code || generateSKU()
        const slug = generateSlug(product.name)

        // Prepare product data
        const productData: any = {
          odoo_id: product.id,
          name: product.name,
          slug: slug,
          description: product.description_sale || product.description || '',
          price: product.list_price || 0,
          sale_price: product.standard_price < product.list_price ? product.standard_price : null,
          sku: sku,
          stock_quantity: Math.floor(product.qty_available || 0),
          category_id: product.categ_id ? categoryMap.get(product.categ_id[0]) : null,
          featured: false,
          active: product.active !== false,
          status: product.qty_available > 0 ? 'active' : 'out_of_stock',
          metadata: {
            barcode: product.barcode || null,
            weight: product.weight || null,
            volume: product.volume || null,
            odoo_category_name: product.categ_id ? product.categ_id[1] : null,
            sale_line_warn: product.sale_line_warn || null,
            purchase_line_warn: product.purchase_line_warn || null,
            standard_price: product.standard_price || null
          },
          last_stock_update: new Date().toISOString(),
          import_date: new Date().toISOString()
        }

        // Handle product image
        let imageUrl: string | null = null
        if (product.image_1920) {
          const fileName = `${product.id}-${Date.now()}.jpg`
          imageUrl = await uploadBase64Image(adminSupabase, product.image_1920, fileName)
          
          if (imageUrl) {
            productData.main_image_url = imageUrl
            productData.odoo_image = product.image_1920 // Store base64 as backup
            imagesProcessed++
            console.log('[ODOO PRODUCTS IMPORT] Image uploaded successfully:', {
              productName: product.name,
              productId: product.id,
              imageUrl: imageUrl.substring(0, 50) + '...'
            })
          } else if (product.image_1920) {
            imagesFailed++
            console.warn('[ODOO PRODUCTS IMPORT] Image upload failed:', {
              productName: product.name,
              productId: product.id
            })
          }
        }

        if (existingProduct) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id)

          if (updateError) throw updateError

          // Update product images table if we have an image
          if (imageUrl) {
            // Check if primary image exists
            const { data: existingImage } = await supabase
              .from('product_images')
              .select('id')
              .eq('product_id', existingProduct.id)
              .eq('is_primary', true)
              .single()

            if (existingImage) {
              // Update existing primary image
              await supabase
                .from('product_images')
                .update({
                  image_url: imageUrl,
                  alt_text: product.name
                })
                .eq('id', existingImage.id)
            } else {
              // Create new primary image
              await supabase
                .from('product_images')
                .insert({
                  product_id: existingProduct.id,
                  image_url: imageUrl,
                  alt_text: product.name,
                  position: 0,
                  is_primary: true
                })
            }
          }

          updated++
          console.log('[ODOO PRODUCTS IMPORT] Updated product:', {
            name: product.name,
            sku: sku,
            productId: existingProduct.id,
            odooId: product.id,
            hasImage: !!imageUrl,
            duration: `${Date.now() - productStartTime}ms`,
            timestamp: new Date().toISOString()
          })
        } else {
          // Create new product
          const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert(productData)
            .select('id')
            .single()

          if (insertError) throw insertError

          // Create product image record if we have an image
          if (imageUrl && newProduct) {
            await supabase
              .from('product_images')
              .insert({
                product_id: newProduct.id,
                image_url: imageUrl,
                alt_text: product.name,
                position: 0,
                is_primary: true
              })
          }

          created++
          console.log('[ODOO PRODUCTS IMPORT] Created product:', {
            name: product.name,
            sku: sku,
            productId: newProduct?.id,
            odooId: product.id,
            hasImage: !!imageUrl,
            categoryId: productData.category_id,
            duration: `${Date.now() - productStartTime}ms`,
            timestamp: new Date().toISOString()
          })
        }

        // Create product_categories relationship if category exists
        if (productData.category_id) {
          let productId: string | undefined
          
          if (existingProduct) {
            productId = existingProduct.id
          } else {
            // For new products, we need to get the ID from the insert result
            const { data: productIdQuery } = await supabase
              .from('products')
              .select('id')
              .eq('odoo_id', product.id)
              .single()
            
            productId = productIdQuery?.id
          }
          
          if (productId) {
            // Check if relationship already exists
            const { data: existingRel } = await supabase
              .from('product_categories')
              .select('id')
              .eq('product_id', productId)
              .eq('category_id', productData.category_id)
              .single()

            if (!existingRel) {
              await supabase
                .from('product_categories')
                .insert({
                  product_id: productId,
                  category_id: productData.category_id
                })
            }
          }
        }

      } catch (error: any) {
        errors++
        const errorDetail = {
          product: product.name,
          odoo_id: product.id,
          sku: product.default_code,
          error: error.message,
          duration: `${Date.now() - productStartTime}ms`,
          timestamp: new Date().toISOString()
        }
        errorDetails.push(errorDetail)
        console.error('[ODOO PRODUCTS IMPORT] Error processing product:', errorDetail)
      }
    }
    
    const processingDuration = Date.now() - processStartTime
    console.log('[ODOO PRODUCTS IMPORT] Processing completed:', {
      totalProcessed: created + updated + errors + skipped,
      created,
      updated,
      errors,
      skipped,
      imagesProcessed,
      imagesFailed,
      duration: `${processingDuration}ms`,
      averageTimePerProduct: `${Math.round(processingDuration / products.length)}ms`,
      timestamp: new Date().toISOString()
    })

    // Log the import action
    console.log('[ODOO PRODUCTS IMPORT] Saving admin log...')
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'IMPORT_PRODUCTS_FROM_ODOO',
        entity_type: 'product',
        details: {
          total_products: products.length,
          created,
          updated,
          errors,
          skipped,
          images_processed: imagesProcessed,
          images_failed: imagesFailed,
          error_details: errorDetails.slice(0, 10), // First 10 errors
          categories_mapped: categoryMap.size,
          categories_created: categoriesCreated,
          duration: `${Date.now() - startTime}ms`
        }
      })

    // Create sync log
    console.log('[ODOO PRODUCTS IMPORT] Creating sync log...')
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'products',
        status: errors > 0 ? 'partial' : 'success',
        records_synced: created + updated,
        records_failed: errors,
        error_message: errors > 0 ? `${errors} products failed to import` : null,
        metadata: {
          created,
          updated,
          total: products.length,
          categories_mapped: categoryMap.size
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })

    const totalDuration = Date.now() - startTime
    const response = {
      success: true,
      created,
      updated,
      errors,
      total: products.length,
      details: {
        processed: created + updated + errors,
        skipped,
        categoriesMapped: categoryMap.size,
        categoriesCreated,
        imagesProcessed,
        imagesFailed,
        errorSample: errorDetails.slice(0, 5),
        duration: `${totalDuration}ms`,
        averageTimePerProduct: `${Math.round(totalDuration / products.length)}ms`
      }
    }
    
    console.log('[ODOO PRODUCTS IMPORT] ========== Import completed successfully ==========', {
      ...response,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(response)

  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[ODOO PRODUCTS IMPORT] ========== Import failed ==========', {
      error: error.message || error,
      stack: error.stack,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString()
    })
    
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
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
    }
    
    return NextResponse.json(
      { error: error.message || 'Erro ao importar produtos' },
      { status: 500 }
    )
  }
}