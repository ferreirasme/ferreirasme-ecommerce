import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAdminAuth } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"

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
    const limit = parseInt(searchParams.get('limit') || '50')
    const consentType = searchParams.get('type') || 'all'
    const userType = searchParams.get('userType') || 'all' // consultant, client, user

    // Build query
    let query = supabase
      .from('consent_records')
      .select('*', { count: 'exact' })

    // Apply filters
    if (consentType !== 'all') {
      query = query.eq('consent_type', consentType)
    }

    // Filter by user type
    if (userType === 'consultant') {
      query = query.not('consultant_id', 'is', null)
    } else if (userType === 'client') {
      query = query.not('client_id', 'is', null)
    } else if (userType === 'user') {
      query = query.not('user_id', 'is', null)
    }

    // If user is a consultant, only show their consents
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (consultantData) {
        query = query.or(`consultant_id.eq.${consultantData.id},user_id.eq.${user.id}`)
      } else {
        query = query.eq('user_id', user.id)
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
      console.error('Error fetching consent records:', error)
      return NextResponse.json({ error: 'Failed to fetch consent records' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Error in GET /api/consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request, { limit: 30, window: 60 })
    if (rateLimitResult) return rateLimitResult

    const supabase = await createClient()

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['consent_type', 'action']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate consent type
    const validConsentTypes = [
      'data_processing',
      'marketing',
      'data_sharing',
      'cookies',
      'newsletter',
      'terms_of_service',
      'privacy_policy'
    ]
    
    if (!validConsentTypes.includes(body.consent_type)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      )
    }

    // Validate action
    if (!['granted', 'revoked', 'updated'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Determine user context
    let userId = null
    let consultantId = null
    let clientId = null

    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      userId = session.user.id

      // Check if user is a consultant
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (consultantData) {
        consultantId = consultantData.id
        userId = null // Use consultant_id instead
      }
    }

    // Override with provided IDs if admin
    const user = await checkAdminAuth(request)
    if (user && ['admin', 'manager'].includes(user.role)) {
      if (body.user_id) userId = body.user_id
      if (body.consultant_id) consultantId = body.consultant_id
      if (body.client_id) clientId = body.client_id
    }

    // Ensure at least one user reference
    if (!userId && !consultantId && !clientId) {
      return NextResponse.json(
        { error: 'No user context provided' },
        { status: 400 }
      )
    }

    // Create consent record
    const { data: consentRecord, error: consentError } = await supabase
      .from('consent_records')
      .insert({
        user_id: userId,
        consultant_id: consultantId,
        client_id: clientId,
        consent_type: body.consent_type,
        action: body.action,
        version: body.version || '1.0.0',
        content_hash: body.content_hash,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        valid_until: body.valid_until,
        metadata: body.metadata || {}
      })
      .select()
      .single()

    if (consentError) {
      return NextResponse.json(
        { error: `Failed to create consent record: ${consentError.message}` },
        { status: 400 }
      )
    }

    // Update related records based on consent type
    if (body.action === 'granted') {
      if (consultantId && body.consent_type === 'data_processing') {
        await supabase
          .from('consultants')
          .update({
            consent_date: new Date().toISOString(),
            consent_version: body.version || '1.0.0',
            consent_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
          })
          .eq('id', consultantId)
      }

      if (clientId && ['marketing', 'data_sharing'].includes(body.consent_type)) {
        const updateData: any = {
          consent_date: new Date().toISOString()
        }
        
        if (body.consent_type === 'marketing') {
          updateData.marketing_consent = true
        } else if (body.consent_type === 'data_sharing') {
          updateData.data_sharing_consent = true
        }

        await supabase
          .from('clients')
          .update(updateData)
          .eq('id', clientId)
      }
    } else if (body.action === 'revoked') {
      if (clientId && ['marketing', 'data_sharing'].includes(body.consent_type)) {
        const updateData: any = {}
        
        if (body.consent_type === 'marketing') {
          updateData.marketing_consent = false
        } else if (body.consent_type === 'data_sharing') {
          updateData.data_sharing_consent = false
        }

        await supabase
          .from('clients')
          .update(updateData)
          .eq('id', clientId)
      }
    }

    return NextResponse.json(consentRecord, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export consent data for GDPR compliance
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request, { limit: 5, window: 60 })
    if (rateLimitResult) return rateLimitResult

    const supabase = await createClient()

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all consent records for the user
    const { data: consentRecords, error: fetchError } = await supabase
      .from('consent_records')
      .select('*')
      .or(`user_id.eq.${userId},consultant_id.in.(SELECT id FROM consultants WHERE user_id = '${userId}')`)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch consent records' },
        { status: 500 }
      )
    }

    // Export data as JSON
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      consent_records: consentRecords,
      request_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request_user_agent: request.headers.get('user-agent') || 'unknown'
    }

    // Log the export request
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'consent_records',
        record_id: userId,
        action: 'EXPORT',
        user_id: userId,
        new_data: {
          action: 'gdpr_data_export',
          record_count: consentRecords?.length || 0
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="consent_data_${userId}_${new Date().toISOString()}.json"`
      }
    })
  } catch (error) {
    console.error('Error in DELETE /api/consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}