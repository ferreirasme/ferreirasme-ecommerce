import { NextRequest, NextResponse } from "next/server"
import { cttClient } from "@/lib/ctt/client"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postal_code, items } = body

    if (!postal_code || !items || items.length === 0) {
      return NextResponse.json(
        { message: "Código postal e itens são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar código postal português
    const postalCodeRegex = /^[0-9]{4}-[0-9]{3}$/
    if (!postalCodeRegex.test(postal_code)) {
      return NextResponse.json(
        { message: "Código postal inválido. Use o formato XXXX-XXX" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Calcular peso total dos produtos
    let totalWeight = 0
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("metadata")
        .eq("id", item.product_id)
        .single()

      if (product?.metadata?.weight) {
        totalWeight += product.metadata.weight * item.quantity
      } else {
        // Peso padrão se não especificado (100g por item)
        totalWeight += 100 * item.quantity
      }
    }

    // Adicionar peso da embalagem (200g)
    totalWeight += 200

    // Dimensões padrão para semijoias (caixa pequena)
    const dimensions = {
      length: 20,
      width: 15,
      height: 5
    }

    // Validar código postal com CTT
    const postalValidation = await cttClient.validatePostalCode(postal_code)
    if (!postalValidation.valido) {
      return NextResponse.json(
        { message: "Código postal não encontrado" },
        { status: 400 }
      )
    }

    // Código postal de origem (da loja)
    const origem_cp = process.env.STORE_POSTAL_CODE || '1200-195'

    // Calcular opções de envio (peso em kg)
    const shippingRates = await cttClient.calculateShipping(
      origem_cp,
      postal_code,
      totalWeight / 1000 // converter gramas para kg
    )

    // Adicionar informações extras e formatar resposta
    const formattedRates = shippingRates.map(rate => ({
      id: rate.codigo_servico,
      name: rate.designacao_servico,
      price: rate.preco_total,
      price_formatted: `€${rate.preco_total.toFixed(2)}`,
      delivery_time: `${rate.prazo_entrega} dia${rate.prazo_entrega > 1 ? 's' : ''} útil`,
      tracking_available: rate.tracking_disponivel,
      description: getServiceDescription(rate.codigo_servico)
    }))

    return NextResponse.json({
      postal_code,
      city: postalValidation.localidade,
      region: postalValidation.concelho,
      district: postalValidation.distrito,
      total_weight: totalWeight,
      shipping_options: formattedRates
    })

  } catch (error) {
    console.error("Erro ao calcular frete:", error)
    return NextResponse.json(
      { message: "Erro ao calcular frete. Tente novamente." },
      { status: 500 }
    )
  }
}

function getServiceDescription(serviceId: string): string {
  const descriptions: Record<string, string> = {
    'EXPRESSO10': 'Entrega até às 10:30 do dia seguinte',
    'EXPRESSO': 'Entrega no próximo dia útil',
    'ECONOMICO': 'Entrega em 3-5 dias úteis',
    'CORREIO_VERDE': 'Entrega em 2 dias úteis com menor impacto ambiental'
  }

  return descriptions[serviceId] || 'Serviço de entrega padrão'
}