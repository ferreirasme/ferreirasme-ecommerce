import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const API_URL = 'https://ferreirasme-ecommerce.vercel.app'

// Helper to make API calls
async function apiCall(endpoint: string, method: string = 'GET', body?: any) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`)
  }
  
  return data
}

// Import consultants using the API
async function importConsultantsViaAPI() {
  console.log('\n📥 Importando consultoras via API...')
  
  const filePath = path.join(process.cwd(), 'odoo', 'Contato (res.partner).xlsx')
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]
    
    console.log(`📊 Total de registros encontrados: ${data.length}`)
    
    let created = 0
    let errors = 0
    const errorDetails: any[] = []
    
    for (const row of data) {
      try {
        // Extract data from Excel row
        const name = row['Nome completo'] || ''
        const email = row['E-mail'] || ''
        const phone = row['Telefone'] || ''
        const city = row['Cidade'] || ''
        const country = row['País'] || 'Portugal'
        
        if (!name || !email) {
          console.log(`⚠️  Pulando registro sem nome ou email`)
          continue
        }
        
        // Prepare consultant data for API
        const consultantData = {
          fullName: name,
          email: email.toLowerCase().trim(),
          phone: phone,
          whatsapp: phone,
          address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: city,
            state: '',
            postalCode: '',
            country: country === 'Portugal' ? 'PT' : country
          },
          bank: {
            name: '',
            iban: '',
            accountHolder: name
          },
          commission: {
            percentage: 10,
            monthlyTarget: 1000,
            periodDays: 45
          },
          notes: `Importado do Excel em ${new Date().toLocaleDateString('pt-BR')}`
        }
        
        // Call API to create consultant
        const result = await apiCall('/api/consultants-simple', 'POST', consultantData)
        
        created++
        console.log(`✅ Criada: ${name} - ${result.consultant.code}`)
        
      } catch (error: any) {
        errors++
        const errorMsg = error.message || 'Erro desconhecido'
        errorDetails.push({ name: row['Nome completo'], error: errorMsg })
        console.error(`❌ Erro ao processar: ${errorMsg}`)
      }
    }
    
    console.log('\n📊 Resumo da importação de consultoras:')
    console.log(`✅ Criadas: ${created}`)
    console.log(`❌ Erros: ${errors}`)
    
    if (errorDetails.length > 0) {
      console.log('\n❌ Detalhes dos erros:')
      errorDetails.slice(0, 10).forEach(e => {
        console.log(`  - ${e.name}: ${e.error}`)
      })
      if (errorDetails.length > 10) {
        console.log(`  ... e mais ${errorDetails.length - 10} erros`)
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao importar consultoras:', error.message)
  }
}

// Import products (simplified for now)
async function importProductsSimple() {
  console.log('\n📥 Processando produtos do Excel...')
  
  const filePath = path.join(process.cwd(), 'odoo', 'Produto (product.template).xlsx')
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]
    
    console.log(`📊 Total de produtos encontrados: ${data.length}`)
    
    // Save to JSON for later processing
    const productsData = data.map((row: any) => ({
      name: row['Nome'] || '',
      price: parseFloat(row['Preços de venda'] || '0'),
      cost: parseFloat(row['Custo'] || '0'),
      stockOnHand: parseInt(row['Quantidade em mãos'] || '0'),
      stockForecast: parseInt(row['Quantidade prevista'] || '0'),
      isFavorite: row['Favorito'] === true || row['Favorito'] === 'true',
      sku: row['Nome'] || '',
      stock: parseInt(row['Quantidade prevista'] || row['Quantidade em mãos'] || '0')
    }))
    
    const outputPath = path.join(process.cwd(), 'odoo', 'products-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(productsData, null, 2))
    
    console.log(`✅ Dados dos produtos salvos em: ${outputPath}`)
    console.log(`📊 Total de produtos processados: ${productsData.length}`)
    console.log('\n⚠️  Os produtos precisam ser importados manualmente via interface admin')
    console.log('   ou através da integração com a API da Odoo.')
    
  } catch (error: any) {
    console.error('❌ Erro ao processar produtos:', error.message)
  }
}

// Main function
async function main() {
  console.log('🚀 Iniciando importação de dados do Excel via API...')
  console.log(`📍 API URL: ${API_URL}`)
  
  // Import consultants
  await importConsultantsViaAPI()
  
  // Process products
  await importProductsSimple()
  
  console.log('\n✅ Processamento concluído!')
}

// Run
main().catch(console.error)