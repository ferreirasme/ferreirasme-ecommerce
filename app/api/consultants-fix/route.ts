import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'phone']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        )
      }
    }

    // Generate consultant code using database function or random
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_consultant_code')
      .single()
    
    const consultantCode = codeData || `CONS${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    // Check if auth user already exists
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === body.email)

    let userId: string

    if (existingUser) {
      console.log('Usuário Auth já existe:', existingUser.email)
      userId = existingUser.id

      // Check if consultant record already exists
      const { data: existingConsultant } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingConsultant) {
        return NextResponse.json({
          error: 'Esta consultora já está cadastrada',
          consultant: {
            id: existingConsultant.id,
            code: existingConsultant.code,
            full_name: existingConsultant.full_name,
            email: existingConsultant.email
          }
        }, { status: 400 })
      }
    } else {
      // Create auth user if doesn't exist
      const { data: { user }, error: authError } = await adminSupabase.auth.admin.createUser({
        email: body.email,
        password: body.password || Math.random().toString(36).slice(-8),
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name,
          role: 'consultant'
        }
      })

      if (authError || !user) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: `Erro ao criar usuário: ${authError?.message || 'Unknown error'}` },
          { status: 400 }
        )
      }

      userId = user.id
    }

    // Create consultant record
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .insert({
        user_id: userId,
        code: consultantCode,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp || body.phone,
        nif: body.nif,
        birth_date: body.birth_date,
        address_street: body.address_street,
        address_number: body.address_number,
        address_complement: body.address_complement,
        address_neighborhood: body.address_neighborhood,
        address_city: body.address_city,
        address_state: body.address_state,
        address_postal_code: body.address_postal_code,
        address_country: body.address_country || 'PT',
        bank_name: body.bank_name,
        bank_iban: body.bank_iban,
        bank_account_holder: body.bank_account_holder || body.full_name,
        commission_percentage: body.commission_percentage || 10,
        monthly_target: body.monthly_target || 0,
        commission_period_days: body.commission_period_days || 45,
        notes: body.notes,
        status: 'active',
        consent_date: new Date().toISOString(),
        consent_version: '1.0.0',
        created_by: admin.id
      })
      .select()
      .single()

    if (consultantError) {
      console.error('Consultant error:', consultantError)
      
      // If user was just created and consultant creation failed, delete the user
      if (!existingUser) {
        await adminSupabase.auth.admin.deleteUser(userId)
      }
      
      return NextResponse.json(
        { error: `Erro ao criar consultora: ${consultantError.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'CREATE_CONSULTANT',
        entity_type: 'consultant',
        entity_id: consultant.id,
        details: {
          consultant_name: consultant.full_name,
          consultant_code: consultant.code,
          reused_auth_user: !!existingUser
        }
      })

    console.log('Consultora criada com sucesso:', consultant.code)

    return NextResponse.json({
      success: true,
      consultant: {
        id: consultant.id,
        code: consultant.code,
        full_name: consultant.full_name,
        email: consultant.email
      },
      message: existingUser 
        ? 'Consultora criada usando usuário existente' 
        : 'Consultora criada com novo usuário'
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error in POST /api/consultants-fix:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}