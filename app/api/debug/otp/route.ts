import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar todos os códigos OTP para este email
    const { data: otpCodes, error } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar OTP:', error)
      return NextResponse.json(
        { error: "Erro ao buscar códigos OTP" },
        { status: 500 }
      )
    }

    // Informações do servidor
    const serverTime = new Date().toISOString()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return NextResponse.json({
      otp_codes: otpCodes || [],
      server_time: serverTime,
      timezone: timezone,
      total_codes: otpCodes?.length || 0
    })

  } catch (error) {
    console.error("Erro no debug OTP:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}