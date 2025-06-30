import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerInfo } = body

    console.log('Checkout request received:', JSON.stringify({ items, customerInfo }, null, 2))

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

    // Validar dados do cliente
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      return NextResponse.json(
        { error: 'Dados do cliente incompletos' },
        { status: 400 }
      )
    }

    // Criar ou obter cliente no Stripe - sanitizar dados para evitar caracteres especiais
    const customerData = {
      email: customerInfo.email,
      name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
      phone: customerInfo.phone || undefined,
      address: customerInfo.address ? {
        line1: `${customerInfo.address}${customerInfo.addressNumber ? ', ' + customerInfo.addressNumber : ''}`,
        line2: customerInfo.addressComplement || undefined,
        city: customerInfo.city || 'Lisboa',
        postal_code: customerInfo.postalCode || '1000-000',
        country: 'PT', // Portugal
      } : undefined,
    }

    console.log('Creating customer with:', JSON.stringify(customerData, null, 2))
    const customer = await stripe.customers.create(customerData)

    // Calcular valores
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )
    const shipping = subtotal > 50 ? 0 : 599 // Em centavos

    // Validar items
    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || !item.quantity) {
        console.error('Item inválido:', item)
        return NextResponse.json(
          { error: `Item inválido: ${JSON.stringify(item)}` },
          { status: 400 }
        )
      }
    }

    // Criar itens de linha para o Stripe
    const lineItems = [
      ...items.map((item: any) => {
        console.log('Processing item:', item)
        
        // Garantir que a URL da imagem seja absoluta e codificada
        let imageUrl = undefined
        if (item.image_url) {
          if (item.image_url.startsWith('http')) {
            imageUrl = item.image_url
          } else {
            const baseUrlForImages = process.env.NEXT_PUBLIC_URL || 'https://ferreirasme-ecommerce.vercel.app'
            imageUrl = `${baseUrlForImages}${item.image_url}`
          }
          // Garantir que a URL está codificada corretamente
          try {
            imageUrl = new URL(imageUrl).toString()
          } catch (e) {
            console.error('Invalid image URL:', imageUrl)
            imageUrl = undefined
          }
        }
            
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              // Remover acentos e caracteres especiais do nome do produto
              name: String(item.name || 'Produto')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s-]/g, '')
                .trim() || 'Produto',
              images: imageUrl ? [imageUrl] : [],
            },
            unit_amount: Math.max(50, Math.round((item.price || 0) * 100)), // Mínimo 50 centavos
          },
          quantity: parseInt(item.quantity) || 1,
        }
      }),
    ]

    // Frete agora é tratado via shipping_options, não mais como line item

    console.log('Creating checkout session with:', {
      itemsCount: lineItems.length,
      customer: customer.id,
      total: subtotal + (shipping / 100)
    })

    // Garantir URL base válida
    const host = request.headers.get('host')
    let baseUrl = process.env.NEXT_PUBLIC_URL || (host ? `https://${host}` : 'https://ferreirasme-ecommerce.vercel.app')
    
    // Garantir que não há '//' duplo
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    
    console.log('Base URL configuration:', { 
      env: process.env.NEXT_PUBLIC_URL, 
      host, 
      final: baseUrl 
    })
    
    // Criar sessão de checkout
    // Klarna confirmado disponível para Portugal
    const paymentMethods = ['card', 'klarna']
    
    const sessionConfig: any = {
      payment_method_types: paymentMethods,
      customer: customer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      locale: 'pt', // Português para interface do Stripe Checkout
      // Usar customer ID (não precisa customer_email quando tem customer)
      // customer_email: customerInfo.email, // Removido - já está no customer
      // Configurações de pagamento
      payment_intent_data: {
        metadata: {
          order_shipping_address: `${customerInfo.address}${customerInfo.addressNumber ? ', ' + customerInfo.addressNumber : ''}, ${customerInfo.city}, ${customerInfo.postalCode}`,
          order_customer_phone: customerInfo.phone,
        },
      },
      // Pré-preencher endereço de cobrança
      billing_address_collection: 'auto',
      // Informações de envio para o pedido
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: shipping,
              currency: 'eur',
            },
            display_name: shipping === 0 ? 'Envio Grátis' : 'Envio CTT',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            },
          },
        },
      ],
      metadata: {
        // Limitar tamanho dos metadados (máximo 500 caracteres por chave)
        // Remover caracteres especiais que podem causar problemas
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`.replace(/[^\w\s-]/g, ''),
        shipping_city: (customerInfo.city || 'Lisboa').replace(/[^\w\s-]/g, ''),
        // Adicionar endereço completo nos metadados
        shipping_address: `${customerInfo.address || ''}${customerInfo.addressNumber ? ', ' + customerInfo.addressNumber : ''}`.replace(/[^\w\s-,]/g, ''),
        shipping_postal_code: customerInfo.postalCode,
        phone: customerInfo.phone,
      },
    }

    console.log('Session config:', JSON.stringify(sessionConfig, null, 2))
    
    // Log das URLs para debug
    console.log('URLs being used:', {
      success: sessionConfig.success_url,
      cancel: sessionConfig.cancel_url,
      baseUrl: baseUrl
    })
    
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