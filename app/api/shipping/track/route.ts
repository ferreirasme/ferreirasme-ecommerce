import { NextRequest, NextResponse } from "next/server"
import { cttClient } from "@/lib/ctt/client"

interface TrackingEvent {
  date: string
  description: string
  location: string
}

interface TrackingInfo {
  tracking_number: string
  status: string
  status_date: string
  events: TrackingEvent[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trackingNumber = searchParams.get("tracking_number")

    if (!trackingNumber) {
      return NextResponse.json(
        { message: "Número de rastreamento é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar informações de rastreamento
    const trackingInfo: TrackingInfo = await cttClient.trackShipment(trackingNumber)

    // Traduzir status para português
    const statusTranslations: Record<string, string> = {
      'pending': 'Pendente',
      'collected': 'Recolhido',
      'in_transit': 'Em trânsito',
      'out_for_delivery': 'Saiu para entrega',
      'delivered': 'Entregue',
      'failed': 'Falha na entrega',
      'returned': 'Devolvido'
    }

    const translatedStatus = statusTranslations[trackingInfo.status] || trackingInfo.status

    // Formatar resposta
    const formattedResponse = {
      tracking_number: trackingInfo.tracking_number,
      status: trackingInfo.status,
      status_text: translatedStatus,
      status_date: trackingInfo.status_date,
      events: trackingInfo.events.map(event => ({
        date: event.date,
        description: event.description,
        location: event.location,
        formatted_date: new Date(event.date).toLocaleString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }))
    }

    return NextResponse.json(formattedResponse)

  } catch (error) {
    console.error("Erro ao rastrear envio:", error)
    return NextResponse.json(
      { message: "Erro ao rastrear envio. Verifique o número de rastreamento." },
      { status: 500 }
    )
  }
}