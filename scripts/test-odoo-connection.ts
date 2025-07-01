import * as dotenv from 'dotenv'
import { resolve } from 'path'
const xmlrpc = require('xmlrpc')

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.ODOO_URL!
const db = process.env.ODOO_DB!
const username = process.env.ODOO_USERNAME!
const apiKey = process.env.ODOO_API_KEY!

async function testOdooConnection() {
  console.log('🔍 Testando conexão com Odoo...\n')
  console.log(`URL: ${url}`)
  console.log(`Database: ${db}`)
  console.log(`Username: ${username}`)
  console.log(`API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'NOT SET'}\n`)

  try {
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

    // 1. Test authentication
    console.log('1. Testando autenticação...')
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })
    
    console.log(`✅ Autenticado com sucesso! UID: ${uid}\n`)

    // 2. Check available models
    console.log('2. Verificando modelos disponíveis...')
    const models_list = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'ir.model', 'search_read',
        [[['model', 'in', ['res.partner', 'product.product', 'product.template', 'sale.order']]]],
        { fields: ['model', 'name'] }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log('Modelos encontrados:')
    models_list.forEach((model: any) => {
      console.log(`  - ${model.model}: ${model.name}`)
    })

    // 3. Check consultants (partners with specific tags/categories)
    console.log('\n3. Buscando consultoras (parceiros)...')
    const partners = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner', 'search_read',
        [[]],
        { 
          fields: ['name', 'email', 'phone', 'mobile', 'is_company', 'customer_rank', 'supplier_rank', 'vat', 'street', 'city', 'zip', 'country_id', 'category_id'],
          limit: 10 
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log(`Total de parceiros encontrados (primeiros 10):`)
    partners.forEach((partner: any) => {
      console.log(`\n  Nome: ${partner.name}`)
      console.log(`  Email: ${partner.email || 'N/A'}`)
      console.log(`  Telefone: ${partner.phone || partner.mobile || 'N/A'}`)
      console.log(`  É empresa: ${partner.is_company ? 'Sim' : 'Não'}`)
      console.log(`  NIF: ${partner.vat || 'N/A'}`)
      console.log(`  Tags: ${partner.category_id ? partner.category_id.join(', ') : 'Nenhuma'}`)
    })

    // 4. Check products
    console.log('\n\n4. Buscando produtos...')
    const products = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'product.product', 'search_read',
        [[]],
        { 
          fields: ['name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'barcode', 'categ_id', 'image_1920'],
          limit: 5 
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log(`Total de produtos encontrados (primeiros 5):`)
    products.forEach((product: any) => {
      console.log(`\n  Nome: ${product.name}`)
      console.log(`  Código: ${product.default_code || 'N/A'}`)
      console.log(`  Preço: €${product.list_price}`)
      console.log(`  Custo: €${product.standard_price}`)
      console.log(`  Estoque: ${product.qty_available}`)
      console.log(`  Categoria: ${product.categ_id ? product.categ_id[1] : 'N/A'}`)
      console.log(`  Tem imagem: ${product.image_1920 ? 'Sim' : 'Não'}`)
    })

    // 5. Check partner categories (tags)
    console.log('\n\n5. Verificando categorias/tags de parceiros...')
    const categories = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner.category', 'search_read',
        [[]],
        { fields: ['name', 'color', 'partner_ids'] }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log('Categorias de parceiros:')
    categories.forEach((cat: any) => {
      console.log(`  - ${cat.name} (${cat.partner_ids?.length || 0} parceiros)`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Run the test
testOdooConnection()