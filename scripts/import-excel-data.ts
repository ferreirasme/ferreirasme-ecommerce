import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to generate consultant code
function generateConsultantCode(): string {
  const randomNum = Math.floor(Math.random() * 9000) + 1000
  return `CONS${randomNum}`
}

// Helper function to generate product SKU
function generateProductSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PROD-${timestamp}-${random}`
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Import consultants from Excel
async function importConsultants(filePath: string) {
  console.log('\n📥 Importando consultoras do Excel...')
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]
    
    console.log(`📊 Total de registros encontrados: ${data.length}`)
    
    let created = 0
    let updated = 0
    let errors = 0
    
    for (const row of data) {
      try {
        // Extract data from Excel row
        const name = row['Nome completo'] || row['Nome'] || ''
        const email = row['E-mail'] || row['Email'] || ''
        const phone = row['Telefone'] || row['Phone'] || ''
        const city = row['Cidade'] || row['City'] || ''
        const country = row['País'] || row['Country'] || 'Portugal'
        
        if (!name || !email) {
          console.log(`⚠️  Pulando registro sem nome ou email`)
          continue
        }
        
        // Check if consultant already exists
        const { data: existing } = await supabase
          .from('consultants')
          .select('id')
          .eq('email', email.toLowerCase())
          .single()
        
        const consultantData = {
          full_name: name,
          email: email.toLowerCase().trim(),
          phone: phone || '',
          whatsapp: phone || '',
          nif: '',
          address_street: '',
          address_number: '',
          address_city: city || '',
          address_state: '',
          address_postal_code: '',
          address_country: country === 'Portugal' ? 'PT' : country,
          code: generateConsultantCode(),
          status: 'active',
          commission_percentage: 10,
          commission_period_days: 45,
          monthly_target: 1000,
          bank_name: '',
          bank_iban: '',
          bank_account_holder: name,
          notes: `Importado do Excel em ${new Date().toLocaleDateString('pt-BR')}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('consultants')
            .update(consultantData)
            .eq('id', existing.id)
          
          if (error) throw error
          updated++
          console.log(`✅ Atualizada: ${name}`)
        } else {
          // Create new
          const { error } = await supabase
            .from('consultants')
            .insert(consultantData)
          
          if (error) throw error
          created++
          console.log(`✅ Criada: ${name}`)
        }
        
      } catch (error: any) {
        errors++
        console.error(`❌ Erro ao processar registro:`, error.message)
      }
    }
    
    console.log('\n📊 Resumo da importação de consultoras:')
    console.log(`✅ Criadas: ${created}`)
    console.log(`🔄 Atualizadas: ${updated}`)
    console.log(`❌ Erros: ${errors}`)
    
  } catch (error: any) {
    console.error('❌ Erro ao importar consultoras:', error.message)
  }
}

// Import products from Excel
async function importProducts(filePath: string) {
  console.log('\n📥 Importando produtos do Excel...')
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]
    
    console.log(`📊 Total de produtos encontrados: ${data.length}`)
    
    // First, create categories if needed
    const categoriesMap = new Map<string, string>()
    
    // Get unique categories
    const uniqueCategories = new Set<string>()
    for (const row of data) {
      const category = row['Categoria de produto'] || row['category'] || ''
      if (category) {
        uniqueCategories.add(category)
      }
    }
    
    // Create categories
    for (const categoryName of uniqueCategories) {
      const slug = generateSlug(categoryName)
      
      // Check if category exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (existing) {
        categoriesMap.set(categoryName, existing.id)
      } else {
        // Create new category
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            slug: slug,
            description: `Categoria: ${categoryName}`
          })
          .select('id')
          .single()
        
        if (!error && newCategory) {
          categoriesMap.set(categoryName, newCategory.id)
          console.log(`✅ Categoria criada: ${categoryName}`)
        }
      }
    }
    
    let created = 0
    let updated = 0
    let errors = 0
    
    for (const row of data) {
      try {
        // Extract data from Excel row
        const name = row['Nome'] || ''
        const price = parseFloat(row['Preços de venda'] || row['Preço de venda'] || '0')
        const cost = parseFloat(row['Custo'] || '0')
        const stockOnHand = parseInt(row['Quantidade em mãos'] || '0')
        const stockForecast = parseInt(row['Quantidade prevista'] || '0')
        const isFavorite = row['Favorito'] === true || row['Favorito'] === 'true'
        
        // Use name as SKU if it looks like a code (e.g., BRI0249, ANE0001)
        const sku = name.match(/^[A-Z]{3}\d{4}$/) ? name : generateProductSKU()
        const description = `Produto ${name}`
        
        if (!name) {
          console.log(`⚠️  Pulando produto sem nome`)
          continue
        }
        
        const slug = generateSlug(name)
        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('sku', sku)
          .single()
        
        const productData = {
          name: name,
          slug: slug,
          sku: sku,
          description: description,
          price: price || 0,
          sale_price: cost > 0 && cost < price ? cost : null,
          stock_quantity: stockForecast || stockOnHand || 0,
          category_id: null, // No categories in the Excel file
          status: (stockForecast > 0 || stockOnHand > 0) ? 'active' : 'out_of_stock',
          active: true,
          featured: isFavorite,
          metadata: {
            cost: cost,
            stock_on_hand: stockOnHand,
            stock_forecast: stockForecast,
            imported_from: 'Excel',
            import_date: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existing.id)
          
          if (error) throw error
          updated++
          console.log(`✅ Atualizado: ${name} (${sku})`)
        } else {
          // Create new
          const { error } = await supabase
            .from('products')
            .insert(productData)
          
          if (error) throw error
          created++
          console.log(`✅ Criado: ${name} (${sku})`)
        }
        
      } catch (error: any) {
        errors++
        console.error(`❌ Erro ao processar produto:`, error.message)
      }
    }
    
    console.log('\n📊 Resumo da importação de produtos:')
    console.log(`✅ Criados: ${created}`)
    console.log(`🔄 Atualizados: ${updated}`)
    console.log(`❌ Erros: ${errors}`)
    
  } catch (error: any) {
    console.error('❌ Erro ao importar produtos:', error.message)
  }
}

// Main function
async function main() {
  console.log('🚀 Iniciando importação de dados do Excel...')
  
  const consultantsFile = path.join(process.cwd(), 'odoo', 'Contato (res.partner).xlsx')
  const productsFile = path.join(process.cwd(), 'odoo', 'Produto (product.template).xlsx')
  
  // Check if files exist
  if (!fs.existsSync(consultantsFile)) {
    console.error('❌ Arquivo de consultoras não encontrado:', consultantsFile)
  } else {
    await importConsultants(consultantsFile)
  }
  
  if (!fs.existsSync(productsFile)) {
    console.error('❌ Arquivo de produtos não encontrado:', productsFile)
  } else {
    await importProducts(productsFile)
  }
  
  console.log('\n✅ Importação concluída!')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}