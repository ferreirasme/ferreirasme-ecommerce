import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    // Try to select one product to see structure
    const { data: sampleProduct, error: selectError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows
      return NextResponse.json({ 
        error: 'Erro ao consultar produtos',
        details: selectError.message 
      }, { status: 400 })
    }

    // Try minimal insert to test required fields
    const testProduct = {
      name: 'TESTE-' + Date.now(),
      slug: 'teste-' + Date.now(),
      price: 1.00
    }

    const { data: created, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        message: 'Teste de inserção falhou',
        error: insertError.message,
        testData: testProduct,
        sampleProduct: sampleProduct || 'Nenhum produto encontrado',
        hint: 'O erro acima mostra quais campos são obrigatórios ou inválidos'
      })
    }

    // If insert worked, delete it
    if (created) {
      await supabase
        .from('products')
        .delete()
        .eq('id', created.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Estrutura mínima de produtos funciona',
      workingFields: Object.keys(testProduct),
      createdProduct: created,
      sampleProduct: sampleProduct || 'Nenhum produto encontrado'
    })

  } catch (error: any) {
    console.error('Error in GET /api/test-products-table:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}