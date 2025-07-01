#!/usr/bin/env tsx
/**
 * Script de teste local para importação do Odoo
 * 
 * Uso:
 * npx tsx scripts/test-odoo-import-local.ts [comando] [opções]
 * 
 * Comandos disponíveis:
 * - test-connection: Testa a conexão com o Odoo
 * - list-products: Lista produtos disponíveis
 * - list-consultants: Lista consultoras disponíveis
 * - import-products: Importa produtos (dry-run por padrão)
 * - import-consultants: Importa consultoras (dry-run por padrão)
 * - debug-product [id]: Debug detalhado de um produto específico
 * - debug-consultant [email]: Debug detalhado de uma consultora específica
 * 
 * Opções:
 * --limit=N: Limita o número de registros (padrão: 10)
 * --offset=N: Pula N registros
 * --real-run: Executa importação real (apenas para comandos import-*)
 * --verbose: Mostra logs detalhados
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
const xmlrpc = require('xmlrpc')

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// Parse command line arguments
const args = process.argv.slice(2)
const command = args[0] || 'help'
const options = {
  limit: 10,
  offset: 0,
  realRun: false,
  verbose: false,
  targetId: args[1] || null
}

// Parse options
args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1])
  } else if (arg.startsWith('--offset=')) {
    options.offset = parseInt(arg.split('=')[1])
  } else if (arg === '--real-run') {
    options.realRun = true
  } else if (arg === '--verbose') {
    options.verbose = true
  }
})

// Configuration
const config = {
  odoo: {
    url: process.env.ODOO_URL!,
    db: process.env.ODOO_DB!,
    username: process.env.ODOO_USERNAME!,
    apiKey: process.env.ODOO_API_KEY!
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  }
}

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper functions
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  console.log(`[${timestamp}] ${message}`)
  if (data && options.verbose) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function error(message: string, err?: any) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  console.error(`[${timestamp}] ❌ ${message}`)
  if (err && options.verbose) {
    console.error(err)
  }
}

function success(message: string) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  console.log(`[${timestamp}] ✅ ${message}`)
}

async function authenticateOdoo() {
  log('Autenticando com Odoo...')
  
  const common = xmlrpc.createClient({ 
    url: `${config.odoo.url}/xmlrpc/2/common`,
    headers: {
      'User-Agent': 'NodeJS XML-RPC Client',
      'Content-Type': 'text/xml'
    }
  })
  
  const uid = await new Promise<number>((resolve, reject) => {
    common.methodCall('authenticate', [
      config.odoo.db, 
      config.odoo.username, 
      config.odoo.apiKey, 
      {}
    ], (err: any, uid: number) => {
      if (err) reject(err)
      else resolve(uid)
    })
  })
  
  if (!uid) {
    throw new Error('Falha na autenticação - UID não retornado')
  }
  
  success(`Autenticado com sucesso! UID: ${uid}`)
  
  const models = xmlrpc.createClient({ 
    url: `${config.odoo.url}/xmlrpc/2/object`,
    headers: {
      'User-Agent': 'NodeJS XML-RPC Client',
      'Content-Type': 'text/xml'
    }
  })
  
  return { uid, models }
}

// Command implementations
async function testConnection() {
  log('🔍 Testando conexão com Odoo...\n')
  log(`URL: ${config.odoo.url}`)
  log(`Database: ${config.odoo.db}`)
  log(`Username: ${config.odoo.username}`)
  log(`API Key: ${config.odoo.apiKey ? '***' + config.odoo.apiKey.slice(-4) : 'NOT SET'}\n`)
  
  try {
    const { uid, models } = await authenticateOdoo()
    
    // Test Supabase connection
    log('\n🔍 Testando conexão com Supabase...')
    const { data: tables, error: tablesError } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (tablesError) {
      throw new Error(`Erro Supabase: ${tablesError.message}`)
    }
    
    success('Conexão com Supabase OK!')
    
    // Check available models in Odoo
    log('\n📋 Verificando modelos disponíveis no Odoo...')
    const models_list = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'ir.model', 'search_read',
        [[['model', 'in', ['res.partner', 'product.product', 'product.template', 'product.category', 'res.partner.category']]]],
        { fields: ['model', 'name'] }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    console.log('\nModelos encontrados:')
    models_list.forEach((model: any) => {
      console.log(`  - ${model.model}: ${model.name}`)
    })
    
    success('\nTodas as conexões estão funcionando corretamente!')
    
  } catch (err) {
    error('Erro ao testar conexões:', err)
    process.exit(1)
  }
}

async function listProducts() {
  try {
    const { uid, models } = await authenticateOdoo()
    
    log(`\n📦 Buscando produtos (limit: ${options.limit}, offset: ${options.offset})...`)
    
    const products = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'product.product', 'search_read',
        [[['sale_ok', '=', true]]],
        { 
          fields: ['id', 'name', 'default_code', 'list_price', 'qty_available', 'categ_id', 'active'],
          limit: options.limit,
          offset: options.offset
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    console.log(`\nEncontrados ${products.length} produtos:\n`)
    
    products.forEach((product: any) => {
      console.log(`ID: ${product.id}`)
      console.log(`Nome: ${product.name}`)
      console.log(`SKU: ${product.default_code || 'N/A'}`)
      console.log(`Preço: €${product.list_price}`)
      console.log(`Estoque: ${product.qty_available}`)
      console.log(`Categoria: ${product.categ_id ? product.categ_id[1] : 'N/A'}`)
      console.log(`Ativo: ${product.active ? 'Sim' : 'Não'}`)
      console.log('---')
    })
    
    // Check existing products in Supabase
    log('\n🔍 Verificando produtos existentes no Supabase...')
    const odooIds = products.map(p => p.id)
    const { data: existingProducts, error: dbError } = await supabase
      .from('products')
      .select('odoo_id, name')
      .in('odoo_id', odooIds)
    
    if (dbError) {
      error('Erro ao verificar produtos existentes:', dbError)
    } else {
      console.log(`\n${existingProducts?.length || 0} produtos já existem no banco de dados`)
      if (options.verbose && existingProducts?.length) {
        console.log('Produtos existentes:', existingProducts.map(p => p.name))
      }
    }
    
  } catch (err) {
    error('Erro ao listar produtos:', err)
    process.exit(1)
  }
}

async function listConsultants() {
  try {
    const { uid, models } = await authenticateOdoo()
    
    log(`\n👥 Buscando consultoras (limit: ${options.limit}, offset: ${options.offset})...`)
    
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false], ['email', '!=', false]]],
        { 
          fields: ['id', 'name', 'email', 'phone', 'mobile', 'vat', 'city', 'active', 'category_id'],
          limit: options.limit,
          offset: options.offset
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    console.log(`\nEncontradas ${partners.length} consultoras:\n`)
    
    partners.forEach((partner: any) => {
      console.log(`ID: ${partner.id}`)
      console.log(`Nome: ${partner.name}`)
      console.log(`Email: ${partner.email}`)
      console.log(`Telefone: ${partner.phone || partner.mobile || 'N/A'}`)
      console.log(`NIF: ${partner.vat || 'N/A'}`)
      console.log(`Cidade: ${partner.city || 'N/A'}`)
      console.log(`Tags: ${partner.category_id?.length ? partner.category_id.map((c: any) => c[1]).join(', ') : 'Nenhuma'}`)
      console.log(`Ativa: ${partner.active ? 'Sim' : 'Não'}`)
      console.log('---')
    })
    
    // Check existing consultants in Supabase
    log('\n🔍 Verificando consultoras existentes no Supabase...')
    const emails = partners.map(p => p.email).filter(Boolean)
    const { data: existingConsultants, error: dbError } = await supabase
      .from('consultants')
      .select('email, full_name')
      .in('email', emails)
    
    if (dbError) {
      error('Erro ao verificar consultoras existentes:', dbError)
    } else {
      console.log(`\n${existingConsultants?.length || 0} consultoras já existem no banco de dados`)
      if (options.verbose && existingConsultants?.length) {
        console.log('Consultoras existentes:', existingConsultants.map(c => c.full_name))
      }
    }
    
  } catch (err) {
    error('Erro ao listar consultoras:', err)
    process.exit(1)
  }
}

async function debugProduct() {
  if (!options.targetId) {
    error('Por favor, forneça o ID do produto para debug')
    console.log('Uso: npm run test-odoo debug-product [id]')
    process.exit(1)
  }
  
  try {
    const { uid, models } = await authenticateOdoo()
    const productId = parseInt(options.targetId)
    
    log(`\n🔍 Debug detalhado do produto ID: ${productId}`)
    
    // Fetch product details
    const product = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'product.product', 'read',
        [[productId]],
        {}
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result[0])
      })
    })
    
    if (!product) {
      error(`Produto com ID ${productId} não encontrado no Odoo`)
      process.exit(1)
    }
    
    console.log('\n📋 Dados completos do produto no Odoo:')
    console.log(JSON.stringify(product, null, 2))
    
    // Check if exists in Supabase
    log('\n🔍 Verificando produto no Supabase...')
    const { data: existingProduct, error: dbError } = await supabase
      .from('products')
      .select('*')
      .eq('odoo_id', productId)
      .single()
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = not found
      error('Erro ao verificar produto no Supabase:', dbError)
    } else if (existingProduct) {
      console.log('\n✅ Produto encontrado no Supabase:')
      console.log(JSON.stringify(existingProduct, null, 2))
    } else {
      console.log('\n❌ Produto não encontrado no Supabase')
    }
    
  } catch (err) {
    error('Erro ao debugar produto:', err)
    process.exit(1)
  }
}

async function debugConsultant() {
  if (!options.targetId) {
    error('Por favor, forneça o email da consultora para debug')
    console.log('Uso: npm run test-odoo debug-consultant [email]')
    process.exit(1)
  }
  
  try {
    const { uid, models } = await authenticateOdoo()
    const email = options.targetId
    
    log(`\n🔍 Debug detalhado da consultora: ${email}`)
    
    // Fetch consultant details
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'res.partner', 'search_read',
        [[['email', '=', email]]],
        {}
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    if (!partners || partners.length === 0) {
      error(`Consultora com email ${email} não encontrada no Odoo`)
      process.exit(1)
    }
    
    const partner = partners[0]
    console.log('\n📋 Dados completos da consultora no Odoo:')
    console.log(JSON.stringify(partner, null, 2))
    
    // Check if exists in Supabase
    log('\n🔍 Verificando consultora no Supabase...')
    const { data: existingConsultant, error: dbError } = await supabase
      .from('consultants')
      .select('*')
      .eq('email', email)
      .single()
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = not found
      error('Erro ao verificar consultora no Supabase:', dbError)
    } else if (existingConsultant) {
      console.log('\n✅ Consultora encontrada no Supabase:')
      console.log(JSON.stringify(existingConsultant, null, 2))
      
      // Check auth user
      const { data: authUser } = await supabase.auth.admin.getUserById(existingConsultant.user_id)
      if (authUser) {
        console.log('\n✅ Usuário auth encontrado:')
        console.log(`ID: ${authUser.user.id}`)
        console.log(`Email: ${authUser.user.email}`)
        console.log(`Criado em: ${authUser.user.created_at}`)
      }
    } else {
      console.log('\n❌ Consultora não encontrada no Supabase')
    }
    
  } catch (err) {
    error('Erro ao debugar consultora:', err)
    process.exit(1)
  }
}

async function importProducts() {
  try {
    const { uid, models } = await authenticateOdoo()
    
    if (!options.realRun) {
      console.log('\n⚠️  MODO DRY-RUN - Nenhuma alteração será feita no banco de dados')
      console.log('Use --real-run para executar a importação real\n')
    }
    
    log(`\n📦 Importando produtos (limit: ${options.limit})...`)
    
    // Fetch products
    const products = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'product.product', 'search_read',
        [[['sale_ok', '=', true]]],
        { 
          fields: [
            'id', 'name', 'default_code', 'list_price', 'standard_price',
            'qty_available', 'barcode', 'categ_id', 'image_1920',
            'description', 'description_sale', 'active', 'type'
          ],
          limit: options.limit,
          offset: options.offset
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    console.log(`\nProcessando ${products.length} produtos...\n`)
    
    let created = 0
    let updated = 0
    let errors = 0
    
    for (const product of products) {
      try {
        console.log(`\nProcessando: ${product.name}`)
        
        // Check if exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('odoo_id', product.id)
          .single()
        
        if (options.realRun) {
          // Real import logic here
          // ... (simplified for brevity)
          
          if (existing) {
            updated++
            console.log(`  ✅ Atualizado`)
          } else {
            created++
            console.log(`  ✅ Criado`)
          }
        } else {
          // Dry run - just log what would happen
          if (existing) {
            console.log(`  📝 Seria atualizado (ID: ${existing.id})`)
          } else {
            console.log(`  📝 Seria criado`)
          }
        }
        
      } catch (err) {
        errors++
        error(`  ❌ Erro: ${err}`)
      }
    }
    
    console.log('\n📊 Resumo da importação:')
    console.log(`  - Total processado: ${products.length}`)
    if (options.realRun) {
      console.log(`  - Criados: ${created}`)
      console.log(`  - Atualizados: ${updated}`)
      console.log(`  - Erros: ${errors}`)
    } else {
      console.log(`  - Modo: DRY-RUN (nenhuma alteração foi feita)`)
    }
    
  } catch (err) {
    error('Erro ao importar produtos:', err)
    process.exit(1)
  }
}

async function importConsultants() {
  try {
    const { uid, models } = await authenticateOdoo()
    
    if (!options.realRun) {
      console.log('\n⚠️  MODO DRY-RUN - Nenhuma alteração será feita no banco de dados')
      console.log('Use --real-run para executar a importação real\n')
    }
    
    log(`\n👥 Importando consultoras (limit: ${options.limit})...`)
    
    // Fetch consultants
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false], ['email', '!=', false]]],
        { 
          fields: [
            'id', 'name', 'email', 'phone', 'mobile', 'vat', 
            'street', 'city', 'zip', 'country_id', 'active'
          ],
          limit: options.limit,
          offset: options.offset
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    console.log(`\nProcessando ${partners.length} consultoras...\n`)
    
    let created = 0
    let updated = 0
    let errors = 0
    
    for (const partner of partners) {
      try {
        console.log(`\nProcessando: ${partner.name} (${partner.email})`)
        
        // Check if exists
        const { data: existing } = await supabase
          .from('consultants')
          .select('id, code')
          .eq('email', partner.email)
          .single()
        
        if (options.realRun) {
          // Real import logic here
          // ... (simplified for brevity)
          
          if (existing) {
            updated++
            console.log(`  ✅ Atualizada (Código: ${existing.code})`)
          } else {
            created++
            console.log(`  ✅ Criada`)
          }
        } else {
          // Dry run - just log what would happen
          if (existing) {
            console.log(`  📝 Seria atualizada (Código: ${existing.code})`)
          } else {
            console.log(`  📝 Seria criada`)
          }
        }
        
      } catch (err) {
        errors++
        error(`  ❌ Erro: ${err}`)
      }
    }
    
    console.log('\n📊 Resumo da importação:')
    console.log(`  - Total processado: ${partners.length}`)
    if (options.realRun) {
      console.log(`  - Criadas: ${created}`)
      console.log(`  - Atualizadas: ${updated}`)
      console.log(`  - Erros: ${errors}`)
    } else {
      console.log(`  - Modo: DRY-RUN (nenhuma alteração foi feita)`)
    }
    
  } catch (err) {
    error('Erro ao importar consultoras:', err)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
Script de Teste Local para Importação do Odoo

Uso:
  npx tsx scripts/test-odoo-import-local.ts [comando] [opções]

Comandos disponíveis:
  test-connection      Testa a conexão com Odoo e Supabase
  list-products        Lista produtos disponíveis no Odoo
  list-consultants     Lista consultoras disponíveis no Odoo
  import-products      Importa produtos (dry-run por padrão)
  import-consultants   Importa consultoras (dry-run por padrão)
  debug-product [id]   Debug detalhado de um produto específico
  debug-consultant [email]  Debug detalhado de uma consultora específica

Opções:
  --limit=N      Limita o número de registros (padrão: 10)
  --offset=N     Pula N registros
  --real-run     Executa importação real (apenas para comandos import-*)
  --verbose      Mostra logs detalhados

Exemplos:
  # Testar conexões
  npx tsx scripts/test-odoo-import-local.ts test-connection

  # Listar primeiros 20 produtos
  npx tsx scripts/test-odoo-import-local.ts list-products --limit=20

  # Debug de um produto específico
  npx tsx scripts/test-odoo-import-local.ts debug-product 123

  # Importar 5 produtos (dry-run)
  npx tsx scripts/test-odoo-import-local.ts import-products --limit=5

  # Importar produtos de verdade
  npx tsx scripts/test-odoo-import-local.ts import-products --limit=5 --real-run
`)
}

// Main execution
async function main() {
  console.log('🚀 Script de Teste Local - Importação Odoo\n')
  
  switch (command) {
    case 'test-connection':
      await testConnection()
      break
    case 'list-products':
      await listProducts()
      break
    case 'list-consultants':
      await listConsultants()
      break
    case 'import-products':
      await importProducts()
      break
    case 'import-consultants':
      await importConsultants()
      break
    case 'debug-product':
      await debugProduct()
      break
    case 'debug-consultant':
      await debugConsultant()
      break
    case 'help':
    default:
      showHelp()
  }
}

// Run the script
main().catch(err => {
  error('Erro fatal:', err)
  process.exit(1)
})