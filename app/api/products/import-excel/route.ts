import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"

// Helper function to generate product SKU
function generateProductSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PROD-${timestamp}-${random}`
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Campo obrigatório: name' },
        { status: 400 }
      )
    }

    // Extract product data
    const name = body.name
    const price = parseFloat(body.price || '0')
    const cost = parseFloat(body.cost || '0')
    const stockQuantity = parseInt(body.stock || body.stockForecast || body.stockOnHand || '0')
    const isFavorite = body.isFavorite === true || body.isFavorite === 'true'
    
    // Use name as SKU if it looks like a code (e.g., BRI0249, ANE0001)
    const sku = name.match(/^[A-Z]{3}\d{4}$/) ? name : (body.sku || generateProductSKU())
    const slug = generateSlug(name)
    const description = body.description || `Produto ${name}`

    // Check if product already exists by SKU
    const { data: existingBySku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .single()

    if (existingBySku) {
      return NextResponse.json(
        { error: `Produto com SKU ${sku} já existe` },
        { status: 400 }
      )
    }

    // Check if product already exists by slug
    const { data: existingBySlug } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingBySlug) {
      // Add random suffix to slug if it already exists
      const newSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
      
      // Create product with modified slug
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name,
          slug: newSlug,
          sku,
          description,
          price: price || 0,
          sale_price: cost > 0 && cost < price ? cost : null,
          standard_price: cost || null,
          stock_quantity: stockQuantity,
          status: stockQuantity > 0 ? 'active' : 'out_of_stock',
          active: true,
          featured: isFavorite,
          metadata: {
            imported_from: 'Excel',
            import_date: new Date().toISOString(),
            original_data: body
          }
        })
        .select()
        .single()

      if (productError) {
        throw productError
      }

      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          slug: product.slug
        }
      }, { status: 201 })
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        sku,
        description,
        price: price || 0,
        sale_price: cost > 0 && cost < price ? cost : null,
        standard_price: cost || null,
        stock_quantity: stockQuantity,
        status: stockQuantity > 0 ? 'active' : 'out_of_stock',
        active: true,
        featured: isFavorite,
        metadata: {
          imported_from: 'Excel',
          import_date: new Date().toISOString(),
          original_data: body
        }
      })
      .select()
      .single()

    if (productError) {
      console.error('Product error:', productError)
      return NextResponse.json(
        { error: `Erro ao criar produto: ${productError.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'CREATE_PRODUCT',
        entity_type: 'product',
        entity_id: product.id,
        details: {
          product_name: product.name,
          product_sku: product.sku,
          source: 'Excel import'
        }
      })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error in POST /api/products/import-excel:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}