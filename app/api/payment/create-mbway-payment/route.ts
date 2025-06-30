import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// MB Way é geralmente integrado através de gateways de pagamento portugueses
// como SIBS, Easypay, ou IFTHENPAY
// Este é um exemplo simplificado - você precisará integrar com o gateway específico

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerInfo, phoneNumber } = body

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
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
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