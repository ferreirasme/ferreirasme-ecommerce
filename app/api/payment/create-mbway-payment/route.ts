import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// MB Way é geralmente integrado através de gateways de pagamento portugueses
// como SIBS, Easypay, ou IFTHENPAY
// Este é um exemplo simplificado - você precisará integrar com o gateway específico

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerInfo, phoneNumber, consultantCode } = body

    // Validar número de telefone português
    const phoneRegex = /^(?:\+351)?9[1236]\d{7}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Número de telefone inválido' },
        { status: 400 }
      )
    }

    // Calcular total
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )
    const shipping = subtotal > 50 ? 0 : 5.99
    const total = subtotal + shipping

    // Criar pedido no banco de dados
    const supabase = await createClient()
    
    // Se houver código de consultora, buscar o ID da consultora
    let consultantId = null
    if (consultantCode) {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('code', consultantCode.toUpperCase())
        .eq('status', 'active')
        .single()
      
      if (consultantData) {
        consultantId = consultantData.id
      }
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_phone: customerInfo.phone,
        shipping_address: {
          address: customerInfo.address,
          complement: customerInfo.addressComplement,
          city: customerInfo.city,
          postal_code: customerInfo.postalCode,
        },
        items: items,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        payment_method: 'mbway',
        payment_status: 'pending',
        status: 'pending',
        consultant_id: consultantId,
        consultant_code: consultantCode || null,
      })
      .select()
      .single()

    if (orderError) {
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
          client_id: customerInfo.email, // Usando email como identificador temporário
          order_amount: total,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          order_date: new Date().toISOString(),
          status: 'pending',
          order_details: {
            orderNumber: order.id,
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            items: items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            }))
          }
        })
      
      if (commissionError) {
        console.error('Erro ao criar comissão:', commissionError)
        // Não falhar o pedido se houver erro na comissão
      }
    }

    // Aqui você integraria com o gateway de MB Way
    // Por exemplo, com SIBS API Gateway:
    /*
    const mbwayResponse = await fetch('https://api.sibsgateway.com/mbway/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SIBS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: total * 100, // Em centavos
        phoneNumber: phoneNumber,
        reference: order.id,
        description: `Pedido #${order.id}`,
      }),
    })
    */

    // Por agora, vamos simular uma resposta de sucesso
    const mockResponse = {
      transactionId: `MBWAY_${Date.now()}`,
      reference: order.id,
      status: 'pending',
      message: 'Pedido de pagamento enviado para o seu telemóvel',
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      mbway: mockResponse,
    })
  } catch (error) {
    console.error('Erro ao processar pagamento MB Way:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}