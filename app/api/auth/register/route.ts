import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, profile, address } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profile.full_name
        }
      }
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { message: "Este email já está cadastrado" },
          { status: 400 }
        )
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error("Falha ao criar usuário")
    }

    // Atualizar o perfil do usuário com os dados adicionais
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        nif: profile.nif,
        birth_date: profile.birth_date,
        gender: profile.gender,
        newsletter: profile.newsletter || false,
        marketing_consent: profile.marketing_consent || false
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError)
    }

    // Criar endereço do usuário
    if (address) {
      const { error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: authData.user.id,
          type: "both",
          name: profile.full_name,
          street_address: address.street_address,
          street_number: address.street_number,
          floor: address.floor,
          postal_code: address.postal_code,
          city: address.city,
          region: address.region,
          country: address.country || "PT",
          phone: profile.phone,
          is_default: true
        })

      if (addressError) {
        console.error("Erro ao criar endereço:", addressError)
      }
    }

    return NextResponse.json(
      { 
        message: "Conta criada com sucesso! Verifique seu email para confirmar o cadastro.",
        user: authData.user
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erro ao criar conta:", error)
    return NextResponse.json(
      { message: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    )
  }
}