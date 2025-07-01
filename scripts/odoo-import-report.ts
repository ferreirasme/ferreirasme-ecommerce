#!/usr/bin/env tsx
/**
 * Script para gerar relatório detalhado antes da importação do Odoo
 * Analisa dados e identifica possíveis problemas antes da importação real
 * 
 * Uso:
 * npx tsx scripts/odoo-import-report.ts [products|consultants|all]
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
const xmlrpc = require('xmlrpc')

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const target = process.argv[2] || 'all'

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

const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ImportIssue {
  type: 'error' | 'warning' | 'info'
  entity: string
  field?: string
  message: string
  details?: any
}

interface ImportReport {
  timestamp: string
  target: string
  summary: {
    total: number
    existing: number
    new: number
    withIssues: number
  }
  issues: ImportIssue[]
  samples: any[]
}

async function authenticateOdoo() {
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
  
  const models = xmlrpc.createClient({ 
    url: `${config.odoo.url}/xmlrpc/2/object`,
    headers: {
      'User-Agent': 'NodeJS XML-RPC Client',
      'Content-Type': 'text/xml'
    }
  })
  
  return { uid, models }
}

async function analyzeProducts(): Promise<ImportReport> {
  console.log('\n📦 Analisando produtos para importação...\n')
  
  const report: ImportReport = {
    timestamp: new Date().toISOString(),
    target: 'products',
    summary: {
      total: 0,
      existing: 0,
      new: 0,
      withIssues: 0
    },
    issues: [],
    samples: []
  }
  
  try {
    const { uid, models } = await authenticateOdoo()
    
    // Fetch all products
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
          ]
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    report.summary.total = products.length
    
    // Get existing products from Supabase
    const { data: existingProducts } = await supabase
      .from('products')
      .select('odoo_id, name, sku')
    
    const existingOdooIds = new Set(existingProducts?.map(p => p.odoo_id) || [])
    
    // Analyze each product
    const productIssues = new Map<number, ImportIssue[]>()
    
    for (const product of products) {
      const issues: ImportIssue[] = []
      
      // Check if exists
      if (existingOdooIds.has(product.id)) {
        report.summary.existing++
      } else {
        report.summary.new++
      }
      
      // Validation checks
      if (!product.name || product.name.trim() === '') {
        issues.push({
          type: 'error',
          entity: `Product ${product.id}`,
          field: 'name',
          message: 'Nome do produto vazio'
        })
      }
      
      if (!product.default_code) {
        issues.push({
          type: 'warning',
          entity: `Product ${product.name}`,
          field: 'default_code',
          message: 'SKU não definido - será gerado automaticamente'
        })
      }
      
      if (product.list_price <= 0) {
        issues.push({
          type: 'error',
          entity: `Product ${product.name}`,
          field: 'list_price',
          message: `Preço inválido: €${product.list_price}`
        })
      }
      
      if (product.type === 'service') {
        issues.push({
          type: 'info',
          entity: `Product ${product.name}`,
          field: 'type',
          message: 'Produto do tipo serviço - será ignorado'
        })
      }
      
      if (!product.categ_id) {
        issues.push({
          type: 'warning',
          entity: `Product ${product.name}`,
          field: 'categ_id',
          message: 'Sem categoria definida'
        })
      }
      
      if (!product.image_1920) {
        issues.push({
          type: 'info',
          entity: `Product ${product.name}`,
          field: 'image_1920',
          message: 'Sem imagem'
        })
      }
      
      if (product.qty_available < 0) {
        issues.push({
          type: 'warning',
          entity: `Product ${product.name}`,
          field: 'qty_available',
          message: `Quantidade negativa: ${product.qty_available}`
        })
      }
      
      if (issues.length > 0) {
        productIssues.set(product.id, issues)
        report.issues.push(...issues)
      }
    }
    
    report.summary.withIssues = productIssues.size
    
    // Add sample products
    report.samples = products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.default_code,
      price: p.list_price,
      stock: p.qty_available,
      category: p.categ_id ? p.categ_id[1] : null,
      hasImage: !!p.image_1920,
      issues: productIssues.get(p.id)?.length || 0
    }))
    
  } catch (error: any) {
    report.issues.push({
      type: 'error',
      entity: 'System',
      message: `Erro ao analisar produtos: ${error.message}`
    })
  }
  
  return report
}

async function analyzeConsultants(): Promise<ImportReport> {
  console.log('\n👥 Analisando consultoras para importação...\n')
  
  const report: ImportReport = {
    timestamp: new Date().toISOString(),
    target: 'consultants',
    summary: {
      total: 0,
      existing: 0,
      new: 0,
      withIssues: 0
    },
    issues: [],
    samples: []
  }
  
  try {
    const { uid, models } = await authenticateOdoo()
    
    // Fetch all individual partners with email
    const partners = await new Promise<any[]>((resolve, reject) => {
      models.methodCall('execute_kw', [
        config.odoo.db, uid, config.odoo.apiKey,
        'res.partner', 'search_read',
        [[['is_company', '=', false]]],
        { 
          fields: [
            'id', 'name', 'email', 'phone', 'mobile', 'vat', 
            'street', 'city', 'zip', 'country_id', 'active',
            'category_id', 'ref', 'customer_rank'
          ]
        }
      ], (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    // Filter partners with email
    const partnersWithEmail = partners.filter(p => p.email)
    report.summary.total = partnersWithEmail.length
    
    // Get existing consultants from Supabase
    const { data: existingConsultants } = await supabase
      .from('consultants')
      .select('email, full_name, code')
    
    const existingEmails = new Set(existingConsultants?.map(c => c.email.toLowerCase()) || [])
    
    // Check for existing auth users
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    const existingAuthEmails = new Set(authUsers?.map(u => u.email?.toLowerCase()) || [])
    
    // Analyze each consultant
    const consultantIssues = new Map<number, ImportIssue[]>()
    
    for (const partner of partnersWithEmail) {
      const issues: ImportIssue[] = []
      const emailLower = partner.email.toLowerCase()
      
      // Check if exists
      if (existingEmails.has(emailLower)) {
        report.summary.existing++
      } else {
        report.summary.new++
        
        // Check if auth user exists but consultant record doesn't
        if (existingAuthEmails.has(emailLower)) {
          issues.push({
            type: 'warning',
            entity: `Partner ${partner.name}`,
            field: 'email',
            message: 'Usuário auth existe mas sem registro de consultora',
            details: { email: partner.email }
          })
        }
      }
      
      // Validation checks
      if (!partner.name || partner.name.trim() === '') {
        issues.push({
          type: 'error',
          entity: `Partner ${partner.id}`,
          field: 'name',
          message: 'Nome vazio'
        })
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(partner.email)) {
        issues.push({
          type: 'error',
          entity: `Partner ${partner.name}`,
          field: 'email',
          message: `Email inválido: ${partner.email}`
        })
      }
      
      // Check for duplicate emails in Odoo
      const duplicates = partnersWithEmail.filter(p => 
        p.email.toLowerCase() === emailLower && p.id !== partner.id
      )
      if (duplicates.length > 0) {
        issues.push({
          type: 'error',
          entity: `Partner ${partner.name}`,
          field: 'email',
          message: `Email duplicado no Odoo`,
          details: {
            duplicateIds: duplicates.map(d => ({ id: d.id, name: d.name }))
          }
        })
      }
      
      if (!partner.phone && !partner.mobile) {
        issues.push({
          type: 'warning',
          entity: `Partner ${partner.name}`,
          field: 'phone',
          message: 'Sem telefone cadastrado'
        })
      }
      
      if (!partner.active) {
        issues.push({
          type: 'info',
          entity: `Partner ${partner.name}`,
          field: 'active',
          message: 'Parceiro inativo no Odoo'
        })
      }
      
      if (partner.customer_rank === 0) {
        issues.push({
          type: 'info',
          entity: `Partner ${partner.name}`,
          field: 'customer_rank',
          message: 'Não marcado como cliente no Odoo'
        })
      }
      
      if (issues.length > 0) {
        consultantIssues.set(partner.id, issues)
        report.issues.push(...issues)
      }
    }
    
    report.summary.withIssues = consultantIssues.size
    
    // Add sample consultants
    report.samples = partnersWithEmail.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone || p.mobile,
      city: p.city,
      active: p.active,
      tags: p.category_id?.length || 0,
      issues: consultantIssues.get(p.id)?.length || 0
    }))
    
    // Add summary of partners without email
    const partnersWithoutEmail = partners.filter(p => !p.email)
    if (partnersWithoutEmail.length > 0) {
      report.issues.push({
        type: 'info',
        entity: 'Summary',
        message: `${partnersWithoutEmail.length} parceiros sem email serão ignorados`,
        details: {
          count: partnersWithoutEmail.length,
          samples: partnersWithoutEmail.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone || p.mobile
          }))
        }
      })
    }
    
  } catch (error: any) {
    report.issues.push({
      type: 'error',
      entity: 'System',
      message: `Erro ao analisar consultoras: ${error.message}`
    })
  }
  
  return report
}

function printReport(report: ImportReport) {
  console.log('\n' + '='.repeat(60))
  console.log(`RELATÓRIO DE IMPORTAÇÃO - ${report.target.toUpperCase()}`)
  console.log('='.repeat(60))
  console.log(`Gerado em: ${new Date(report.timestamp).toLocaleString('pt-BR')}`)
  
  console.log('\n📊 RESUMO:')
  console.log(`  Total de registros: ${report.summary.total}`)
  console.log(`  Já existentes: ${report.summary.existing}`)
  console.log(`  Novos: ${report.summary.new}`)
  console.log(`  Com problemas: ${report.summary.withIssues}`)
  
  // Group issues by type
  const errorCount = report.issues.filter(i => i.type === 'error').length
  const warningCount = report.issues.filter(i => i.type === 'warning').length
  const infoCount = report.issues.filter(i => i.type === 'info').length
  
  console.log('\n🔍 PROBLEMAS ENCONTRADOS:')
  console.log(`  ❌ Erros: ${errorCount}`)
  console.log(`  ⚠️  Avisos: ${warningCount}`)
  console.log(`  ℹ️  Informações: ${infoCount}`)
  
  if (report.issues.length > 0) {
    console.log('\n📋 DETALHES DOS PROBLEMAS:')
    
    // Show errors first
    const errors = report.issues.filter(i => i.type === 'error')
    if (errors.length > 0) {
      console.log('\n❌ ERROS (impedem importação):')
      errors.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.entity}: ${issue.message}`)
        if (issue.details && process.argv.includes('--verbose')) {
          console.log(`    Detalhes: ${JSON.stringify(issue.details)}`)
        }
      })
      if (errors.length > 10) {
        console.log(`  ... e mais ${errors.length - 10} erros`)
      }
    }
    
    // Show warnings
    const warnings = report.issues.filter(i => i.type === 'warning')
    if (warnings.length > 0) {
      console.log('\n⚠️  AVISOS (podem ser importados mas requerem atenção):')
      warnings.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.entity}: ${issue.message}`)
      })
      if (warnings.length > 10) {
        console.log(`  ... e mais ${warnings.length - 10} avisos`)
      }
    }
  }
  
  if (report.samples.length > 0) {
    console.log('\n📌 AMOSTRA DE DADOS:')
    report.samples.forEach((sample, index) => {
      console.log(`\n  ${index + 1}. ${sample.name}`)
      Object.entries(sample).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'id') {
          console.log(`     ${key}: ${value}`)
        }
      })
    })
  }
  
  console.log('\n' + '='.repeat(60))
}

async function saveReport(report: ImportReport) {
  const filename = `odoo-import-report-${report.target}-${Date.now()}.json`
  const filepath = resolve(process.cwd(), 'reports', filename)
  
  // Create reports directory if it doesn't exist
  const reportsDir = resolve(process.cwd(), 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
  console.log(`\n💾 Relatório salvo em: reports/${filename}`)
}

async function main() {
  console.log('🚀 Gerando relatório de importação Odoo\n')
  
  try {
    let reports: ImportReport[] = []
    
    if (target === 'products' || target === 'all') {
      const productReport = await analyzeProducts()
      reports.push(productReport)
      printReport(productReport)
    }
    
    if (target === 'consultants' || target === 'all') {
      const consultantReport = await analyzeConsultants()
      reports.push(consultantReport)
      printReport(consultantReport)
    }
    
    if (reports.length === 0) {
      console.log('❌ Alvo inválido. Use: products, consultants ou all')
      process.exit(1)
    }
    
    // Save reports
    for (const report of reports) {
      await saveReport(report)
    }
    
    // Summary
    const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0)
    const totalErrors = reports.reduce((sum, r) => 
      sum + r.issues.filter(i => i.type === 'error').length, 0
    )
    
    console.log('\n✅ Análise concluída!')
    console.log(`Total de problemas encontrados: ${totalIssues}`)
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} erros críticos devem ser resolvidos antes da importação`)
    } else {
      console.log('✅ Nenhum erro crítico encontrado - importação pode prosseguir')
    }
    
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

main()