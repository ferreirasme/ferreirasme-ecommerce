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

async function fixConsultantRecord() {
  console.log('=== FIXING CONSULTANT RECORD ===\n')

  const orphanedUserId = 'cce78b79-1e9f-4811-bc27-9a07a9dee4bb'
  const orphanedUserEmail = 'consultora@ferreirasme.com'

  try {
    // 1. First, let's try to understand the table structure better
    console.log('1. Attempting to insert a test record to discover all required fields...')
    
    const testData = {
      user_id: orphanedUserId,
      email: orphanedUserEmail
    }
    
    const { error: testError } = await supabaseAdmin
      .from('consultants')
      .insert(testData)
    
    if (testError) {
      console.log('Error from test insert:', testError.message)
      
      // Parse the error to find required fields
      if (testError.message.includes('null value in column')) {
        const match = testError.message.match(/column "([^"]+)"/)
        if (match) {
          console.log(`Missing required field: ${match[1]}`)
          
          // Add the missing field and try again
          const fieldName = match[1]
          
          // Common required fields based on the consultant type
          const commonDefaults: Record<string, any> = {
            code: `CONS${Date.now()}`, // Generate unique code
            status: 'ACTIVE',
            first_name: 'Maria',
            last_name: 'da Silva',
            phone: '+351900000000',
            birth_date: '1990-01-01',
            nif: '123456789',
            iban: 'PT50000000000000000000000',
            address: JSON.stringify({
              street: 'Rua Exemplo',
              number: '1',
              city: 'Lisboa',
              state: 'Lisboa',
              postalCode: '1000-000',
              country: 'Portugal'
            }),
            join_date: new Date().toISOString(),
            commission_rate: 15.0,
            client_ids: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Try with the missing field
          const updatedData = {
            ...testData,
            [fieldName]: commonDefaults[fieldName] || ''
          }
          
          console.log(`\n2. Trying again with ${fieldName} field...`)
          const { error: retryError } = await supabaseAdmin
            .from('consultants')
            .insert(updatedData)
          
          if (retryError) {
            console.log('Still getting error:', retryError.message)
            
            // Let's try with all common fields
            console.log('\n3. Trying with all common consultant fields...')
            const fullData = {
              user_id: orphanedUserId,
              email: orphanedUserEmail,
              ...commonDefaults
            }
            
            const { data: insertedData, error: fullError } = await supabaseAdmin
              .from('consultants')
              .insert(fullData)
              .select()
            
            if (fullError) {
              console.log('Error with full data:', fullError.message)
              console.log('\nData attempted:', JSON.stringify(fullData, null, 2))
            } else {
              console.log('✅ Successfully created consultant record!')
              console.log('Inserted data:', insertedData)
            }
          } else {
            console.log('✅ Successfully created consultant record with minimal data!')
          }
        }
      }
    } else {
      console.log('✅ Successfully created consultant record with just user_id and email!')
    }
    
    // 4. Verify the consultant now exists
    console.log('\n4. Verifying consultant record...')
    const { data: consultant, error: verifyError } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .eq('user_id', orphanedUserId)
      .single()
    
    if (verifyError) {
      console.log('Could not find consultant after insert:', verifyError.message)
    } else {
      console.log('Consultant record verified:')
      console.log(JSON.stringify(consultant, null, 2))
    }
    
    // 5. Check all consultants
    console.log('\n5. All consultants in the table:')
    const { data: allConsultants, count } = await supabaseAdmin
      .from('consultants')
      .select('*', { count: 'exact' })
    
    console.log(`Total consultants: ${count}`)
    if (allConsultants && allConsultants.length > 0) {
      allConsultants.forEach(c => {
        console.log(`- ID: ${c.id}, User ID: ${c.user_id}, Email: ${c.email}, Status: ${c.status}`)
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the fix
fixConsultantRecord()