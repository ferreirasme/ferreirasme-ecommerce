import * as dotenv from 'dotenv'
import { resolve } from 'path'
const xmlrpc = require('xmlrpc')

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.ODOO_URL!
const db = process.env.ODOO_DB!
const username = process.env.ODOO_USERNAME!
const apiKey = process.env.ODOO_API_KEY!

async function analyzeOdooFields() {
  console.log('🔍 Analisando campos da Odoo para consultoras...\n')

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

    // Authenticate
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    console.log(`✅ Autenticado com sucesso! UID: ${uid}\n`)

    // 1. Get all fields from res.partner model
    console.log('1. Analisando campos disponíveis no modelo res.partner...')
    const fields = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner', 'fields_get',
        [],
        { attributes: ['string', 'type', 'help', 'required', 'readonly'] }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    // Filter relevant fields for consultants
    const relevantFields = [
      'name', 'email', 'phone', 'mobile', 'street', 'street2', 'city', 'state_id', 
      'zip', 'country_id', 'vat', 'ref', 'lang', 'website', 'comment', 'function',
      'title', 'company_name', 'category_id', 'user_id', 'property_account_position_id',
      'property_payment_term_id', 'property_product_pricelist', 'currency_id',
      'credit_limit', 'bank_ids', 'active', 'customer_rank', 'supplier_rank',
      'employee', 'is_company', 'color', 'partner_share', 'contact_address',
      'commercial_partner_id', 'commercial_company_name', 'company_id'
    ]

    console.log('\nCampos relevantes para consultoras:')
    relevantFields.forEach(fieldName => {
      if (fields[fieldName]) {
        const field = fields[fieldName]
        console.log(`\n- ${fieldName}:`)
        console.log(`  Tipo: ${field.type}`)
        console.log(`  Descrição: ${field.string}`)
        if (field.help) console.log(`  Ajuda: ${field.help}`)
      }
    })

    // 2. Fetch sample partners to see actual data
    console.log('\n\n2. Buscando exemplos de parceiros para analisar dados reais...')
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false], ['customer_rank', '>', 0]]],
        { 
          fields: relevantFields.filter(f => fields[f]),
          limit: 3 
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log(`\nEncontrados ${partners.length} parceiros. Exemplos:`)
    partners.forEach((partner, index) => {
      console.log(`\n\nParceiro ${index + 1}:`)
      Object.entries(partner).forEach(([key, value]) => {
        if (value && value !== false) {
          console.log(`  ${key}: ${JSON.stringify(value)}`)
        }
      })
    })

    // 3. Check partner categories (tags)
    console.log('\n\n3. Analisando categorias/tags de parceiros...')
    const categories = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner.category', 'search_read',
        [[]],
        { fields: ['name', 'color', 'parent_id', 'child_ids'] }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log('Categorias disponíveis:')
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Cor: ${cat.color})`)
    })

    // 4. Check bank account fields
    console.log('\n\n4. Analisando estrutura de contas bancárias...')
    const bankFields = await new Promise<any>((resolve, reject) => {
      models.methodCall('execute_kw', [
        db, uid, apiKey,
        'res.partner.bank', 'fields_get',
        [],
        { attributes: ['string', 'type', 'required'] }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })

    console.log('\nCampos de conta bancária:')
    Object.entries(bankFields).forEach(([fieldName, field]: [string, any]) => {
      if (['acc_number', 'bank_id', 'partner_id', 'acc_holder_name'].includes(fieldName)) {
        console.log(`  - ${fieldName}: ${field.string} (${field.type})`)
      }
    })

    // 5. Summary of mapping
    console.log('\n\n5. MAPEAMENTO SUGERIDO ODOO → SISTEMA:')
    console.log('=====================================')
    console.log('DADOS PESSOAIS:')
    console.log('  name → full_name')
    console.log('  email → email')
    console.log('  phone → phone')
    console.log('  mobile → whatsapp')
    console.log('  vat → nif')
    console.log('  ref → código interno (se usado)')
    console.log('  function → cargo/função')
    console.log('  website → website')
    console.log('  comment → notes')
    console.log('\nENDEREÇO:')
    console.log('  street → address_street')
    console.log('  street2 → address_complement')
    console.log('  city → address_city')
    console.log('  state_id → address_state')
    console.log('  zip → address_postal_code')
    console.log('  country_id → address_country')
    console.log('\nFINANCEIRO:')
    console.log('  bank_ids → buscar dados bancários relacionados')
    console.log('  property_payment_term_id → condições de pagamento')
    console.log('  credit_limit → limite de crédito')
    console.log('\nCLASSIFICAÇÃO:')
    console.log('  category_id → tags/categorias')
    console.log('  customer_rank → ranking como cliente')
    console.log('  supplier_rank → ranking como fornecedor')
    console.log('  is_company → tipo de parceiro')
    console.log('  active → status ativo/inativo')

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Run analysis
analyzeOdooFields()