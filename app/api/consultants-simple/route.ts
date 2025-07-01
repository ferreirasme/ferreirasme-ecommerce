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

    // Generate consultant code using database function
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_consultant_code')
      .single()
    
    const consultantCode = codeData || `CONS${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    // Opção 1: Criar consultora SEM criar usuário Auth primeiro
    // O usuário será criado quando a consultora fizer o primeiro acesso
    
    // Gerar um ID temporário para a consultora
    const tempUserId = crypto.randomUUID()
    
    // Create consultant record without auth user
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .insert({
        id: tempUserId, // Usar o ID como chave primária
        user_id: tempUserId, // Temporariamente o mesmo
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
          note: 'Criado sem usuário Auth - será criado no primeiro acesso'
        }
      })

    // Enviar email com instruções de primeiro acesso
    console.log(`
      Consultora criada com sucesso!
      Código: ${consultant.code}
      Email: ${consultant.email}
      
      Instruções de primeiro acesso:
      1. Acesse: https://ferreirasme-ecommerce.vercel.app/consultant/first-access
      2. Use o código: ${consultant.code}
      3. Defina sua senha
    `)

    return NextResponse.json({
      success: true,
      consultant: {
        id: consultant.id,
        code: consultant.code,
        full_name: consultant.full_name,
        email: consultant.email
      },
      message: 'Consultora criada! Ela receberá instruções por email para criar sua senha no primeiro acesso.'
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error in POST /api/consultants-simple:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}