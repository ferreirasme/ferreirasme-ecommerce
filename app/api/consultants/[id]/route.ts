import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { checkAdminAuth } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // If consultant role, check if they're accessing their own data
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!consultantData || consultantData.id !== params.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('consultants')
      .select(`
        *,
        clients(count),
        consultant_commissions(
          id,
          order_total,
          commission_amount,
          status,
          created_at
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch consultant' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/consultants/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const rateLimitResult = await rateLimiter.limit(identifier, 30)
    
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

    // If consultant role, check if they're updating their own data
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!consultantData || consultantData.id !== params.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Remove fields that shouldn't be updated
    const {
      id,
      user_id,
      code,
      created_at,
      created_by,
      total_sales,
      total_commission_earned,
      ...updateData
    } = body

    // Update consultant
    const { data, error } = await supabase
      .from('consultants')
      .update({
        ...updateData,
        updated_by: user.id
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to update consultant: ${error.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'consultants',
        record_id: params.id,
        action: 'UPDATE',
        user_id: user.id,
        old_data: { id: params.id },
        new_data: updateData,
        changed_fields: Object.keys(updateData),
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/consultants/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const rateLimitResult = await rateLimiter.limit(identifier, 10)
    
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

    // Check authentication and permissions
    const user = await checkAdminAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get consultant data before deletion
    const { data: consultant } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!consultant) {
      return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
    }

    // Schedule deletion (LGPD compliance)
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30) // 30 days retention

    const { error } = await supabase
      .from('consultants')
      .update({
        deletion_requested_at: new Date().toISOString(),
        deletion_scheduled_for: deletionDate.toISOString(),
        status: 'inactive'
      })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: `Failed to schedule deletion: ${error.message}` },
        { status: 400 }
      )
    }

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'consultants',
        record_id: params.id,
        action: 'DELETE',
        user_id: user.id,
        old_data: consultant,
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      message: 'Consultant deletion scheduled',
      deletion_date: deletionDate.toISOString()
    })
  } catch (error) {
    console.error('Error in DELETE /api/consultants/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}