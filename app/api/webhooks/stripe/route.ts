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
        
        // Extrair informações dos metadados
        const metadata = session.metadata || {}
        const consultantCode = metadata.consultant_code
        
        // Buscar detalhes completos da sessão
        const fullSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items'] }
        )

        // Calcular totais
        const subtotal = fullSession.amount_subtotal ? fullSession.amount_subtotal / 100 : 0
        const total = fullSession.amount_total ? fullSession.amount_total / 100 : 0
        const shipping = total - subtotal

        // Buscar consultora se houver código
        let consultantId = null
        if (consultantCode) {
          const { data: consultantData } = await supabase
            .from('consultants')
            .select('id, commission_percentage')
            .eq('code', consultantCode.toUpperCase())
            .eq('status', 'active')
            .single()
          
          if (consultantData) {
            consultantId = consultantData.id
          }
        }

        // Criar pedido no banco de dados
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            customer_email: metadata.customer_email || session.customer_email,
            customer_name: metadata.customer_name || 'Cliente',
            customer_phone: metadata.phone || null,
            customer_nif: null,
            shipping_address: {
              address: metadata.shipping_address || '',
              city: metadata.shipping_city || '',
              postal_code: metadata.shipping_postal_code || '',
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
            consultant_id: consultantId,
            consultant_code: consultantCode || null,
          })
          .select()
          .single()

        if (orderError) {
          console.error('Erro ao criar pedido:', orderError)
          throw orderError
        }

        // Se houver consultora vinculada, criar registro de comissão
        if (consultantId && order) {
          const commissionRate = 10 // Taxa padrão de 10%
          const commissionAmount = total * (commissionRate / 100)
          
          const { error: commissionError } = await supabase
            .from('commissions')
            .insert({
              consultant_id: consultantId,
              order_id: order.id,
              client_id: metadata.customer_email || session.customer_email || '',
              order_amount: total,
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              order_date: new Date().toISOString(),
              status: 'pending',
              order_details: {
                orderNumber: order.id,
                customerName: metadata.customer_name || 'Cliente',
                items: fullSession.line_items?.data.map((item: any) => ({
                  name: item.description,
                  quantity: item.quantity,
                  price: item.price.unit_amount / 100
                })) || []
              }
            })
          
          if (commissionError) {
            console.error('Erro ao criar comissão:', commissionError)
            // Não falhar o webhook se houver erro na comissão
          } else {
            console.log(`Comissão criada para consultora ${consultantCode}: €${commissionAmount.toFixed(2)}`)
          }
        }

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