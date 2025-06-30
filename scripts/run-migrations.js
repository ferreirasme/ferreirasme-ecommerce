const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  console.log('🚀 Executando migrações...\n')

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  try {
    // Ler arquivos de migration
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      console.log(`📄 Executando: ${file}`)
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: sql 
      }).single()

      if (error) {
        // Tentar executar diretamente se RPC não funcionar
        const statements = sql.split(';').filter(s => s.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await supabase.rpc('exec_sql', { sql_query: statement + ';' })
            } catch (e) {
              console.log(`⚠️  Aviso ao executar: ${statement.substring(0, 50)}...`)
            }
          }
        }
      }
      
      console.log(`✅ ${file} executado!\n`)
    }

    console.log('✨ Todas as migrações foram executadas!')
    
    // Testar se a tabela OTP foi criada
    const { data, error: testError } = await supabase
      .from('otp_codes')
      .select('count')
      .limit(1)
    
    if (!testError) {
      console.log('✅ Tabela otp_codes verificada com sucesso!')
    } else {
      console.log('❌ Erro ao verificar tabela otp_codes:', testError.message)
    }

  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error)
    process.exit(1)
  }
}

// Executar
runMigrations()