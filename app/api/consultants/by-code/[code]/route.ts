import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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