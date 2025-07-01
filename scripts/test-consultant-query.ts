import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testConsultantQuery() {
  console.log('🔍 Testando queries na tabela consultants...\n')

  // 1. Teste com Service Role (sem RLS)
  console.log('1. Query com Service Role Key (ignora RLS):')
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: adminData, error: adminError } = await adminClient
    .from('consultants')
    .select('*')
    .order('created_at', { ascending: false })

  if (adminError) {
    console.log('❌ Erro:', adminError.message)
  } else {
    console.log(`✅ Consultoras encontradas: ${adminData?.length || 0}`)
    adminData?.forEach(c => {
      console.log(`   - ${c.full_name} (${c.code}) - ${c.email}`)
    })
  }

  // 2. Teste com Anon Key (respeita RLS)
  console.log('\n2. Query com Anon Key (respeita RLS):')
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)

  const { data: anonData, error: anonError } = await anonClient
    .from('consultants')
    .select('*')
    .order('created_at', { ascending: false })

  if (anonError) {
    console.log('❌ Erro:', anonError.message)
  } else {
    console.log(`✅ Consultoras encontradas: ${anonData?.length || 0}`)
    anonData?.forEach(c => {
      console.log(`   - ${c.full_name} (${c.code}) - ${c.email}`)
    })
  }

  // 3. Verificar se RLS está habilitado
  console.log('\n3. Verificando RLS na tabela consultants:')
  const { data: rlsData, error: rlsError } = await adminClient
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .eq('tablename', 'consultants')
    .single()

  if (rlsData) {
    console.log(`RLS habilitado: ${rlsData.rowsecurity ? 'SIM' : 'NÃO'}`)
  }

  // 4. Listar políticas RLS
  console.log('\n4. Políticas RLS da tabela consultants:')
  const { data: policies } = await adminClient
    .rpc('pg_policies')
    .then(res => ({
      data: res.data?.filter((p: any) => p.tablename === 'consultants')
    }))

  if (policies && policies.length > 0) {
    policies.forEach((p: any) => {
      console.log(`   - ${p.policyname} (${p.cmd})`)
    })
  } else {
    console.log('   Nenhuma política RLS encontrada')
  }
}

// Run the test
testConsultantQuery()