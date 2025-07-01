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
  console.log('[ODOO IMPORT] Starting product import process')
  
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      console.log('[ODOO IMPORT] Access denied - user is not admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('[ODOO IMPORT] Admin authenticated:', admin.email)

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Odoo connection details
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!
    
    console.log('[ODOO IMPORT] Odoo config:', {
      url: url || 'NOT SET',
      db: db || 'NOT SET',
      username: username || 'NOT SET',
      hasApiKey: !!apiKey
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
    console.log('[ODOO IMPORT] Authenticating with Odoo...')
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) {
          console.error('[ODOO IMPORT] Authentication error:', err)
          reject(err)
        } else {
          console.log('[ODOO IMPORT] Authentication successful, UID:', uid)
          resolve(uid)
        }
      })
    })

    if (!uid) {
      console.log('[ODOO IMPORT] Authentication failed - no UID returned')
      return NextResponse.json({ error: 'Falha na autenticação com Odoo' }, { status: 401 })
    }

    // First, fetch all categories from Odoo
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
        if (err) reject(err)
        else resolve(result)
      })
    })

    // Create category mappings
    const categoryMap = new Map<number, string>()
    
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
            console.error(`Failed to create category ${odooCategory.name}:`, categoryError)
            continue
          }
          
          categoryId = newCategory.id
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

    // Fetch all products from Odoo
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
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log(`Found ${products.length} products in Odoo`)

    let created = 0
    let updated = 0
    let errors = 0
    const errorDetails: any[] = []

    // Process each product
    for (const product of products) {
      try {
        // Skip service products (only process stockable products)
        if (product.type === 'service') {
          console.log(`Skipping service product: ${product.name}`)
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
          console.log(`Updated product: ${product.name}`)
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
          console.log(`Created product: ${product.name} (${sku})`)
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
        errorDetails.push({
          product: product.name,
          odoo_id: product.id,
          error: error.message
        })
        console.error(`Error processing ${product.name}:`, error.message)
      }
    }

    // Log the import action
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
          error_details: errorDetails.slice(0, 10), // First 10 errors
          categories_mapped: categoryMap.size
        }
      })

    // Create sync log
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

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      total: products.length,
      details: {
        processed: created + updated + errors,
        skipped: products.length - (created + updated + errors),
        categoriesMapped: categoryMap.size,
        errorSample: errorDetails.slice(0, 5)
      }
    })

  } catch (error: any) {
    console.error('Error importing products from Odoo:', error)
    
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