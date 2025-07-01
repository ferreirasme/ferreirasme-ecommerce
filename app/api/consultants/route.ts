import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAdminAuth, getUserFromHeaders } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"
import { sendConsultantWelcomeEmail } from "@/lib/resend"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request)
    if (rateLimitResult) return rateLimitResult

    // Check authentication
    const user = await checkAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('consultants')
      .select('*, clients(count)', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,code.ilike.%${search}%`)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // If user is a consultant, only show their own data
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (consultantData) {
        query = query.eq('id', consultantData.id)
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching consultants:', error)
      return NextResponse.json({ error: 'Failed to fetch consultants' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Error in GET /api/consultants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request, { limit: 10, window: 60 })
    if (rateLimitResult) return rateLimitResult

    // Check authentication and permissions
    const user = await checkAdminAuth(request)
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'phone']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate consultant code
    const { data: codeData } = await supabase
      .rpc('generate_consultant_code')
      .single()

    const consultantCode = codeData || `CONS${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || Math.random().toString(36).slice(-8),
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        role: 'consultant'
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 400 }
      )
    }

    // Create consultant record
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .insert({
        user_id: authData.user.id,
        code: consultantCode,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
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
        bank_account_holder: body.bank_account_holder,
        commission_percentage: body.commission_percentage || 10,
        monthly_target: body.monthly_target || 0,
        commission_period_days: body.commission_period_days || 45,
        notes: body.notes,
        status: 'pending',
        consent_date: new Date().toISOString(),
        consent_version: '1.0.0',
        consent_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        created_by: user.id
      })
      .select()
      .single()

    if (consultantError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: `Failed to create consultant: ${consultantError.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'consultants',
        record_id: consultant.id,
        action: 'INSERT',
        user_id: user.id,
        new_data: consultant,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    // Send welcome email
    const temporaryPassword = body.password || Math.random().toString(36).slice(-8)
    const consultantData = {
      id: consultant.id,
      code: consultant.code,
      status: consultant.status,
      firstName: consultant.full_name.split(' ')[0],
      lastName: consultant.full_name.split(' ').slice(1).join(' '),
      email: consultant.email,
      phone: consultant.phone,
      birthDate: consultant.birth_date,
      nif: consultant.nif,
      iban: consultant.bank_iban,
      bankName: consultant.bank_name,
      address: {
        street: consultant.address_street,
        number: consultant.address_number,
        complement: consultant.address_complement,
        city: consultant.address_city,
        state: consultant.address_state,
        postalCode: consultant.address_postal_code,
        country: consultant.address_country || 'PT'
      },
      joinDate: consultant.created_at,
      commissionRate: consultant.commission_percentage,
      clientIds: [],
      createdAt: consultant.created_at,
      updatedAt: consultant.updated_at
    }

    await sendConsultantWelcomeEmail(consultantData, temporaryPassword)

    return NextResponse.json(consultant, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/consultants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}