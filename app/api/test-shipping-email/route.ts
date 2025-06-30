import { NextRequest, NextResponse } from "next/server"
import { sendShippingNotificationEmail } from "@/lib/resend"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, orderNumber, trackingCode, customerName, shippingMethod } = body

    if (!email || !orderNumber || !trackingCode || !customerName) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const result = await sendShippingNotificationEmail(
      email,
      orderNumber,
      trackingCode,
      customerName,
      shippingMethod || 'EXPRESSO'
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email enviado com sucesso",
        data: result.data
      })
    } else {
      throw new Error('Falha ao enviar email')
    }

  } catch (error) {
    console.error("Erro ao enviar email de teste:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao enviar email. Verifique as configurações do Resend." },
      { status: 500 }
    )
  }
}