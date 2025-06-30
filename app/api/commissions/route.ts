import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { checkAdminAuth } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const rateLimitResult = await rateLimiter.limit(identifier, 60)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      )
    }

    // Check authentication
    const user = await checkAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const consultantId = searchParams.get('consultantId') || ''
    const status = searchParams.get('status') || 'all'
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '')

    // Build query
    let query = supabase
      .from('consultant_commissions')
      .select(`
        *,
        consultant:consultants(id, code, full_name, bank_iban),
        client:clients(full_name),
        order:orders(order_number, customer_name)
      `, { count: 'exact' })

    // Apply filters
    if (consultantId) {
      query = query.eq('consultant_id', consultantId)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    query = query
      .eq('reference_month', month)
      .eq('reference_year', year)

    // If user is a consultant, only show their commissions
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (consultantData) {
        query = query.eq('consultant_id', consultantData.id)
      } else {
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
      console.error('Error fetching commissions:', error)
      return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
    }

    // Calculate summary statistics
    const summary = {
      total: count || 0,
      pending: 0,
      approved: 0,
      paid: 0,
      cancelled: 0,
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0
    }

    if (data) {
      data.forEach(commission => {
        summary[commission.status as keyof typeof summary]++
        summary.totalAmount += commission.commission_amount
        summary[`${commission.status}Amount` as keyof typeof summary] += commission.commission_amount
      })
    }

    return NextResponse.json({
      data: data || [],
      summary,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Error in GET /api/commissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const rateLimitResult = await rateLimiter.limit(identifier, 20)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      )
    }

    // Check authentication - only admin/manager can manually create commissions
    const user = await checkAdminAuth(request)
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['consultant_id', 'order_id', 'order_total', 'commission_percentage']
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Calculate commission amount
    const commissionAmount = body.order_total * (body.commission_percentage / 100)

    // Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from('consultant_commissions')
      .insert({
        consultant_id: body.consultant_id,
        order_id: body.order_id,
        client_id: body.client_id,
        order_total: body.order_total,
        commission_percentage: body.commission_percentage,
        commission_amount: commissionAmount,
        reference_month: body.reference_month || new Date().getMonth() + 1,
        reference_year: body.reference_year || new Date().getFullYear(),
        status: body.status || 'pending',
        notes: body.notes
      })
      .select()
      .single()

    if (commissionError) {
      return NextResponse.json(
        { error: `Failed to create commission: ${commissionError.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'consultant_commissions',
        record_id: commission.id,
        action: 'INSERT',
        user_id: user.id,
        new_data: commission,
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json(commission, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/commissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}