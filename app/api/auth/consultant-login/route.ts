import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json()

    if (!code || !password) {
      return NextResponse.json(
        { error: 'Código e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Find consultant by code
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (consultantError || !consultant) {
      return NextResponse.json(
        { error: 'Código de consultora inválido' },
        { status: 401 }
      )
    }

    // Check if consultant is active
    if (consultant.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Conta de consultora inativa ou suspensa' },
        { status: 403 }
      )
    }

    // Sign in with consultant's email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: consultant.email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Falha ao criar sessão' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    // Log the access
    await supabase.from('access_logs').insert({
      user_id: data.user.id,
      action: 'login',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: { 
        method: 'consultant_code', 
        consultant_id: consultant.id 
      }
    })

    // Update profile metadata
    await supabase
      .from('profiles')
      .update({
        metadata: {
          ...profile.metadata,
          consultant_id: consultant.id,
          role: 'consultant',
          last_login: new Date().toISOString(),
          login_count: (profile.metadata?.login_count || 0) + 1
        }
      })
      .eq('id', data.user.id)

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        phone: profile.phone,
        role: 'consultant',
        metadata: {
          ...profile.metadata,
          consultant_id: consultant.id
        }
      },
      consultant: {
        id: consultant.id,
        code: consultant.code,
        firstName: consultant.firstName,
        lastName: consultant.lastName,
        status: consultant.status,
        commissionRate: consultant.commissionRate
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      },
      requiresPasswordChange: profile.metadata?.first_login === true || consultant.metadata?.requires_password_change === true
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}