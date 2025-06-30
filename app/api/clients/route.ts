import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAdminAuth } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"
import { sendNewClientLinkedEmail } from "@/lib/resend"

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
    const consultantId = searchParams.get('consultantId') || ''
    const status = searchParams.get('status') || 'all'

    // Build query
    let query = supabase
      .from('clients')
      .select(`
        *,
        consultant:consultants(id, code, full_name)
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (consultantId) {
      query = query.eq('consultant_id', consultantId)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // If user is a consultant, only show their clients
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (consultantData) {
        query = query.eq('consultant_id', consultantData.id)
      } else {
        // Consultant not found, return empty
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        })
      }
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Error in GET /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request, { limit: 30, window: 60 })
    if (rateLimitResult) return rateLimitResult

    // Check authentication
    const user = await checkAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'consultant_id']
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

    // If consultant role, verify they're adding to their own consultant ID
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!consultantData || consultantData.id !== body.consultant_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if client already exists for this consultant
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('consultant_id', body.consultant_id)
      .eq('email', body.email)
      .single()

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists for this consultant' },
        { status: 400 }
      )
    }

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        consultant_id: body.consultant_id,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        birth_date: body.birth_date,
        address: body.address,
        status: body.status || 'active',
        source: body.source || 'manual',
        notes: body.notes,
        tags: body.tags,
        marketing_consent: body.marketing_consent || false,
        data_sharing_consent: body.data_sharing_consent || false,
        consent_date: body.marketing_consent || body.data_sharing_consent ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (clientError) {
      return NextResponse.json(
        { error: `Failed to create client: ${clientError.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'clients',
        record_id: client.id,
        action: 'INSERT',
        user_id: user.id,
        new_data: client,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    // Send email notification to consultant
    const { data: consultant } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', body.consultant_id)
      .single()

    if (consultant) {
      // Check consultant preferences for email notifications
      const { data: preferences } = await supabase
        .from('consultant_preferences')
        .select('preferences')
        .eq('consultant_id', consultant.id)
        .single()

      if (preferences?.preferences?.email_new_client !== false) {
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

        const clientData = {
          id: client.id,
          consultantId: client.consultant_id,
          status: client.status,
          firstName: client.full_name.split(' ')[0],
          lastName: client.full_name.split(' ').slice(1).join(' '),
          email: client.email,
          phone: client.phone,
          address: client.address,
          registrationDate: client.created_at,
          lastPurchaseDate: undefined,
          totalPurchases: 0,
          totalSpent: 0,
          createdAt: client.created_at,
          updatedAt: client.updated_at
        }

        await sendNewClientLinkedEmail(consultantData, clientData)
      }
    }

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}