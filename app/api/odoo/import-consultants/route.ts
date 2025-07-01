import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[ODOO CONSULTANTS IMPORT] ========== Starting import process ==========', {
    timestamp: new Date().toISOString(),
    requestHeaders: Object.fromEntries(request.headers.entries())
  })
  
  try {
    // Check if user is admin
    console.log('[ODOO CONSULTANTS IMPORT] Checking admin authentication...')
    const admin = await checkIsAdmin(request)
    if (!admin) {
      console.log('[ODOO CONSULTANTS IMPORT] Access denied - user is not admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.log('[ODOO CONSULTANTS IMPORT] Admin authenticated:', {
      adminId: admin.id,
      adminEmail: admin.email,
      timestamp: new Date().toISOString()
    })

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Odoo connection details
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!
    
    console.log('[ODOO CONSULTANTS IMPORT] Odoo configuration:', {
      url: url ? `${url.substring(0, 20)}...` : 'NOT SET',
      database: db || 'NOT SET',
      username: username || 'NOT SET',
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString()
    })

    // Create XML-RPC clients
    const common = xmlrpc.createClient({ 
      url: `${url}/xmlrpc/2/common`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })
    
    const models = xmlrpc.createClient({ 
      url: `${url}/xmlrpc/2/object`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })

    // Authenticate
    console.log('[ODOO CONSULTANTS IMPORT] Authenticating with Odoo XML-RPC...')
    const authStartTime = Date.now()
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) {
          console.error('[ODOO CONSULTANTS IMPORT] Authentication failed:', {
            error: err.message || err,
            duration: `${Date.now() - authStartTime}ms`
          })
          reject(err)
        } else {
          console.log('[ODOO CONSULTANTS IMPORT] Authentication successful:', {
            uid,
            duration: `${Date.now() - authStartTime}ms`,
            timestamp: new Date().toISOString()
          })
          resolve(uid)
        }
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Falha na autenticação com Odoo' }, { status: 401 })
    }

    // Fetch all partners (individuals, not companies)
    console.log('[ODOO CONSULTANTS IMPORT] Fetching partners from Odoo...')
    const fetchStartTime = Date.now()
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false]]],
        { 
          fields: [
            'name', 'email', 'phone', 'mobile', 'vat', 'street', 'street2', 
            'city', 'zip', 'country_id', 'state_id', 'ref', 'lang', 'website',
            'comment', 'function', 'category_id', 'customer_rank', 'supplier_rank',
            'credit_limit', 'property_payment_term_id', 'active', 'employee',
            'partner_share', 'bank_ids', 'image_1920', 'title'
          ],
          limit: 1000 // Adjust as needed
        }
      ], (err: any, result: any) => {
        if (err) {
          console.error('[ODOO CONSULTANTS IMPORT] Failed to fetch partners:', {
            error: err.message || err,
            duration: `${Date.now() - fetchStartTime}ms`
          })
          reject(err)
        } else {
          console.log('[ODOO CONSULTANTS IMPORT] Partners fetched successfully:', {
            count: result.length,
            duration: `${Date.now() - fetchStartTime}ms`,
            timestamp: new Date().toISOString()
          })
          resolve(result)
        }
      })
    })

    console.log(`[ODOO CONSULTANTS IMPORT] Found ${partners.length} partners in Odoo`)

    let created = 0
    let updated = 0
    let errors = 0
    let skipped = 0
    const errorDetails: any[] = []
    const processStartTime = Date.now()
    
    console.log('[ODOO CONSULTANTS IMPORT] Starting to process partners...', {
      totalPartners: partners.length,
      timestamp: new Date().toISOString()
    })

    // Process each partner
    for (let index = 0; index < partners.length; index++) {
      const partner = partners[index]
      
      // Log progress every 10 partners
      if (index > 0 && index % 10 === 0) {
        console.log('[ODOO CONSULTANTS IMPORT] Progress update:', {
          processed: index,
          total: partners.length,
          percentage: `${Math.round((index / partners.length) * 100)}%`,
          created,
          updated,
          errors,
          skipped,
          duration: `${Date.now() - processStartTime}ms`,
          averageTimePerRecord: `${Math.round((Date.now() - processStartTime) / index)}ms`
        })
      }
      try {
        // Skip if no email
        if (!partner.email) {
          console.log('[ODOO CONSULTANTS IMPORT] Skipping partner - no email:', {
            partnerName: partner.name,
            partnerId: partner.id,
            reason: 'missing_email'
          })
          skipped++
          continue
        }

        // Check if consultant already exists
        const { data: existingConsultant } = await supabase
          .from('consultants')
          .select('id, odoo_id')
          .eq('email', partner.email)
          .single()

        // Generate consultant code if needed
        let consultantCode: string = ''
        if (!existingConsultant) {
          const { data: codeData } = await supabase
            .rpc('generate_consultant_code')
            .single()
          
          consultantCode = (typeof codeData === 'string' ? codeData : null) || `CONS${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        }

        // Prepare consultant data
        const consultantData = {
          odoo_id: partner.id,
          full_name: partner.name,
          email: partner.email,
          phone: partner.phone || partner.mobile || '',
          whatsapp: partner.mobile || partner.phone || '',
          mobile: partner.mobile || '',
          nif: partner.vat || '',
          address_street: partner.street || '',
          address_complement: partner.street2 || '',
          address_city: partner.city || '',
          address_postal_code: partner.zip || '',
          address_state: partner.state_id ? partner.state_id[1] : '',
          address_country: partner.country_id ? partner.country_id[1].substring(0, 2).toUpperCase() : 'PT',
          function: partner.function || '',
          website: partner.website || '',
          lang: partner.lang || 'pt_BR',
          ref: partner.ref || '',
          customer_rank: partner.customer_rank || 0,
          supplier_rank: partner.supplier_rank || 0,
          credit_limit: partner.credit_limit || 0,
          property_payment_term_id: partner.property_payment_term_id ? partner.property_payment_term_id[0] : null,
          category_ids: partner.category_id || [],
          is_employee: partner.employee || false,
          partner_share: partner.partner_share !== false,
          notes: partner.comment || '',
          odoo_image_1920: partner.image_1920 || null, // Store base64 image
          commission_percentage: 10, // Default
          commission_period_days: 45,
          status: partner.active ? 'active' : 'inactive',
          consent_date: new Date().toISOString(),
          consent_version: '1.0.0',
          created_by: admin.id
        }

        if (existingConsultant) {
          // Update existing consultant
          const { error: updateError } = await supabase
            .from('consultants')
            .update(consultantData)
            .eq('id', existingConsultant.id)

          if (updateError) throw updateError
          updated++
          console.log('[ODOO CONSULTANTS IMPORT] Updated consultant:', {
            name: partner.name,
            email: partner.email,
            consultantId: existingConsultant.id,
            odooId: partner.id,
            timestamp: new Date().toISOString()
          })
        } else {
          // Create auth user first
          let userId: string

          // Check if auth user exists
          const { data: { users } } = await adminSupabase.auth.admin.listUsers()
          const existingUser = users?.find(u => u.email === partner.email)

          if (existingUser) {
            userId = existingUser.id
            console.log('[ODOO CONSULTANTS IMPORT] Using existing auth user:', {
              name: partner.name,
              email: partner.email,
              userId,
              timestamp: new Date().toISOString()
            })
          } else {
            // Create new auth user
            const { data: { user }, error: authError } = await adminSupabase.auth.admin.createUser({
              email: partner.email,
              password: Math.random().toString(36).slice(-12), // Random password, user will reset
              email_confirm: true,
              user_metadata: {
                full_name: partner.name,
                role: 'consultant',
                imported_from_odoo: true
              }
            })

            if (authError || !user) {
              throw new Error(`Failed to create auth user: ${authError?.message}`)
            }

            userId = user.id
            console.log('[ODOO CONSULTANTS IMPORT] Created new auth user:', {
              name: partner.name,
              email: partner.email,
              userId,
              timestamp: new Date().toISOString()
            })
          }

          // Create consultant record
          const { error: insertError } = await supabase
            .from('consultants')
            .insert({
              ...consultantData,
              user_id: userId,
              code: consultantCode
            })

          if (insertError) throw insertError
          created++
          console.log('[ODOO CONSULTANTS IMPORT] Created consultant:', {
            name: partner.name,
            email: partner.email,
            consultantCode,
            odooId: partner.id,
            userId,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error: any) {
        errors++
        const errorDetail = {
          partner: partner.name,
          email: partner.email,
          odooId: partner.id,
          error: error.message,
          timestamp: new Date().toISOString()
        }
        errorDetails.push(errorDetail)
        console.error('[ODOO CONSULTANTS IMPORT] Error processing partner:', errorDetail)
      }
    }
    
    const processingDuration = Date.now() - processStartTime
    console.log('[ODOO CONSULTANTS IMPORT] Processing completed:', {
      totalProcessed: created + updated + errors + skipped,
      created,
      updated,
      errors,
      skipped,
      duration: `${processingDuration}ms`,
      averageTimePerRecord: `${Math.round(processingDuration / partners.length)}ms`,
      timestamp: new Date().toISOString()
    })

    // Log the import action
    console.log('[ODOO CONSULTANTS IMPORT] Saving admin log...')
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'IMPORT_CONSULTANTS_FROM_ODOO',
        entity_type: 'consultant',
        details: {
          total_partners: partners.length,
          created,
          updated,
          errors,
          error_details: errorDetails.slice(0, 10) // First 10 errors
        }
      })

    const totalDuration = Date.now() - startTime
    const response = {
      success: true,
      created,
      updated,
      errors,
      total: partners.length,
      details: {
        processed: created + updated + errors,
        skipped,
        errorSample: errorDetails.slice(0, 5),
        duration: `${totalDuration}ms`,
        averageTimePerRecord: `${Math.round(totalDuration / partners.length)}ms`
      }
    }
    
    console.log('[ODOO CONSULTANTS IMPORT] ========== Import completed successfully ==========', {
      ...response,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(response)

  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[ODOO CONSULTANTS IMPORT] ========== Import failed ==========', {
      error: error.message || error,
      stack: error.stack,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: error.message || 'Erro ao importar consultoras' },
      { status: 500 }
    )
  }
}