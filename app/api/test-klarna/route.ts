import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

export async function GET(request: NextRequest) {
  try {
    // Teste simples do Klarna
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Teste Klarna',
            description: 'Produto de teste para verificar Klarna'
          },
          unit_amount: 2000, // 20 EUR
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3005'}/checkout/sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3005'}/checkout`,
      locale: 'pt',
      shipping_address_collection: {
        allowed_countries: ['PT'],
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      paymentMethods: session.payment_method_types,
      klarnaEnabled: session.payment_method_types?.includes('klarna'),
      message: 'Klarna está ativo! Acesse sessionUrl para testar'
    })
  } catch (error: any) {
    console.error('Erro no teste Klarna:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      type: error.type,
      rawError: error.raw
    }, { status: 400 })
  }
}