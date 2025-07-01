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

async function checkConsultants() {
  console.log('=== CHECKING CONSULTANTS TABLE ===\n')

  try {
    // 1. Check if there are any records in consultants table
    console.log('1. Checking consultants table records...')
    const { data: consultants, error: consultantsError, count } = await supabaseAdmin
      .from('consultants')
      .select('*', { count: 'exact' })

    if (consultantsError) {
      console.error('Error fetching consultants:', consultantsError)
    } else {
      console.log(`Found ${count} consultants in the table`)
      if (consultants && consultants.length > 0) {
        console.log('\nFirst few consultants:')
        consultants.slice(0, 3).forEach(c => {
          console.log(`- ID: ${c.id}, Email: ${c.email}, Status: ${c.status}`)
        })
      }
    }

    // 2. Check Auth users with consultant role
    console.log('\n2. Checking Auth users...')
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
    } else {
      console.log(`Total users in Auth: ${users.length}`)
      
      // Filter users that might be consultants
      const consultantUsers = users.filter(user => 
        user.user_metadata?.role === 'consultant' || 
        user.email?.includes('consultant') ||
        user.app_metadata?.role === 'consultant'
      )
      
      console.log(`Users that might be consultants: ${consultantUsers.length}`)
      
      if (consultantUsers.length > 0) {
        console.log('\nPotential consultant users:')
        consultantUsers.forEach(u => {
          console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata: ${JSON.stringify(u.user_metadata)}`)
        })
      }

      // 3. Check for users that exist in Auth but not in consultants table
      console.log('\n3. Checking for Auth users without consultant records...')
      if (consultants) {
        const consultantEmails = consultants.map(c => c.email)
        const orphanedUsers = users.filter(u => 
          u.email && !consultantEmails.includes(u.email) && 
          (u.user_metadata?.role === 'consultant' || u.app_metadata?.role === 'consultant')
        )

        if (orphanedUsers.length > 0) {
          console.log(`\nFound ${orphanedUsers.length} users in Auth that might need consultant records:`)
          orphanedUsers.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`)
          })
        } else {
          console.log('All consultant users have corresponding records in consultants table')
        }
      }
    }

    // 4. Try to get the table structure
    console.log('\n4. Checking consultants table structure...')
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('consultants')
      .select()
      .limit(0)

    if (!tableError) {
      // Get column information by attempting an insert with empty data
      const { error: insertError } = await supabaseAdmin
        .from('consultants')
        .insert({})

      if (insertError) {
        console.log('\nTable columns (inferred from error):')
        const errorMessage = insertError.message
        console.log(errorMessage)
        
        // Parse required fields from error
        if (errorMessage.includes('null value')) {
          const match = errorMessage.match(/column "([^"]+)"/)
          if (match) {
            console.log(`\nRequired column found: ${match[1]}`)
          }
        }
      }
    }

    // 5. Check specific email if provided
    const testEmail = 'tamaraleal@gmail.com' // Email usado no teste
    console.log(`\n5. Checking for specific test email: ${testEmail}`)
    
    // Check in consultants table
    const { data: specificConsultant, error: specificError } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .eq('email', testEmail)
      .single()

    if (specificError) {
      console.log(`No consultant found with email: ${testEmail}`)
    } else {
      console.log(`Consultant found:`, specificConsultant)
    }

    // Check in Auth
    const authUser = users.find(u => u.email === testEmail)
    
    if (!authUser) {
      console.log(`No Auth user found with email: ${testEmail}`)
    } else {
      console.log(`Auth user found:`)
      console.log(`- ID: ${authUser.id}`)
      console.log(`- Email: ${authUser.email}`)
      console.log(`- Created: ${authUser.created_at}`)
      console.log(`- Metadata: ${JSON.stringify(authUser.user_metadata)}`)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the check
checkConsultants()