import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { requireAdmin } from '@/lib/security/auth-middleware'

export async function GET() {
  try {
    // Block access in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is disabled in production' },
        { status: 403 }
      )
    }

    // Require admin authentication
    const authResult = await requireAdmin()
    if ('status' in authResult) {
      return authResult
    }
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY não está configurada'
      })
    }

    // Tentar enviar um email de teste
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['delivered@resend.dev'], // Email de teste do Resend
      subject: 'Teste de Configuração - Ferreiras ME',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Teste de Email</h2>
          <p>Este é um email de teste para verificar se o Resend está configurado corretamente.</p>
          <p>Data: ${new Date().toLocaleString('pt-PT')}</p>
        </div>
      `
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message || 'Erro ao enviar email',
        details: error
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email de teste enviado com sucesso!',
      data
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar requisição',
      details: error instanceof Error ? error.message : error
    })
  }
}