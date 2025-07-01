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

async function verifyConsultantSystem() {
  console.log('=== CONSULTANT SYSTEM VERIFICATION ===\n')

  try {
    // 1. Check Auth users
    console.log('1. AUTH USERS CHECK:')
    console.log('-------------------')
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
    } else {
      console.log(`Total users: ${users.length}`)
      users.forEach(user => {
        const role = user.user_metadata?.role || 'customer'
        console.log(`- ${user.email} (${role}) - ID: ${user.id}`)
      })
    }

    // 2. Check Consultants table
    console.log('\n2. CONSULTANTS TABLE CHECK:')
    console.log('---------------------------')
    const { data: consultants, count: consultantCount } = await supabaseAdmin
      .from('consultants')
      .select('*', { count: 'exact' })

    console.log(`Total consultants: ${consultantCount}`)
    if (consultants && consultants.length > 0) {
      consultants.forEach(c => {
        console.log(`- ${c.code}: ${c.full_name}`)
        console.log(`  Email: ${c.email}`)
        console.log(`  User ID: ${c.user_id}`)
        console.log(`  Status: ${c.status}`)
        console.log(`  Commission: ${c.commission_percentage}%`)
      })
    }

    // 3. Check Auth-Consultant mapping
    console.log('\n3. AUTH-CONSULTANT MAPPING CHECK:')
    console.log('---------------------------------')
    if (users && consultants) {
      // Check for Auth users without consultant records
      const consultantUserIds = consultants.map(c => c.user_id)
      const orphanedAuthUsers = users.filter(u => 
        u.user_metadata?.role === 'consultant' && 
        !consultantUserIds.includes(u.id)
      )

      if (orphanedAuthUsers.length > 0) {
        console.log('⚠️  Auth users with consultant role but no consultant record:')
        orphanedAuthUsers.forEach(u => {
          console.log(`  - ${u.email} (ID: ${u.id})`)
        })
      } else {
        console.log('✅ All consultant Auth users have corresponding consultant records')
      }

      // Check for consultant records without Auth users
      const authUserIds = users.map(u => u.id)
      const orphanedConsultants = consultants.filter(c => 
        !authUserIds.includes(c.user_id)
      )

      if (orphanedConsultants.length > 0) {
        console.log('\n⚠️  Consultant records without corresponding Auth users:')
        orphanedConsultants.forEach(c => {
          console.log(`  - ${c.full_name} (${c.email}) - User ID: ${c.user_id}`)
        })
      } else {
        console.log('✅ All consultant records have corresponding Auth users')
      }
    }

    // 4. Check Consent Records
    console.log('\n4. CONSENT RECORDS CHECK:')
    console.log('-------------------------')
    const { data: consents, count: consentCount } = await supabaseAdmin
      .from('consent_records')
      .select('*, consultants(full_name, code)', { count: 'exact' })
      .not('consultant_id', 'is', null)

    console.log(`Total consultant consent records: ${consentCount}`)
    if (consents && consents.length > 0) {
      consents.forEach(consent => {
        console.log(`- Type: ${consent.consent_type} - Action: ${consent.action}`)
        console.log(`  Consultant: ${consent.consultants?.full_name} (${consent.consultants?.code})`)
        console.log(`  Date: ${new Date(consent.created_at).toLocaleString()}`)
      })
    }

    // 5. Check Clients
    console.log('\n5. CLIENTS CHECK:')
    console.log('-----------------')
    const { data: clients, count: clientCount } = await supabaseAdmin
      .from('clients')
      .select('*, consultants(full_name, code)', { count: 'exact' })

    console.log(`Total clients: ${clientCount}`)
    if (clients && clients.length > 0) {
      const clientsByConsultant = clients.reduce((acc, client) => {
        const consultantName = client.consultants?.full_name || 'Unknown'
        if (!acc[consultantName]) acc[consultantName] = 0
        acc[consultantName]++
        return acc
      }, {} as Record<string, number>)

      console.log('Clients by consultant:')
      Object.entries(clientsByConsultant).forEach(([name, count]) => {
        console.log(`  - ${name}: ${count} clients`)
      })
    }

    // 6. Check Commissions
    console.log('\n6. COMMISSIONS CHECK:')
    console.log('---------------------')
    const { data: commissions, count: commissionCount } = await supabaseAdmin
      .from('consultant_commissions')
      .select('*, consultants(full_name, code)', { count: 'exact' })

    console.log(`Total commission records: ${commissionCount}`)
    if (commissions && commissions.length > 0) {
      const commissionsByStatus = commissions.reduce((acc, comm) => {
        if (!acc[comm.status]) acc[comm.status] = { count: 0, total: 0 }
        acc[comm.status].count++
        acc[comm.status].total += parseFloat(comm.commission_amount)
        return acc
      }, {} as Record<string, { count: number; total: number }>)

      console.log('Commissions by status:')
      Object.entries(commissionsByStatus).forEach(([status, data]) => {
        console.log(`  - ${status}: ${(data as any).count} records, €${(data as any).total.toFixed(2)} total`)
      })
    }

    // 7. Summary
    console.log('\n7. SYSTEM SUMMARY:')
    console.log('------------------')
    console.log(`✅ Auth Users: ${users?.length || 0}`)
    console.log(`✅ Consultants: ${consultantCount || 0}`)
    console.log(`✅ Clients: ${clientCount || 0}`)
    console.log(`✅ Consent Records: ${consentCount || 0}`)
    console.log(`✅ Commission Records: ${commissionCount || 0}`)

    // 8. Test specific consultant
    console.log('\n8. SPECIFIC CONSULTANT TEST:')
    console.log('----------------------------')
    const testEmail = 'consultora@ferreirasme.com'
    
    const { data: testConsultant } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .eq('email', testEmail)
      .single()

    if (testConsultant) {
      console.log(`✅ Found consultant: ${testConsultant.full_name}`)
      console.log(`  - Code: ${testConsultant.code}`)
      console.log(`  - Status: ${testConsultant.status}`)
      console.log(`  - Can login: YES (user_id: ${testConsultant.user_id})`)
    } else {
      console.log(`❌ Consultant not found: ${testEmail}`)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run verification
verifyConsultantSystem()