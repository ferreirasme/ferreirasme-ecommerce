import * as XLSX from 'xlsx'
import * as path from 'path'

// Preview consultants data
function previewConsultants(filePath: string) {
  console.log('\n📋 PRÉVIA DOS DADOS DE CONSULTORAS')
  console.log('=' .repeat(50))
  
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    console.log(`Total de registros: ${data.length}`)
    console.log('\nColunas encontradas:')
    if (data.length > 0) {
      console.log(Object.keys(data[0]))
    }
    
    console.log('\nPrimeiros 5 registros:')
    data.slice(0, 5).forEach((row: any, index: number) => {
      console.log(`\n--- Registro ${index + 1} ---`)
      Object.entries(row).forEach(([key, value]) => {
        if (value) {
          console.log(`${key}: ${value}`)
        }
      })
    })
  } catch (error: any) {
    console.error('Erro ao ler arquivo:', error.message)
  }
}

// Preview products data
function previewProducts(filePath: string) {
  console.log('\n📋 PRÉVIA DOS DADOS DE PRODUTOS')
  console.log('=' .repeat(50))
  
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    console.log(`Total de produtos: ${data.length}`)
    console.log('\nColunas encontradas:')
    if (data.length > 0) {
      console.log(Object.keys(data[0]))
    }
    
    console.log('\nPrimeiros 5 produtos:')
    data.slice(0, 5).forEach((row: any, index: number) => {
      console.log(`\n--- Produto ${index + 1} ---`)
      Object.entries(row).forEach(([key, value]) => {
        if (value) {
          console.log(`${key}: ${value}`)
        }
      })
    })
    
    // Count categories
    const categories = new Set<string>()
    data.forEach((row: any) => {
      const category = row['Categoria de produto'] || row['category'] || ''
      if (category) {
        categories.add(category)
      }
    })
    
    console.log(`\n📁 Categorias únicas encontradas: ${categories.size}`)
    console.log(Array.from(categories).join(', '))
    
  } catch (error: any) {
    console.error('Erro ao ler arquivo:', error.message)
  }
}

// Main function
async function main() {
  const consultantsFile = path.join(process.cwd(), 'odoo', 'Contato (res.partner).xlsx')
  const productsFile = path.join(process.cwd(), 'odoo', 'Produto (product.template).xlsx')
  
  previewConsultants(consultantsFile)
  previewProducts(productsFile)
}

// Run
main().catch(console.error)