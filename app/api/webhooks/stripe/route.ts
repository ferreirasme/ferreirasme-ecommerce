import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Extrair informações do cliente dos metadados
        const customerInfo = JSON.parse(session.metadata?.customerInfo || '{}')
        
        // Buscar detalhes completos da sessão
        const fullSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items'] }
        )

        // Calcular totais
        const subtotal = fullSession.amount_subtotal ? fullSession.amount_subtotal / 100 : 0
        const total = fullSession.amount_total ? fullSession.amount_total / 100 : 0
        const shipping = total - subtotal

        // Criar pedido no banco de dados
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            stripe_session_id: session.id,
            customer_email: session.customer_email || customerInfo.email,
            customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customer_phone: customerInfo.phone,
            customer_nif: customerInfo.nif || null,
            shipping_address: {
              address: customerInfo.address,
              complement: customerInfo.addressComplement,
              city: customerInfo.city,
              postal_code: customerInfo.postalCode,
            },
            items: fullSession.line_items?.data.map((item: any) => ({
              name: item.description,
              price: item.price.unit_amount / 100,
              quantity: item.quantity,
            })) || [],
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            payment_method: 'card',
            payment_status: 'paid',
            status: 'processing',
          })
          .select()
          .single()

        if (orderError) {
          console.error('Erro ao criar pedido:', orderError)
          throw orderError
        }

        // Aqui você pode enviar email de confirmação
        console.log('Pedido criado com sucesso:', order.id)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        console.log('Pagamento confirmado:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log('Pagamento falhou:', paymentIntent.id)
        
        // Atualizar status do pedido se existir
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            status: 'cancelled' 
          })
          .match({ stripe_payment_intent_id: paymentIntent.id })
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}