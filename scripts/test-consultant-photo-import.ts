#!/usr/bin/env node
import 'dotenv/config'

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || 'admin123'

async function main() {
  console.log('🚀 Testing Consultant Photo Import from Odoo\n')

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...')
    const loginResponse = await fetch(`${API_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    })

    if (!loginResponse.ok) {
      const error = await loginResponse.json()
      throw new Error(`Login failed: ${error.error}`)
    }

    const { token } = await loginResponse.json()
    console.log('✅ Login successful\n')

    // 2. Check current status
    console.log('2️⃣ Checking current import status...')
    const statusResponse = await fetch(`${API_URL}/api/odoo/import-consultant-photos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (statusResponse.ok) {
      const status = await statusResponse.json()
      console.log('📊 Current Status:')
      console.log(`   Total Consultants: ${status.stats.total}`)
      console.log(`   Linked to Odoo: ${status.stats.linked} (${status.stats.percentLinked}%)`)
      console.log(`   With Photos: ${status.stats.withPhotos} (${status.stats.percentWithPhotos}%)`)
      console.log(`   Needs Photo: ${status.stats.needsPhoto}\n`)
    }

    // 3. Match consultants by email
    console.log('3️⃣ Matching consultants with Odoo partners...')
    const matchResponse = await fetch(`${API_URL}/api/odoo/match-consultants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!matchResponse.ok) {
      const error = await matchResponse.json()
      console.error('❌ Match failed:', error.error)
    } else {
      const matchResult = await matchResponse.json()
      console.log('✅ Matching complete:')
      console.log(`   Matched: ${matchResult.matched}`)
      console.log(`   Not Found: ${matchResult.notFound}`)
      console.log(`   Total Odoo Partners: ${matchResult.totalOdooPartners}`)
      
      if (matchResult.matchResults.length > 0) {
        console.log('\n   Sample matches:')
        matchResult.matchResults.slice(0, 3).forEach((match: any) => {
          console.log(`   - ${match.consultant} (${match.email}) → Odoo ID: ${match.odoo_id}`)
        })
      }
      
      if (matchResult.notFoundEmails.length > 0) {
        console.log('\n   Sample not found:')
        matchResult.notFoundEmails.slice(0, 3).forEach((email: string) => {
          console.log(`   - ${email}`)
        })
      }
      console.log()
    }

    // 4. Import photos (first batch)
    console.log('4️⃣ Importing consultant photos from Odoo...')
    const importResponse = await fetch(`${API_URL}/api/odoo/import-consultant-photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 10, // Import first 10 for testing
        offset: 0
      }),
    })

    if (!importResponse.ok) {
      const error = await importResponse.json()
      throw new Error(`Import failed: ${error.error}`)
    }

    const importResult = await importResponse.json()
    console.log('✅ Import complete:')
    console.log(`   Updated: ${importResult.updated}`)
    console.log(`   Skipped: ${importResult.skipped}`)
    console.log(`   Errors: ${importResult.errors}`)
    console.log(`   Has More: ${importResult.hasMore}`)
    
    if (importResult.results.length > 0) {
      console.log('\n   Import details:')
      importResult.results.slice(0, 5).forEach((result: any) => {
        if (result.status === 'success') {
          console.log(`   ✅ ${result.name} - Photo imported`)
        } else if (result.status === 'skipped') {
          console.log(`   ⏭️  ${result.name} - ${result.reason}`)
        } else {
          console.log(`   ❌ ${result.name} - Error: ${result.error}`)
        }
      })
    }

    // 5. Alternative: Use the combined endpoint
    console.log('\n5️⃣ Testing combined update-photos endpoint...')
    const updateResponse = await fetch(`${API_URL}/api/odoo/update-photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'consultants'
      }),
    })

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json()
      console.log('✅ Bulk update complete:')
      console.log(`   Updated: ${updateResult.updated}`)
      console.log(`   Errors: ${updateResult.errors}`)
    }

    console.log('\n✨ Test completed successfully!')

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Run the test
main()