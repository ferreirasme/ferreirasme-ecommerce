import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"
const xmlrpc = require('xmlrpc')

interface MatchRequest {
  dryRun?: boolean // If true, only preview matches without updating
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { dryRun = false }: MatchRequest = await request.json()
    const supabase = await createClient()

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
    console.log('[MATCH ODOO] Authenticating with Odoo...')
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    if (!uid) {
      return NextResponse.json({ error: 'Failed to authenticate with Odoo' }, { status: 401 })
    }

    // Get unmapped products from database
    const { data: unmappedProducts, error: unmappedError } = await supabase
      .from('products')
      .select('id, name, sku')
      .is('odoo_id', null)

    if (unmappedError) throw unmappedError

    console.log(`[MATCH ODOO] Found ${unmappedProducts?.length || 0} unmapped products`)

    // Fetch all products from Odoo
    console.log('[MATCH ODOO] Fetching products from Odoo...')
    const odooProducts = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'product.product', 'search_read',
        [[['sale_ok', '=', true]]],
        { 
          fields: ['id', 'name', 'default_code'],
          limit: 10000
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log(`[MATCH ODOO] Fetched ${odooProducts.length} products from Odoo`)

    // Create maps for efficient matching
    const odooBySkuMap = new Map<string, any>()
    const odooByNameMap = new Map<string, any>()

    odooProducts.forEach(product => {
      if (product.default_code) {
        odooBySkuMap.set(product.default_code.toLowerCase().trim(), product)
      }
      odooByNameMap.set(product.name.toLowerCase().trim(), product)
    })

    const matches: any[] = []
    const noMatches: any[] = []
    let updated = 0

    // Match products
    for (const localProduct of unmappedProducts || []) {
      let matchedOdooProduct = null
      let matchType = ''

      // First try to match by SKU
      if (localProduct.sku) {
        const skuLower = localProduct.sku.toLowerCase().trim()
        if (odooBySkuMap.has(skuLower)) {
          matchedOdooProduct = odooBySkuMap.get(skuLower)
          matchType = 'SKU'
        }
      }

      // If no SKU match, try by name
      if (!matchedOdooProduct && localProduct.name) {
        const nameLower = localProduct.name.toLowerCase().trim()
        if (odooByNameMap.has(nameLower)) {
          matchedOdooProduct = odooByNameMap.get(nameLower)
          matchType = 'NAME'
        }
      }

      if (matchedOdooProduct) {
        matches.push({
          localId: localProduct.id,
          localName: localProduct.name,
          localSku: localProduct.sku,
          odooId: matchedOdooProduct.id,
          odooName: matchedOdooProduct.name,
          odooSku: matchedOdooProduct.default_code,
          matchType
        })

        // Update the product with odoo_id if not in dry run mode
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ odoo_id: matchedOdooProduct.id })
            .eq('id', localProduct.id)

          if (!updateError) {
            updated++
          } else {
            console.error(`[MATCH ODOO] Error updating product ${localProduct.id}:`, updateError)
          }
        }
      } else {
        noMatches.push({
          id: localProduct.id,
          name: localProduct.name,
          sku: localProduct.sku
        })
      }
    }

    // Log the matching action
    if (!dryRun && updated > 0) {
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: admin.id,
          action: 'MATCH_PRODUCTS_WITH_ODOO',
          entity_type: 'product',
          details: {
            matched: matches.length,
            updated,
            noMatches: noMatches.length,
            duration: `${Date.now() - startTime}ms`
          }
        })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        total: unmappedProducts?.length || 0,
        matched: matches.length,
        updated: dryRun ? 0 : updated,
        noMatches: noMatches.length
      },
      matches: matches.slice(0, 100), // Return first 100 matches
      noMatches: noMatches.slice(0, 100), // Return first 100 non-matches
      duration: `${Date.now() - startTime}ms`
    })

  } catch (error: any) {
    console.error('[MATCH ODOO] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error matching products' },
      { status: 500 }
    )
  }
}