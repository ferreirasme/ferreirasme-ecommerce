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
      ...items.map((item: any) => {
        console.log('Processing item:', item)
        
        // Garantir que a URL da imagem seja absoluta
        const imageUrl = item.image_url?.startsWith('http') 
          ? item.image_url 
          : item.image_url 
            ? `${process.env.NEXT_PUBLIC_URL}${item.image_url}`
            : undefined
            
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.name,
              images: imageUrl ? [imageUrl] : [],
            },
            unit_amount: Math.round(item.price * 100), // Converter para centavos
          },
          quantity: item.quantity,
        }
      }),
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

    console.log('Creating checkout session with:', {
      itemsCount: lineItems.length,
      customer: customer.id,
      total: subtotal + (shipping / 100)
    })

    // Criar sessão de checkout
    const sessionConfig: any = {
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout`,
      shipping_address_collection: {
        allowed_countries: ['PT'], // Apenas Portugal
      },
      metadata: {
        // Limitar tamanho dos metadados (máximo 500 caracteres por chave)
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        shipping_city: customerInfo.city,
      },
    }

    console.log('Session config:', JSON.stringify(sessionConfig, null, 2))
    
    const session = await stripe.checkout.sessions.create(sessionConfig)

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