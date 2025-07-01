import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createConsultantRecord() {
  console.log('=== CREATING CONSULTANT RECORD ===\n')

  const orphanedUserId = 'cce78b79-1e9f-4811-bc27-9a07a9dee4bb'
  const orphanedUserEmail = 'consultora@ferreirasme.com'
  const orphanedUserName = 'Maria da Silva a Consultora'

  try {
    // 1. Generate a unique consultant code
    console.log('1. Generating consultant code...')
    const consultantCode = `CONS${Date.now().toString().slice(-4)}`
    console.log(`Generated code: ${consultantCode}`)

    // 2. Create the consultant record with all required fields
    console.log('\n2. Creating consultant record...')
    const consultantData = {
      user_id: orphanedUserId,
      code: consultantCode,
      full_name: orphanedUserName,
      email: orphanedUserEmail,
      phone: '+351900000001', // Placeholder phone
      status: 'active',
      commission_percentage: 10.00, // Default 10%
      
      // Optional but helpful fields
      whatsapp: '+351900000001',
      nif: '123456789', // Placeholder NIF
      
      // Address fields (optional but we'll provide defaults)
      address_street: 'Rua das Consultoras',
      address_number: '1',
      address_city: 'Lisboa',
      address_state: 'Lisboa',
      address_postal_code: '1000-001',
      address_country: 'PT',
      
      // Banking info (can be updated later)
      bank_name: 'Banco Exemplo',
      bank_iban: 'PT50000000000000000000001',
      bank_account_holder: orphanedUserName,
      
      // Activation
      activation_date: new Date().toISOString(),
      
      // LGPD consent
      consent_date: new Date().toISOString(),
      consent_version: '1.0.0',
      
      // Metadata
      notes: 'Consultora criada via script de correção',
      metadata: {
        created_via: 'fix-script',
        original_auth_id: orphanedUserId
      }
    }

    const { data: insertedConsultant, error: insertError } = await supabaseAdmin
      .from('consultants')
      .insert(consultantData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating consultant:', insertError)
      console.log('\nData attempted:', JSON.stringify(consultantData, null, 2))
    } else {
      console.log('✅ Successfully created consultant record!')
      console.log('\nCreated consultant:')
      console.log(`- ID: ${insertedConsultant.id}`)
      console.log(`- Code: ${insertedConsultant.code}`)
      console.log(`- Name: ${insertedConsultant.full_name}`)
      console.log(`- Email: ${insertedConsultant.email}`)
      console.log(`- Status: ${insertedConsultant.status}`)
      console.log(`- Commission: ${insertedConsultant.commission_percentage}%`)
    }

    // 3. Verify the consultant was created
    console.log('\n3. Verifying consultant record...')
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .eq('user_id', orphanedUserId)
      .single()

    if (verifyError) {
      console.error('Could not verify consultant:', verifyError)
    } else {
      console.log('✅ Consultant verified successfully!')
      console.log('Full record:', JSON.stringify(verifyData, null, 2))
    }

    // 4. Create initial consent record for LGPD compliance
    if (insertedConsultant) {
      console.log('\n4. Creating consent record for LGPD compliance...')
      const consentData = {
        consultant_id: insertedConsultant.id,
        consent_type: 'data_processing',
        action: 'granted',
        version: '1.0.0',
        content_hash: 'initial-consent',
        metadata: {
          created_via: 'fix-script',
          consent_text: 'Consentimento inicial para processamento de dados'
        }
      }

      const { error: consentError } = await supabaseAdmin
        .from('consent_records')
        .insert(consentData)

      if (consentError) {
        console.error('Error creating consent record:', consentError)
      } else {
        console.log('✅ Consent record created successfully!')
      }
    }

    // 5. Show final status
    console.log('\n5. Final check - All consultants:')
    const { data: allConsultants, count } = await supabaseAdmin
      .from('consultants')
      .select('*', { count: 'exact' })

    console.log(`Total consultants in database: ${count}`)
    if (allConsultants && allConsultants.length > 0) {
      console.log('\nAll consultants:')
      allConsultants.forEach(c => {
        console.log(`- ${c.code}: ${c.full_name} (${c.email}) - Status: ${c.status}`)
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script
createConsultantRecord()