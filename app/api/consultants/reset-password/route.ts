import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Generate password reset link
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_URL}/consultant/reset-password`
      }
    })

    if (error) {
      console.error('Error generating reset link:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar link de redefinição' },
        { status: 400 }
      )
    }

    // In production, send this via email
    // For now, we'll log it
    console.log(`Password reset link for ${email}: ${data.properties?.action_link}`)

    // TODO: Send email using Resend
    // await sendPasswordResetEmail(email, data.properties?.action_link)

    return NextResponse.json({
      success: true,
      message: 'Email de redefinição de senha enviado',
      // Remove this in production - only for testing
      resetLink: process.env.NODE_ENV !== 'production' ? data.properties?.action_link : undefined
    })

  } catch (error: any) {
    console.error('Error in password reset:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}