import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"

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

    // Extract data from Excel format
    const name = body.name || body['Nome'] || ''
    const price = parseFloat(body.price || body['Precos de venda'] || body['Preços de venda'] || '0')
    const cost = parseFloat(body.cost || body['Custo'] || '0')
    const stockQuantity = parseInt(
      body.stock || 
      body['Quantidade em maos'] || 
      body['Quantidade em mãos'] || 
      body['Quantidade prevista'] || 
      '0'
    )
    const isFavorite = body.isFavorite || body['Favorito'] === true || body['Favorito'] === 'true' || body['Favorito'] === 'VERDADEIRO'
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Campo obrigatório: Nome' },
        { status: 400 }
      )
    }

    // Use name as SKU (they look like product codes in the Excel)
    const sku = name
    const slug = generateSlug(name)
    const description = `Produto ${name}`

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
    let finalSlug = slug
    const { data: existingBySlug } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingBySlug) {
      // Add random suffix to slug if it already exists
      finalSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    }

    // Create product with only the fields that definitely exist
    const productData = {
      name,
      slug: finalSlug,
      sku,
      description,
      price: price || 0,
      stock_quantity: stockQuantity,
      active: true,
      featured: isFavorite
    }

    // Add sale_price only if cost is less than price
    if (cost > 0 && cost < price) {
      productData.sale_price = cost
    }

    // Store all extra data in metadata
    productData.metadata = {
      imported_from: 'Excel',
      import_date: new Date().toISOString(),
      cost: cost,
      referencia_interna: body['Referencia interna'] || body['Referência interna'] || '',
      marcadores: body['Marcadores'] || '',
      decoracao_atividade: body['Decoracao de atividade excepcional'] || body['Decoração de atividade excepcional'] || '',
      original_excel_data: body
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
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
          source: 'Excel import v3'
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
    console.error('Error in POST /api/products/import-excel-v3:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}