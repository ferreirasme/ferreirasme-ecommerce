import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAdminsStructure() {
  console.log('🔍 Verificando estrutura da tabela admins...\n')

  try {
    // 1. Get column information
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'admins' })

    if (columnsError) {
      // Try alternative method
      const { data: sampleAdmin } = await supabaseAdmin
        .from('admins')
        .select('*')
        .limit(1)
        .single()

      if (sampleAdmin) {
        console.log('Colunas da tabela admins:')
        Object.keys(sampleAdmin).forEach(col => {
          console.log(`  - ${col}`)
        })
        console.log('\nExemplo de registro:')
        console.log(JSON.stringify(sampleAdmin, null, 2))
      }
    } else if (columns) {
      console.log('Colunas da tabela admins:')
      columns.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type})`)
      })
    }

    // 2. Check if table exists and has data
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('*')

    if (adminsError) {
      console.log('\nErro ao buscar admins:', adminsError.message)
    } else {
      console.log(`\nTotal de admins: ${admins?.length || 0}`)
      if (admins && admins.length > 0) {
        console.log('\nPrimeiro admin:')
        console.log(JSON.stringify(admins[0], null, 2))
      }
    }

  } catch (error) {
    console.error('Erro:', error)
  }
}

// Run the check
checkAdminsStructure()