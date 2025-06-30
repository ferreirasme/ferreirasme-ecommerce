import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

export async function GET(request: NextRequest) {
  try {
    // Teste 1: Verificar se conseguimos acessar o Stripe
    let test1 = { status: 'failed', error: null }
    try {
      const account = await stripe.accounts.retrieve()
      test1 = { status: 'success', error: null, accountId: account.id }
    } catch (error: any) {
      test1.error = error.message
    }

    // Teste 2: Criar um produto simples
    let test2 = { status: 'failed', error: null }
    try {
      const product = await stripe.products.create({
        name: 'Produto Teste',
      })
      test2 = { status: 'success', error: null, productId: product.id }
      // Deletar o produto de teste
      await stripe.products.del(product.id)
    } catch (error: any) {
      test2.error = error.message
    }

    // Teste 3: Criar uma sessão mínima
    let test3 = { status: 'failed', error: null }
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Teste',
            },
            unit_amount: 1000, // 10 EUR
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3005'}/checkout/sucesso`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3005'}/checkout`,
      })
      test3 = { status: 'success', error: null, sessionId: session.id }
    } catch (error: any) {
      test3.error = error.message
    }

    return NextResponse.json({
      success: true,
      tests: {
        'Conexão com Stripe': test1,
        'Criar produto': test2,
        'Criar sessão checkout': test3,
      },
      environment: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        publicUrl: process.env.NEXT_PUBLIC_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}