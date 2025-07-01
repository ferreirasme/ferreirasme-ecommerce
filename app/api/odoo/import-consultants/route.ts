import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Odoo connection details
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!

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
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Falha na autenticação com Odoo' }, { status: 401 })
    }

    // Fetch all partners (individuals, not companies)
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false]]],
        { 
          fields: ['name', 'email', 'phone', 'mobile', 'vat', 'street', 'street2', 'city', 'zip', 'country_id', 'state_id'],
          limit: 1000 // Adjust as needed
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log(`Found ${partners.length} partners in Odoo`)

    let created = 0
    let updated = 0
    let errors = 0
    const errorDetails: any[] = []

    // Process each partner
    for (const partner of partners) {
      try {
        // Skip if no email
        if (!partner.email) {
          console.log(`Skipping ${partner.name} - no email`)
          continue
        }

        // Check if consultant already exists
        const { data: existingConsultant } = await supabase
          .from('consultants')
          .select('id, odoo_id')
          .eq('email', partner.email)
          .single()

        // Generate consultant code
        let consultantCode: string
        if (!existingConsultant) {
          const { data: codeData } = await supabase
            .rpc('generate_consultant_code')
            .single()
          
          consultantCode = codeData || `CONS${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        }

        // Prepare consultant data
        const consultantData = {
          odoo_id: partner.id,
          full_name: partner.name,
          email: partner.email,
          phone: partner.phone || partner.mobile || '',
          whatsapp: partner.mobile || partner.phone || '',
          nif: partner.vat || '',
          address_street: partner.street || '',
          address_complement: partner.street2 || '',
          address_city: partner.city || '',
          address_postal_code: partner.zip || '',
          address_country: partner.country_id ? partner.country_id[1].substring(0, 2).toUpperCase() : 'PT',
          commission_percentage: 10, // Default
          commission_period_days: 45,
          status: 'active',
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
          console.log(`Updated consultant: ${partner.name}`)
        } else {
          // Create auth user first
          let userId: string

          // Check if auth user exists
          const { data: { users } } = await adminSupabase.auth.admin.listUsers()
          const existingUser = users?.find(u => u.email === partner.email)

          if (existingUser) {
            userId = existingUser.id
            console.log(`Using existing auth user for: ${partner.name}`)
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
            console.log(`Created new auth user for: ${partner.name}`)
          }

          // Create consultant record
          const { error: insertError } = await supabase
            .from('consultants')
            .insert({
              ...consultantData,
              user_id: userId,
              code: consultantCode!
            })

          if (insertError) throw insertError
          created++
          console.log(`Created consultant: ${partner.name} (${consultantCode})`)
        }
      } catch (error: any) {
        errors++
        errorDetails.push({
          partner: partner.name,
          email: partner.email,
          error: error.message
        })
        console.error(`Error processing ${partner.name}:`, error.message)
      }
    }

    // Log the import action
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

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      total: partners.length,
      details: {
        processed: created + updated + errors,
        skipped: partners.length - (created + updated + errors),
        errorSample: errorDetails.slice(0, 5)
      }
    })

  } catch (error: any) {
    console.error('Error importing consultants from Odoo:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao importar consultoras' },
      { status: 500 }
    )
  }
}