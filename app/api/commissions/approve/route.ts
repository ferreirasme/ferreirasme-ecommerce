import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { checkAdminAuth } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"
import { sendPaymentApprovedEmail } from "@/lib/resend"

export async function POST(request: NextRequest) {
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

    // Check authentication - only admin/manager can approve commissions
    const user = await checkAdminAuth(request)
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const body = await request.json()

    // Validate commission IDs
    if (!body.commissionIds || !Array.isArray(body.commissionIds) || body.commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'No commission IDs provided' },
        { status: 400 }
      )
    }

    const action = body.action || 'approve' // 'approve', 'pay', 'cancel'

    // Validate action
    if (!['approve', 'pay', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get current commissions
    const { data: currentCommissions, error: fetchError } = await supabase
      .from('consultant_commissions')
      .select('*')
      .in('id', body.commissionIds)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch commissions' },
        { status: 500 }
      )
    }

    // Validate commission states
    const invalidCommissions: string[] = []
    currentCommissions?.forEach(commission => {
      if (action === 'approve' && commission.status !== 'pending') {
        invalidCommissions.push(`Commission ${commission.id} is not pending`)
      } else if (action === 'pay' && commission.status !== 'approved') {
        invalidCommissions.push(`Commission ${commission.id} is not approved`)
      } else if (action === 'cancel' && ['paid', 'cancelled'].includes(commission.status)) {
        invalidCommissions.push(`Commission ${commission.id} cannot be cancelled`)
      }
    })

    if (invalidCommissions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid commission states', details: invalidCommissions },
        { status: 400 }
      )
    }

    // Prepare update data based on action
    let updateData: any = {}
    let newStatus = ''

    switch (action) {
      case 'approve':
        updateData = {
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        }
        newStatus = 'approved'
        break
      case 'pay':
        updateData = {
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: user.id,
          payment_method: body.paymentMethod || 'bank_transfer',
          payment_reference: body.paymentReference
        }
        newStatus = 'paid'
        break
      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: body.reason
        }
        newStatus = 'cancelled'
        break
    }

    // Update commissions
    const { data: updatedCommissions, error: updateError } = await supabase
      .from('consultant_commissions')
      .update(updateData)
      .in('id', body.commissionIds)
      .select()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to ${action} commissions: ${updateError.message}` },
        { status: 500 }
      )
    }

    // If paying commissions, update consultant totals
    if (action === 'pay' && updatedCommissions) {
      for (const commission of updatedCommissions) {
        await supabase.rpc('increment_consultant_earnings', {
          consultant_id: commission.consultant_id,
          amount: commission.commission_amount
        })
      }
    }

    // Log the bulk action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'consultant_commissions',
        record_id: body.commissionIds[0], // Use first ID as reference
        action: 'UPDATE',
        user_id: user.id,
        new_data: {
          action: `bulk_${action}`,
          count: updatedCommissions?.length || 0,
          commission_ids: body.commissionIds,
          new_status: newStatus
        },
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    // Send emails for approved payments
    if (action === 'pay' && updatedCommissions) {
      // Get consultant details for each commission
      const consultantIds = [...new Set(updatedCommissions.map(c => c.consultant_id))]
      
      const { data: consultants } = await supabase
        .from('consultants')
        .select('*')
        .in('id', consultantIds)

      if (consultants) {
        for (const commission of updatedCommissions) {
          const consultant = consultants.find(c => c.id === commission.consultant_id)
          if (consultant) {
            // Format consultant data
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

            // Format commission data
            const commissionData = {
              id: commission.id,
              consultantId: commission.consultant_id,
              orderId: commission.order_id,
              clientId: commission.client_id,
              status: commission.status,
              orderAmount: commission.order_amount,
              commissionRate: commission.commission_rate,
              commissionAmount: commission.commission_amount,
              orderDate: commission.order_date,
              approvalDate: commission.approved_at,
              paymentDate: commission.paid_at,
              orderDetails: {
                orderNumber: commission.order_number,
                customerName: commission.customer_name,
                items: []
              },
              createdAt: commission.created_at,
              updatedAt: commission.updated_at
            }

            await sendPaymentApprovedEmail(consultantData, commissionData)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCommissions?.length || 0,
      commissions: updatedCommissions
    })
  } catch (error) {
    console.error('Error in POST /api/commissions/approve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}