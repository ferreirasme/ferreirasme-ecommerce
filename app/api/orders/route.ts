import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerInfo, paymentMethod } = body

    // Calcular totais
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
        customer_nif: customerInfo.nif || null,
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
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'transfer' ? 'pending' : 'processing',
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError)
      throw orderError
    }

    return NextResponse.json({ 
      success: true,
      orderId: order.id 
    })
  } catch (error) {
    console.error('Erro ao processar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}