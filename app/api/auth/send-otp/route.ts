import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendOTPEmail } from '@/lib/resend'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limiter'
import { emailSchema } from '@/lib/security/input-validation'
import { generateSecureOTP, getOTPExpiration, OTP_CONFIG } from '@/lib/security/otp'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit('otp-send', {
      uniqueTokenPerInterval: 5, // 5 OTP requests per minute
      interval: 60000,
    })

    const rateLimitResponse = createRateLimitResponse(rateLimitResult)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    
    // Validate input
    const emailValidation = emailSchema.safeParse(body.email)
    if (!emailValidation.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const email = emailValidation.data

    // Verificar se RESEND_API_KEY está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY não está configurada no .env.local')
      return NextResponse.json(
        { error: 'Serviço de email não configurado. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // Generate secure OTP
    const otp = generateSecureOTP(OTP_CONFIG.length)
    const expiresAt = getOTPExpiration()

    // Usar supabaseAdmin para ignorar RLS
    // Marcar códigos anteriores como usados
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)

    const { data: insertData, error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email,
        code: otp,
        expires_at: expiresAt.toISOString(),
      })
      .select()

    if (dbError) {
      console.error('Database error details:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      
      // Se for erro de RLS, tentar sem RLS (apenas para debug)
      if (dbError.code === '42501') {
        return NextResponse.json(
          { error: 'Erro de permissão no banco. Verifique as políticas RLS.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro ao gerar código: ${dbError.message}` },
        { status: 500 }
      )
    }
    
    console.log('OTP inserido com sucesso:', insertData)

    console.log(`Enviando OTP ${otp} para ${email}`)
    const { success, error: emailError } = await sendOTPEmail(email, otp)

    if (!success) {
      console.error('Email error:', emailError)
      
      // Se o email falhar mas estivermos em desenvolvimento, ainda permitir login
      if (process.env.NODE_ENV === 'development') {
        console.log(`MODO DESENVOLVIMENTO - Código OTP: ${otp}`)
        return NextResponse.json({ 
          success: true,
          development: true,
          message: `Código: ${otp}` 
        })
      }
      
      return NextResponse.json(
        { error: 'Erro ao enviar email. Verifique se o email está correto.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}