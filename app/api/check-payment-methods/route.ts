import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

export async function GET(request: NextRequest) {
  try {
    // Criar uma sessão de teste para verificar métodos disponíveis
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Test Product',
          },
          unit_amount: 1000, // 10 EUR
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3005'}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3005'}/cancel`,
      // Configurar para Portugal
      shipping_address_collection: {
        allowed_countries: ['PT'],
      },
      locale: 'pt',
    })

    // Verificar configurações de pagamento
    const paymentMethodConfig = await stripe.paymentMethodConfigurations.list({
      limit: 10,
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      paymentMethods: session.payment_method_types,
      locale: session.locale,
      availableConfigurations: paymentMethodConfig.data.map(config => ({
        id: config.id,
        active: config.active,
        name: config.name,
      })),
      klarnaAvailable: session.payment_method_types?.includes('klarna'),
      message: 'Verifique o console para mais detalhes'
    })
  } catch (error: any) {
    console.error('Erro ao verificar métodos de pagamento:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code,
      // Se o erro for sobre Klarna não disponível
      klarnaIssue: error.message?.includes('klarna') || error.code === 'payment_method_type_invalid',
      suggestion: 'Klarna pode não estar disponível para sua conta ou região'
    }, { status: 400 })
  }
}