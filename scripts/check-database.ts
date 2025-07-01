#!/usr/bin/env tsx
/**
 * Script to check Supabase database structure and imported data
 * 
 * Usage:
 * npx tsx scripts/check-database.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTableStructure() {
  console.log('\n📊 DATABASE STRUCTURE CHECK')
  console.log('=' .repeat(60))
  
  const tables = [
    'profiles',
    'categories', 
    'products',
    'product_images',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'otp_codes',
    'addresses'
  ]
  
  console.log('\n📋 Checking tables:')
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ ${table}: ${count || 0} records`)
      }
    } catch (err: any) {
      console.log(`  ❌ ${table}: ${err.message}`)
    }
  }
}

async function checkProducts() {
  console.log('\n\n📦 PRODUCTS DATA CHECK')
  console.log('=' .repeat(60))
  
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\nTotal products: ${totalCount || 0}`)
    
    // Get products with details
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        sale_price,
        sku,
        stock_quantity,
        category_id,
        featured,
        active,
        created_at,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching products:', error.message)
      return
    }
    
    if (!products || products.length === 0) {
      console.log('\n⚠️  No products found in database')
      return
    }
    
    // Check for products with categories
    const { count: withCategory } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('category_id', 'is', null)
    
    // Check for active products
    const { count: activeCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
    
    // Check for featured products  
    const { count: featuredCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('featured', true)
    
    // Check for products with images
    const { data: productsWithImages } = await supabase
      .from('product_images')
      .select('product_id')
      .eq('is_primary', true)
    
    const uniqueProductsWithImages = new Set(productsWithImages?.map(p => p.product_id) || [])
    
    console.log('\n📊 Product Statistics:')
    console.log(`  • Active products: ${activeCount || 0}`)
    console.log(`  • Featured products: ${featuredCount || 0}`)
    console.log(`  • Products with categories: ${withCategory || 0}`)
    console.log(`  • Products with images: ${uniqueProductsWithImages.size}`)
    
    console.log('\n📋 Sample Products (latest 5):')
    products.slice(0, 5).forEach((product, index) => {
      console.log(`\n  ${index + 1}. ${product.name}`)
      console.log(`     SKU: ${product.sku || 'N/A'}`)
      console.log(`     Price: €${product.price}`)
      if (product.sale_price) {
        console.log(`     Sale Price: €${product.sale_price}`)
      }
      console.log(`     Stock: ${product.stock_quantity}`)
      console.log(`     Status: ${product.active ? 'Active' : 'Inactive'}`)
      console.log(`     Created: ${new Date(product.created_at).toLocaleDateString()}`)
    })
    
    // Check for potential issues
    console.log('\n🔍 Data Quality Check:')
    
    // Products without SKU
    const { count: noSku } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('sku', null)
    
    // Products with zero or negative price
    const { count: invalidPrice } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lte('price', 0)
    
    // Products without description
    const { count: noDescription } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('description', null)
    
    if (noSku && noSku > 0) {
      console.log(`  ⚠️  Products without SKU: ${noSku}`)
    }
    if (invalidPrice && invalidPrice > 0) {
      console.log(`  ⚠️  Products with invalid price: ${invalidPrice}`)
    }
    if (noDescription && noDescription > 0) {
      console.log(`  ⚠️  Products without description: ${noDescription}`)
    }
    
    if (!noSku && !invalidPrice && !noDescription) {
      console.log(`  ✅ All products have valid data`)
    }
    
  } catch (err: any) {
    console.error('Error checking products:', err.message)
  }
}

async function checkCategories() {
  console.log('\n\n🏷️  CATEGORIES DATA CHECK')
  console.log('=' .repeat(60))
  
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error.message)
      return
    }
    
    console.log(`\nTotal categories: ${categories?.length || 0}`)
    
    if (categories && categories.length > 0) {
      console.log('\n📋 Categories:')
      categories.forEach(cat => {
        const prefix = cat.parent_id ? '  └─ ' : '• '
        console.log(`${prefix}${cat.name} (${cat.slug})`)
      })
      
      // Check category usage
      console.log('\n📊 Category Usage:')
      for (const category of categories.slice(0, 5)) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
        
        console.log(`  • ${category.name}: ${count || 0} products`)
      }
    }
  } catch (err: any) {
    console.error('Error checking categories:', err.message)
  }
}

async function checkImages() {
  console.log('\n\n🖼️  PRODUCT IMAGES CHECK')
  console.log('=' .repeat(60))
  
  try {
    const { count: totalImages } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
    
    const { count: primaryImages } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('is_primary', true)
    
    console.log(`\nTotal images: ${totalImages || 0}`)
    console.log(`Primary images: ${primaryImages || 0}`)
    
    // Sample images
    const { data: sampleImages } = await supabase
      .from('product_images')
      .select(`
        *,
        products!inner(name)
      `)
      .limit(5)
    
    if (sampleImages && sampleImages.length > 0) {
      console.log('\n📋 Sample Images:')
      sampleImages.forEach((img, index) => {
        console.log(`\n  ${index + 1}. Product: ${img.products.name}`)
        console.log(`     URL: ${img.image_url.substring(0, 50)}...`)
        console.log(`     Primary: ${img.is_primary ? 'Yes' : 'No'}`)
        console.log(`     Position: ${img.position}`)
      })
    }
  } catch (err: any) {
    console.error('Error checking images:', err.message)
  }
}

async function checkRecentActivity() {
  console.log('\n\n📈 RECENT ACTIVITY')
  console.log('=' .repeat(60))
  
  try {
    // Recent products
    const { data: recentProducts } = await supabase
      .from('products')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentProducts && recentProducts.length > 0) {
      console.log('\n🆕 Recently Added Products:')
      recentProducts.forEach(product => {
        const date = new Date(product.created_at)
        console.log(`  • ${product.name} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`)
      })
    }
    
    // Recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('order_number, total, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentOrders && recentOrders.length > 0) {
      console.log('\n🛍️  Recent Orders:')
      recentOrders.forEach(order => {
        const date = new Date(order.created_at)
        console.log(`  • ${order.order_number} - €${order.total} - ${order.status} - ${date.toLocaleDateString()}`)
      })
    } else {
      console.log('\n🛍️  No orders found')
    }
  } catch (err: any) {
    console.error('Error checking recent activity:', err.message)
  }
}

async function main() {
  console.log('🔍 Checking Supabase Database...')
  console.log(`📍 URL: ${supabaseUrl}`)
  
  try {
    await checkTableStructure()
    await checkProducts()
    await checkCategories()
    await checkImages()
    await checkRecentActivity()
    
    console.log('\n\n✅ Database check completed!')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()