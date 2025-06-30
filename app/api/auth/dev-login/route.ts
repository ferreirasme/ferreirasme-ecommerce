import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  // APENAS PARA DESENVOLVIMENTO - REMOVER EM PRODUÇÃO
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Não disponível em produção" },
      { status: 403 }
    )
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuário existe ou criar
    let { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    
    let user = users?.users.find(u => u.email === email)

    if (!user) {
      // Criar usuário
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0]
        }
      })

      if (createError) {
        console.error('Erro ao criar usuário:', createError)
        return NextResponse.json(
          { error: "Erro ao criar usuário" },
          { status: 500 }
        )
      }

      user = newUser.user
    }

    // Criar sessão manualmente
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_URL}/conta`
      }
    })

    if (sessionError || !sessionData) {
      console.error('Erro ao criar sessão:', sessionError)
      return NextResponse.json(
        { error: "Erro ao criar sessão" },
        { status: 500 }
      )
    }

    // Verificar/criar perfil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: email,
          full_name: email.split('@')[0]
        })
    }

    return NextResponse.json({
      success: true,
      message: "Login de desenvolvimento criado",
      user: {
        id: user.id,
        email: user.email
      },
      magiclink: sessionData.properties?.action_link,
      dev_note: "Use o magiclink acima para fazer login ou acesse /conta diretamente"
    })

  } catch (error) {
    console.error("Erro no dev login:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}