import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    
    const { code } = params

    if (!code) {
      return NextResponse.json(
        { error: "Código não fornecido" },
        { status: 400 }
      )
    }

    // Buscar consultora pelo código
    const { data, error } = await supabase
      .from('consultants')
      .select('id, code, full_name, email, phone, whatsapp, commission_percentage')
      .eq('code', code.toUpperCase())
      .eq('status', 'active') // Apenas consultoras ativas
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Consultora não encontrada ou inativa" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar consultora:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}