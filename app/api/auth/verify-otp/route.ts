import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Usar supabaseAdmin para verificar OTP (ignora RLS)
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      console.error('OTP verification error:', otpError)
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    // Marcar como usado
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id)

    // OTP verificado com sucesso!
    // Em um sistema real, você criaria uma sessão aqui
    // Por agora, vamos apenas retornar sucesso
    
    // Verificar se o usuário existe no profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    return NextResponse.json({ 
      success: true,
      message: 'Código verificado com sucesso!',
      user: {
        email,
        profile_exists: !!profile
      },
      // Em desenvolvimento, informar sobre próximos passos
      ...(process.env.NODE_ENV === 'development' && {
        dev_note: 'OTP verificado. Em produção, isso criaria uma sessão de usuário.'
      })
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}