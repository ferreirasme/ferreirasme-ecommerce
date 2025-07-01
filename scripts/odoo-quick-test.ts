#!/usr/bin/env tsx
/**
 * Script de teste rápido para debug de problemas específicos com Odoo
 * 
 * Uso:
 * npx tsx scripts/odoo-quick-test.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
const xmlrpc = require('xmlrpc')

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const config = {
  url: process.env.ODOO_URL!,
  db: process.env.ODOO_DB!,
  username: process.env.ODOO_USERNAME!,
  apiKey: process.env.ODOO_API_KEY!
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function quickTest() {
  log('\n🚀 Teste Rápido - Odoo Debug\n', colors.bright)
  
  try {
    // 1. Test basic connection
    log('1️⃣  Testando conexão básica...', colors.cyan)
    const common = xmlrpc.createClient({ 
      url: `${config.url}/xmlrpc/2/common`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })
    
    // Get server version
    const version = await new Promise((resolve, reject) => {
      common.methodCall('version', [], (err: any, version: any) => {
        if (err) reject(err)
        else resolve(version)
      })
    })
    log(`   ✓ Versão do servidor: ${JSON.stringify(version)}`, colors.green)
    
    // 2. Test authentication
    log('\n2️⃣  Testando autenticação...', colors.cyan)
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [config.db, config.username, config.apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })
    log(`   ✓ Autenticado! UID: ${uid}`, colors.green)
    
    const models = xmlrpc.createClient({ 
      url: `${config.url}/xmlrpc/2/object`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })
    
    // 3. Test access rights
    log('\n3️⃣  Verificando permissões de acesso...', colors.cyan)
    const checkAccess = async (model: string, operation: string) => {
      try {
        const hasAccess = await new Promise<boolean>((resolve) => {
          models.methodCall('execute_kw', [
            config.db, uid, config.apiKey,
            model, 'check_access_rights',
            [[operation]],
            { raise_exception: false }
          ], (err: any, result: any) => {
            if (err) resolve(false)
            else resolve(result)
          })
        })
        const icon = hasAccess ? '✓' : '✗'
        const color = hasAccess ? colors.green : colors.red
        log(`   ${icon} ${model}.${operation}: ${hasAccess}`, color)
        return hasAccess
      } catch (err) {
        log(`   ✗ ${model}.${operation}: Error`, colors.red)
        return false
      }
    }
    
    await checkAccess('res.partner', 'read')
    await checkAccess('res.partner', 'write')
    await checkAccess('product.product', 'read')
    await checkAccess('product.product', 'write')
    await checkAccess('product.category', 'read')
    await checkAccess('res.partner.category', 'read')
    
    // 4. Quick data check
    log('\n4️⃣  Verificação rápida de dados...', colors.cyan)
    
    // Count records
    const countRecords = async (model: string, domain: any[] = []) => {
      const count = await new Promise<number>((resolve, reject) => {
        models.methodCall('execute_kw', [
          config.db, uid, config.apiKey,
          model, 'search_count',
          [domain]
        ], (err: any, count: number) => {
          if (err) reject(err)
          else resolve(count)
        })
      })
      return count
    }
    
    const partnerCount = await countRecords('res.partner', [['is_company', '=', false]])
    const companyCount = await countRecords('res.partner', [['is_company', '=', true]])
    const productCount = await countRecords('product.product', [['sale_ok', '=', true]])
    const categoryCount = await countRecords('product.category')
    const partnerCategoryCount = await countRecords('res.partner.category')
    
    log(`   📊 Parceiros (pessoas): ${partnerCount}`, colors.yellow)
    log(`   📊 Parceiros (empresas): ${companyCount}`, colors.yellow)
    log(`   📊 Produtos vendáveis: ${productCount}`, colors.yellow)
    log(`   📊 Categorias de produto: ${categoryCount}`, colors.yellow)
    log(`   📊 Tags de parceiros: ${partnerCategoryCount}`, colors.yellow)
    
    // 5. Sample data
    log('\n5️⃣  Amostra de dados...', colors.cyan)
    
    // Get sample partner
    const samplePartners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.db, uid, config.apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false], ['email', '!=', false]]],
        { fields: ['name', 'email', 'phone'], limit: 3 }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    if (samplePartners.length > 0) {
      log('\n   📌 Amostra de Parceiros:', colors.magenta)
      samplePartners.forEach(p => {
        log(`      - ${p.name} (${p.email})`, colors.dim)
      })
    }
    
    // Get sample products
    const sampleProducts = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.db, uid, config.apiKey,
        'product.product', 'search_read',
        [[['sale_ok', '=', true]]],
        { fields: ['name', 'default_code', 'list_price'], limit: 3 }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    if (sampleProducts.length > 0) {
      log('\n   📌 Amostra de Produtos:', colors.magenta)
      sampleProducts.forEach(p => {
        log(`      - ${p.name} (SKU: ${p.default_code || 'N/A'}, €${p.list_price})`, colors.dim)
      })
    }
    
    // 6. Field inspection
    log('\n6️⃣  Inspeção de campos disponíveis...', colors.cyan)
    
    const getFields = async (model: string) => {
      const fields = await new Promise<any>((resolve, reject) => {
        models.methodCall('execute_kw', [
          config.db, uid, config.apiKey,
          model, 'fields_get',
          [],
          { attributes: ['string', 'type', 'required', 'readonly'] }
        ], (err: any, result: any) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      return fields
    }
    
    // Show important fields for res.partner
    const partnerFields = await getFields('res.partner')
    const importantPartnerFields = ['name', 'email', 'phone', 'mobile', 'vat', 'ref', 'category_id', 'image_1920']
    log('\n   📋 Campos importantes em res.partner:', colors.magenta)
    importantPartnerFields.forEach(field => {
      if (partnerFields[field]) {
        const f = partnerFields[field]
        log(`      - ${field}: ${f.type} ${f.required ? '(obrigatório)' : ''}`, colors.dim)
      }
    })
    
    // Show important fields for product.product
    const productFields = await getFields('product.product')
    const importantProductFields = ['name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'categ_id', 'image_1920']
    log('\n   📋 Campos importantes em product.product:', colors.magenta)
    importantProductFields.forEach(field => {
      if (productFields[field]) {
        const f = productFields[field]
        log(`      - ${field}: ${f.type} ${f.required ? '(obrigatório)' : ''}`, colors.dim)
      }
    })
    
    log('\n✅ Teste rápido concluído com sucesso!\n', colors.green + colors.bright)
    
  } catch (error: any) {
    log(`\n❌ Erro durante o teste: ${error.message}`, colors.red + colors.bright)
    console.error(error)
    process.exit(1)
  }
}

// Run the test
quickTest()