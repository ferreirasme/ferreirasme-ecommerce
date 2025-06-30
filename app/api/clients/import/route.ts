import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAdminAuth } from "@/lib/security/admin-auth"
import { rateLimiter } from "@/lib/security/rate-limiter"

interface ClientRow {
  nome: string
  email: string
  telefone?: string
  whatsapp?: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  data_nascimento?: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for bulk operations
    const rateLimitResult = await rateLimiter(request, { limit: 5, window: 60 })
    if (rateLimitResult) return rateLimitResult

    // Check authentication
    const user = await checkAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const consultantId = formData.get('consultantId') as string

    if (!file || !consultantId) {
      return NextResponse.json(
        { error: 'Missing file or consultant ID' },
        { status: 400 }
      )
    }

    // If consultant role, verify they're importing to their own consultant ID
    if (user.role === 'consultant') {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!consultantData || consultantData.id !== consultantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Read and parse CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      )
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Validate required headers
    const requiredHeaders = ['nome', 'email']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse data rows
    const clients: ClientRow[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Invalid number of columns`)
        continue
      }

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || undefined
      })

      // Validate email
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push(`Row ${i + 1}: Invalid email format`)
        continue
      }

      if (!row.nome) {
        errors.push(`Row ${i + 1}: Missing name`)
        continue
      }

      clients.push(row as ClientRow)
    }

    if (clients.length === 0) {
      return NextResponse.json(
        { error: 'No valid clients to import', details: errors },
        { status: 400 }
      )
    }

    // Check for existing clients
    const emails = clients.map(c => c.email)
    const { data: existingClients } = await supabase
      .from('clients')
      .select('email')
      .eq('consultant_id', consultantId)
      .in('email', emails)

    const existingEmails = new Set(existingClients?.map(c => c.email) || [])
    const newClients = clients.filter(c => !existingEmails.has(c.email))

    if (newClients.length === 0) {
      return NextResponse.json(
        { 
          error: 'All clients already exist',
          skipped: clients.length,
          imported: 0
        },
        { status: 400 }
      )
    }

    // Prepare client records for insertion
    const clientRecords = newClients.map(client => ({
      consultant_id: consultantId,
      full_name: client.nome,
      email: client.email,
      phone: client.telefone,
      whatsapp: client.whatsapp,
      birth_date: client.data_nascimento ? parseDate(client.data_nascimento) : null,
      address: client.endereco_rua ? {
        street: client.endereco_rua,
        number: client.endereco_numero,
        complement: client.endereco_complemento,
        neighborhood: client.endereco_bairro,
        city: client.endereco_cidade,
        state: client.endereco_estado,
        postal_code: client.endereco_cep,
        country: 'PT'
      } : null,
      status: 'active',
      source: 'import',
      marketing_consent: false,
      data_sharing_consent: false
    }))

    // Batch insert clients
    const { data: insertedClients, error: insertError } = await supabase
      .from('clients')
      .insert(clientRecords)
      .select()

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to import clients: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Log the bulk action
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'clients',
        record_id: consultantId, // Using consultant ID as reference
        action: 'INSERT',
        user_id: user.id,
        new_data: {
          action: 'bulk_import',
          count: insertedClients?.length || 0,
          consultant_id: consultantId
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      imported: insertedClients?.length || 0,
      skipped: existingEmails.size,
      total: clients.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error in POST /api/clients/import:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function parseDate(dateStr: string): string | null {
  try {
    // Try different date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ]

    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        let year, month, day
        
        if (format === formats[0]) {
          [, year, month, day] = match
        } else {
          [, day, month, year] = match
        }

        const date = new Date(`${year}-${month}-${day}`)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      }
    }

    return null
  } catch {
    return null
  }
}