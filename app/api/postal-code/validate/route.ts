import { NextRequest, NextResponse } from "next/server"
import { validatePortuguesePostalCode } from "@/lib/postal-codes-portugal"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postalCode = searchParams.get("code")

    if (!postalCode) {
      return NextResponse.json(
        { message: "Código postal é obrigatório" },
        { status: 400 }
      )
    }

    // Validar formato do código postal
    const postalCodeRegex = /^[0-9]{4}-[0-9]{3}$/
    if (!postalCodeRegex.test(postalCode)) {
      return NextResponse.json(
        { message: "Código postal inválido. Use o formato XXXX-XXX" },
        { status: 400 }
      )
    }

    // Usar a base de dados completa de Portugal
    const result = validatePortuguesePostalCode(postalCode)

    if (!result.valid) {
      return NextResponse.json(
        { 
          valid: false,
          message: result.message || "Código postal não encontrado" 
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      valid: true,
      postal_code: result.postal_code,
      locality: result.locality,
      municipality: result.municipality,
      district: result.district,
      parish: result.parish,
      street: result.street
    })

  } catch (error) {
    console.error("Erro ao validar código postal:", error)
    return NextResponse.json(
      { message: "Erro ao validar código postal" },
      { status: 500 }
    )
  }
}