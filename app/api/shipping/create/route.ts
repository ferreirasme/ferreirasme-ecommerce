import { NextRequest, NextResponse } from "next/server"
import { cttClient } from "@/lib/ctt/client"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json(
        { message: "ID do pedido é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    if (order.status !== 'processing') {
      return NextResponse.json(
        { message: "Pedido não está pronto para envio" },
        { status: 400 }
      )
    }

    // Calcular peso total
    let totalWeight = 0
    for (const item of order.order_items) {
      const { data: product } = await supabase
        .from("products")
        .select("metadata")
        .eq("id", item.product_id)
        .single()

      if (product?.metadata?.weight) {
        totalWeight += product.metadata.weight * item.quantity
      } else {
        totalWeight += 100 * item.quantity
      }
    }
    totalWeight += 200 // peso da embalagem

    // Dados do remetente (loja)
    const remetente = {
      nome: process.env.NEXT_PUBLIC_STORE_NAME || "Ferreiras ME",
      morada: `${process.env.STORE_STREET || "Rua do Comércio"}, ${process.env.STORE_NUMBER || "123"}`,
      localidade: process.env.STORE_CITY || "Lisboa",
      codigo_postal: process.env.STORE_POSTAL_CODE || "1200-195",
      telefone: process.env.STORE_PHONE || "213456789",
      email: process.env.STORE_EMAIL || "geral@ferreirasme.pt"
    }

    // Dados do destinatário
    const shippingAddress = order.shipping_address as any
    const destinatario = {
      nome: shippingAddress.name || order.email,
      morada: `${shippingAddress.street_address}${shippingAddress.street_number ? ', ' + shippingAddress.street_number : ''}${shippingAddress.floor ? ', ' + shippingAddress.floor : ''}`,
      localidade: shippingAddress.city,
      codigo_postal: shippingAddress.postal_code,
      telefone: shippingAddress.phone || order.phone,
      email: order.email
    }

    // Dados da encomenda
    const encomenda = {
      peso: totalWeight / 1000, // converter para kg
      comprimento: 20,
      largura: 15,
      altura: 5,
      valor_declarado: order.total,
      conteudo: 'Semijoias'
    }

    // Criar envio no CTT
    const shipment = await cttClient.createShipment(
      remetente,
      destinatario,
      encomenda,
      shippingAddress.shipping_method || 'EXPRESSO',
      order.order_number
    )

    // Atualizar pedido com informações de envio
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: 'shipped',
        metadata: {
          ...order.metadata,
          numero_envio: shipment.numero_envio,
          tracking_code: shipment.tracking_code,
          etiqueta_url: shipment.etiqueta_url,
          guia_transporte_url: shipment.guia_transporte_url,
          shipped_at: new Date().toISOString()
        }
      })
      .eq("id", order_id)

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError)
    }

    // TODO: Enviar email de notificação ao cliente com número de rastreamento

    return NextResponse.json({
      message: "Envio criado com sucesso",
      numero_envio: shipment.numero_envio,
      tracking_code: shipment.tracking_code,
      etiqueta_url: shipment.etiqueta_url,
      guia_transporte_url: shipment.guia_transporte_url
    })

  } catch (error) {
    console.error("Erro ao criar envio:", error)
    return NextResponse.json(
      { message: "Erro ao criar envio. Tente novamente." },
      { status: 500 }
    )
  }
}