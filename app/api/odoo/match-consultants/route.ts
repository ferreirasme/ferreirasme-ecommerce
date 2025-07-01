import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    // Odoo configuration
    const odooUrl = process.env.ODOO_URL
    const odooDb = process.env.ODOO_DB
    const odooUsername = process.env.ODOO_USERNAME
    const odooApiKey = process.env.ODOO_API_KEY

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      return NextResponse.json({ 
        error: 'Configuração Odoo incompleta' 
      }, { status: 500 })
    }

    // Authenticate with Odoo
    const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` })
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [odooDb, odooUsername, odooApiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Falha na autenticação Odoo' }, { status: 401 })
    }

    const models = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` })

    // Get all consultants from our database
    const { data: consultants, error: consultError } = await supabase
      .from('consultants')
      .select('id, email, full_name, odoo_id')
      .is('odoo_id', null) // Only get consultants not yet linked
      .order('created_at', { ascending: false })

    if (consultError) throw consultError

    // Get all partners from Odoo that are consultants
    const odooPartners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        odooDb, uid, odooApiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false], ['partner_type', '=', 'consultant']]],
        { 
          fields: ['id', 'email', 'name', 'image_1920'],
          limit: 1000
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    let matched = 0
    let notFound = 0
    const matchResults: any[] = []
    const notFoundEmails: string[] = []

    // Match consultants by email
    for (const consultant of consultants || []) {
      if (!consultant.email) {
        continue
      }

      // Find matching partner in Odoo by email
      const odooPartner = odooPartners.find(
        (p: any) => p.email && p.email.toLowerCase() === consultant.email.toLowerCase()
      )

      if (odooPartner) {
        // Update consultant with odoo_id
        const { error: updateError } = await supabase
          .from('consultants')
          .update({ 
            odoo_id: odooPartner.id,
            // If partner has image, we'll handle it in the next step
            odoo_image_1920: odooPartner.image_1920 || null
          })
          .eq('id', consultant.id)

        if (!updateError) {
          matched++
          matchResults.push({
            consultant: consultant.full_name,
            email: consultant.email,
            odoo_id: odooPartner.id,
            odoo_name: odooPartner.name,
            has_image: !!odooPartner.image_1920
          })
          console.log(`✅ Matched ${consultant.full_name} with Odoo ID ${odooPartner.id}`)
        } else {
          console.error(`❌ Error updating consultant ${consultant.full_name}:`, updateError)
        }
      } else {
        notFound++
        notFoundEmails.push(consultant.email)
        console.log(`⚠️ No match found for ${consultant.full_name} (${consultant.email})`)
      }
    }

    return NextResponse.json({
      success: true,
      matched,
      notFound,
      totalConsultants: consultants?.length || 0,
      totalOdooPartners: odooPartners.length,
      matchResults: matchResults.slice(0, 10), // Show first 10 matches
      notFoundEmails: notFoundEmails.slice(0, 10), // Show first 10 not found
      message: `Matched ${matched} consultants with Odoo partners`
    })

  } catch (error: any) {
    console.error('Error matching consultants:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer correspondência de consultoras' },
      { status: 500 }
    )
  }
}