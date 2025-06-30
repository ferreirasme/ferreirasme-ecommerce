import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRequirements = [
      { test: (pwd: string) => pwd.length >= 8, message: 'A senha deve ter pelo menos 8 caracteres' },
      { test: (pwd: string) => /[A-Z]/.test(pwd), message: 'A senha deve conter pelo menos uma letra maiúscula' },
      { test: (pwd: string) => /[a-z]/.test(pwd), message: 'A senha deve conter pelo menos uma letra minúscula' },
      { test: (pwd: string) => /[0-9]/.test(pwd), message: 'A senha deve conter pelo menos um número' },
      { test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), message: 'A senha deve conter pelo menos um caractere especial' },
    ]

    for (const requirement of passwordRequirements) {
      if (!requirement.test(newPassword)) {
        return NextResponse.json(
          { error: requirement.message },
          { status: 400 }
        )
      }
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 400 }
      )
    }

    // Update profile metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', user.id)
      .single()

    await supabase
      .from('profiles')
      .update({
        metadata: {
          ...profile?.metadata,
          first_login: false,
          password_changed_at: new Date().toISOString()
        }
      })
      .eq('id', user.id)

    // If consultant, update consultant metadata too
    if (profile?.metadata?.consultant_id) {
      await supabase
        .from('consultants')
        .update({
          metadata: {
            requires_password_change: false,
            password_changed_at: new Date().toISOString()
          }
        })
        .eq('id', profile.metadata.consultant_id)
    }

    // Log the password change
    await supabase.from('access_logs').insert({
      user_id: user.id,
      action: 'password_change',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: { 
        reason: 'first_access'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}