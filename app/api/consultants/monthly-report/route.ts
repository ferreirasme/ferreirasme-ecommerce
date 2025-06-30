import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendMonthlyReportEmail } from "@/lib/resend"
import { Client } from "@/types/consultant"

// This endpoint can be called by a cron job on the 1st of each month
export async function POST(request: NextRequest) {
  try {
    // Verify that the request is coming from an authorized source
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get current date info
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    
    const monthName = monthNames[lastMonth.getMonth()]
    const year = lastMonth.getFullYear()

    // Get all active consultants with email_monthly_report preference enabled
    const { data: consultants } = await supabase
      .from('consultants')
      .select(`
        *,
        consultant_preferences!left(preferences)
      `)
      .eq('status', 'active')

    if (!consultants || consultants.length === 0) {
      return NextResponse.json({ message: 'No active consultants found' })
    }

    let emailsSent = 0
    const errors: any[] = []

    for (const consultant of consultants) {
      try {
        // Check if consultant wants monthly reports
        const preferences = consultant.consultant_preferences?.[0]?.preferences
        if (!preferences?.email_monthly_report) {
          continue
        }

        // Get commissions for the last month
        const { data: commissions } = await supabase
          .from('consultant_commissions')
          .select('*')
          .eq('consultant_id', consultant.id)
          .gte('order_date', lastMonth.toISOString())
          .lte('order_date', lastMonthEnd.toISOString())
          .order('order_date', { ascending: false })

        // Get new clients for the last month
        const { data: newClients } = await supabase
          .from('consultant_clients')
          .select(`
            *,
            customers(*)
          `)
          .eq('consultant_id', consultant.id)
          .gte('created_at', lastMonth.toISOString())
          .lte('created_at', lastMonthEnd.toISOString())

        // Calculate totals
        const totalCommissions = commissions?.length || 0
        const totalEarnings = commissions?.reduce((sum, c) => {
          if (c.status !== 'cancelled') {
            return sum + c.commission_amount
          }
          return sum
        }, 0) || 0

        // Get top clients by spending
        const { data: topClientsData } = await supabase
          .from('consultant_commissions')
          .select(`
            client_id,
            customer_name,
            commission_amount,
            order_amount
          `)
          .eq('consultant_id', consultant.id)
          .gte('order_date', lastMonth.toISOString())
          .lte('order_date', lastMonthEnd.toISOString())
          .neq('status', 'cancelled')

        // Group by client and calculate totals
        const clientTotals = topClientsData?.reduce((acc: any, curr) => {
          if (!acc[curr.client_id]) {
            acc[curr.client_id] = {
              id: curr.client_id,
              firstName: curr.customer_name.split(' ')[0],
              lastName: curr.customer_name.split(' ').slice(1).join(' '),
              email: '',
              phone: '',
              totalSpent: 0,
              totalPurchases: 0,
              createdAt: '',
              updatedAt: '',
              status: 'ACTIVE'
            }
          }
          acc[curr.client_id].totalSpent += curr.order_amount
          return acc
        }, {}) || {}

        const topClients = Object.values(clientTotals)
          .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
          .slice(0, 3) as (Client & { totalSpent: number })[]

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

        // Format commissions data
        const formattedCommissions = commissions?.map(c => ({
          id: c.id,
          consultantId: c.consultant_id,
          orderId: c.order_id,
          clientId: c.client_id,
          status: c.status,
          orderAmount: c.order_amount,
          commissionRate: c.commission_rate,
          commissionAmount: c.commission_amount,
          orderDate: c.order_date,
          approvalDate: c.approved_at,
          paymentDate: c.paid_at,
          orderDetails: {
            orderNumber: c.order_number,
            customerName: c.customer_name,
            items: []
          },
          createdAt: c.created_at,
          updatedAt: c.updated_at
        })) || []

        const reportData = {
          month: monthName,
          year,
          totalCommissions,
          totalEarnings,
          newClients: newClients?.length || 0,
          topClients,
          commissions: formattedCommissions
        }

        // Send email
        const result = await sendMonthlyReportEmail(consultantData, reportData)
        
        if (result.success) {
          emailsSent++
        } else {
          errors.push({
            consultantId: consultant.id,
            error: result.error
          })
        }
      } catch (error) {
        errors.push({
          consultantId: consultant.id,
          error: error
        })
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error sending monthly reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}