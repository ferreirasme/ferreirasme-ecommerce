import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "ID do pedido não fornecido" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar pedido
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Erro ao buscar pedido:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}