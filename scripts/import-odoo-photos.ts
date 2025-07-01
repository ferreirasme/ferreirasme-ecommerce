#!/usr/bin/env tsx
import 'dotenv/config'

/**
 * Script to import product photos from Odoo
 * 
 * This script handles the complete workflow:
 * 1. Identify products without odoo_id
 * 2. Match products by SKU/name
 * 3. Update products with odoo_id
 * 4. Import photos in batches
 * 
 * Usage:
 * npm run import-odoo-photos
 * npm run import-odoo-photos -- --dry-run
 * npm run import-odoo-photos -- --batch-size=100 --total-batches=20
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

interface ImportOptions {
  dryRun: boolean
  batchSize: number
  totalBatches: number
  onlyMissingPhotos: boolean
}

// Parse command line arguments
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const options: ImportOptions = {
    dryRun: false,
    batchSize: 50,
    totalBatches: 10,
    onlyMissingPhotos: true
  }

  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--total-batches=')) {
      options.totalBatches = parseInt(arg.split('=')[1])
    } else if (arg === '--all-photos') {
      options.onlyMissingPhotos = false
    }
  })

  return options
}

// Login as admin
async function loginAsAdmin(): Promise<string> {
  console.log('🔐 Logging in as admin...')
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  })

  if (!response.ok) {
    throw new Error('Failed to login as admin')
  }

  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error('No auth cookie received')
  }

  return setCookie
}

// Step 1: Identify unmapped products
async function identifyUnmappedProducts(authCookie: string) {
  console.log('\n📋 Step 1: Identifying unmapped products...')
  
  const response = await fetch(`${API_BASE_URL}/api/products/identify-unmapped`, {
    headers: { 'Cookie': authCookie }
  })

  if (!response.ok) {
    throw new Error('Failed to identify unmapped products')
  }

  const data = await response.json()
  
  console.log(`✅ Found ${data.stats.unmapped} unmapped products out of ${data.stats.total} total products`)
  console.log(`   Mapping coverage: ${data.stats.mappingPercentage}%`)
  
  return data
}

// Step 2: Match products with Odoo
async function matchProductsWithOdoo(authCookie: string, dryRun: boolean) {
  console.log(`\n🔍 Step 2: Matching products with Odoo ${dryRun ? '(DRY RUN)' : ''}...`)
  
  const response = await fetch(`${API_BASE_URL}/api/products/match-odoo`, {
    method: 'POST',
    headers: { 
      'Cookie': authCookie,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dryRun })
  })

  if (!response.ok) {
    throw new Error('Failed to match products')
  }

  const data = await response.json()
  
  console.log(`✅ Matching completed:`)
  console.log(`   Total unmapped: ${data.stats.total}`)
  console.log(`   Matched: ${data.stats.matched}`)
  console.log(`   Updated: ${data.stats.updated}`)
  console.log(`   No matches: ${data.stats.noMatches}`)
  
  if (data.matches.length > 0) {
    console.log('\n   Sample matches:')
    data.matches.slice(0, 5).forEach((match: any) => {
      console.log(`   - ${match.localName} → ${match.odooName} (${match.matchType})`)
    })
  }

  if (data.noMatches.length > 0) {
    console.log('\n   ⚠️  Products without matches:')
    data.noMatches.slice(0, 5).forEach((product: any) => {
      console.log(`   - ${product.name} (SKU: ${product.sku || 'N/A'})`)
    })
  }
  
  return data
}

// Step 3: Import photos in batches
async function importPhotosInBatches(authCookie: string, options: ImportOptions) {
  console.log(`\n📸 Step 3: Importing photos in batches...`)
  console.log(`   Batch size: ${options.batchSize}`)
  console.log(`   Total batches: ${options.totalBatches}`)
  console.log(`   Only missing photos: ${options.onlyMissingPhotos}`)
  
  let startFrom = 0
  let totalStats = {
    totalProcessed: 0,
    totalUpdated: 0,
    totalFailed: 0
  }

  // Process in chunks to handle large datasets
  const chunksToProcess = Math.ceil(options.totalBatches / 10)
  
  for (let chunk = 0; chunk < chunksToProcess; chunk++) {
    const batchesInChunk = Math.min(10, options.totalBatches - (chunk * 10))
    
    console.log(`\n   Processing chunk ${chunk + 1}/${chunksToProcess} (${batchesInChunk} batches)...`)
    
    const response = await fetch(`${API_BASE_URL}/api/products/batch-import-photos`, {
      method: 'POST',
      headers: { 
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        totalBatches: batchesInChunk,
        batchSize: options.batchSize,
        startFrom: startFrom,
        onlyMissingPhotos: options.onlyMissingPhotos
      })
    })

    if (!response.ok) {
      console.error('   ❌ Failed to import photos in chunk', chunk + 1)
      continue
    }

    const data = await response.json()
    
    totalStats.totalProcessed += data.stats.totalProcessed
    totalStats.totalUpdated += data.stats.totalUpdated
    totalStats.totalFailed += data.stats.totalFailed
    
    console.log(`   ✅ Chunk ${chunk + 1} completed:`)
    console.log(`      Processed: ${data.stats.totalProcessed}`)
    console.log(`      Updated: ${data.stats.totalUpdated}`)
    console.log(`      Failed: ${data.stats.totalFailed}`)
    console.log(`      Remaining: ${data.stats.remainingProducts}`)
    
    startFrom = data.nextOffset
    
    // Stop if no more products to process
    if (data.stats.remainingProducts === 0) {
      console.log('\n   ✅ All products processed!')
      break
    }
    
    // Add delay between chunks
    if (chunk < chunksToProcess - 1) {
      console.log('   ⏳ Waiting before next chunk...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return totalStats
}

// Main execution
async function main() {
  console.log('🚀 Odoo Product Photo Import Script')
  console.log('===================================\n')
  
  const options = parseArgs()
  
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required')
    process.exit(1)
  }
  
  try {
    // Login
    const authCookie = await loginAsAdmin()
    console.log('✅ Successfully logged in as admin')
    
    // Step 1: Identify unmapped products
    const unmappedData = await identifyUnmappedProducts(authCookie)
    
    if (unmappedData.stats.unmapped === 0) {
      console.log('\n✨ All products are already mapped to Odoo!')
    } else {
      // Step 2: Match products (dry run first if not specified)
      if (!options.dryRun) {
        console.log('\n🔍 Running dry run first to preview matches...')
        await matchProductsWithOdoo(authCookie, true)
        
        console.log('\n❓ Do you want to proceed with the actual matching? (Press Ctrl+C to cancel)')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      
      // Actual matching
      const matchData = await matchProductsWithOdoo(authCookie, options.dryRun)
      
      if (options.dryRun) {
        console.log('\n✅ Dry run completed. No changes were made.')
        return
      }
    }
    
    // Step 3: Import photos
    console.log('\n🎯 Starting photo import process...')
    const importStats = await importPhotosInBatches(authCookie, options)
    
    // Final summary
    console.log('\n📊 Final Summary')
    console.log('================')
    console.log(`Total products processed: ${importStats.totalProcessed}`)
    console.log(`Photos imported: ${importStats.totalUpdated}`)
    console.log(`Failed imports: ${importStats.totalFailed}`)
    console.log(`Success rate: ${importStats.totalProcessed > 0 ? Math.round((importStats.totalUpdated / importStats.totalProcessed) * 100) : 0}%`)
    
    console.log('\n✅ Import process completed successfully!')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)