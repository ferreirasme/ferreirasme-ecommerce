/**
 * Test script for the product import endpoint
 * Run with: npx tsx scripts/test-import-products.ts
 */

async function testImportProducts() {
  const apiUrl = 'http://localhost:3000/api/odoo/import-products'
  
  // You'll need to get a valid auth token from your browser's dev tools
  // after logging in as an admin
  const authToken = process.env.AUTH_TOKEN || ''
  
  if (!authToken) {
    console.error('Please set AUTH_TOKEN environment variable')
    console.error('You can get this from your browser dev tools after logging in as admin')
    console.error('Look for the sb-* cookie value')
    process.exit(1)
  }
  
  console.log('Testing product import endpoint...')
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-${process.env.SUPABASE_PROJECT_REF || 'localhost'}-auth-token=${authToken}`
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Import failed:', response.status, data)
      return
    }
    
    console.log('Import successful!')
    console.log('Results:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error testing import:', error)
  }
}

testImportProducts()