import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerInfo } = body

    console.log('Checkout request received:', { items, customerInfo })

    // Verificar se temos itens
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      )
    }

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY não está configurada')
      return NextResponse.json(
        { error: 'Configuração de pagamento inválida' },
        { status: 500 }
      )
    }

    // Criar ou obter cliente no Stripe
    const customer = await stripe.customers.create({
      email: customerInfo.email,
      name: `${customerInfo.firstName} ${customerInfo.lastName}`,
      phone: customerInfo.phone,
      address: {
        line1: customerInfo.address,
        line2: customerInfo.addressComplement || undefined,
        city: customerInfo.city,
        postal_code: customerInfo.postalCode,
        country: 'PT', // Portugal
      },
    })

    // Calcular valores
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )
    const shipping = subtotal > 50 ? 0 : 599 // Em centavos

    // Criar itens de linha para o Stripe
    const lineItems = [
      ...items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: item.image_url ? [item.image_url] : [],
          },
          unit_amount: Math.round(item.price * 100), // Converter para centavos
        },
        quantity: item.quantity,
      })),
    ]

    // Adicionar frete se aplicável
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Envio',
          },
          unit_amount: shipping,
        },
        quantity: 1,
      })
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout`,
      metadata: {
        customerInfo: JSON.stringify(customerInfo),
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error)
    
    // Retornar erro mais específico
    const errorMessage = error.message || 'Erro ao processar pagamento'
    const errorDetails = {
      error: errorMessage,
      type: error.type || 'unknown_error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        raw: error.raw 
      })
    }
    
    return NextResponse.json(
      errorDetails,
      { status: error.statusCode || 500 }
    )
  }
}