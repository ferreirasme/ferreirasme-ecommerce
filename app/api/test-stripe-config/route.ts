import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar configuração
    const config = {
      stripePublicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      publicUrl: process.env.NEXT_PUBLIC_URL || 'não configurada',
    }

    // Tentar fazer uma chamada simples ao Stripe
    let stripeStatus = 'não testado'
    let stripeError = null
    
    if (config.stripeSecretKey) {
      try {
        // Listar produtos (chamada simples para testar conexão)
        const products = await stripe.products.list({ limit: 1 })
        stripeStatus = 'conectado'
      } catch (error: any) {
        stripeStatus = 'erro'
        stripeError = error.message
      }
    }

    return NextResponse.json({
      success: true,
      config,
      stripeStatus,
      stripeError,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}