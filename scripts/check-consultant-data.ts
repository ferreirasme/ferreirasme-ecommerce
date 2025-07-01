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

async function checkConsultantData() {
  console.log('🔍 Verificando dados de consultoras...\n')

  try {
    // 1. Buscar todas as consultoras
    const { data: consultants, error: consultantsError } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .order('created_at', { ascending: false })

    if (consultantsError) {
      console.error('Erro ao buscar consultoras:', consultantsError)
      return
    }

    console.log(`Total de consultoras: ${consultants?.length || 0}`)
    
    if (consultants && consultants.length > 0) {
      console.log('\nConsultoras cadastradas:')
      consultants.forEach(consultant => {
        console.log(`\n- Nome: ${consultant.full_name}`)
        console.log(`  Código: ${consultant.code}`)
        console.log(`  Email: ${consultant.email}`)
        console.log(`  ID: ${consultant.id}`)
        console.log(`  User ID: ${consultant.user_id}`)
        console.log(`  Status: ${consultant.status}`)
        console.log(`  Criado em: ${consultant.created_at}`)
      })
    }

    // 2. Buscar usuários Auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return
    }

    console.log(`\n\nTotal de usuários Auth: ${users?.length || 0}`)

    // 3. Verificar consultoras sem usuário Auth correspondente
    if (consultants && consultants.length > 0) {
      console.log('\n🔍 Verificando correspondência entre consultoras e usuários Auth:')
      
      consultants.forEach(consultant => {
        const hasAuthUser = users?.some(user => 
          user.id === consultant.user_id || user.email === consultant.email
        )
        
        if (!hasAuthUser) {
          console.log(`\n⚠️  Consultora SEM usuário Auth:`)
          console.log(`   Nome: ${consultant.full_name}`)
          console.log(`   Email: ${consultant.email}`)
          console.log(`   User ID: ${consultant.user_id}`)
        }
      })
    }

    // 4. Buscar especificamente a consultora de teste
    const testEmail = 'tamaraleal@gmail.com'
    console.log(`\n\n🔍 Buscando consultora específica: ${testEmail}`)
    
    const { data: specificConsultant } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (specificConsultant) {
      console.log('\n✅ Consultora encontrada na tabela consultants:')
      console.log(JSON.stringify(specificConsultant, null, 2))
    } else {
      console.log('\n❌ Consultora NÃO encontrada na tabela consultants')
    }

    // 5. Verificar RLS policies
    console.log('\n\n🔍 Verificando RLS policies da tabela consultants:')
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'consultants')
    
    if (policies && policies.length > 0) {
      console.log(`\nPolíticas RLS encontradas: ${policies.length}`)
      policies.forEach(policy => {
        console.log(`\n- Nome: ${policy.policyname}`)
        console.log(`  Comando: ${policy.cmd}`)
        console.log(`  Permissivo: ${policy.permissive}`)
      })
    } else {
      console.log('\n⚠️  Nenhuma política RLS encontrada para a tabela consultants')
    }

  } catch (error) {
    console.error('Erro inesperado:', error)
  }
}

// Run the check
checkConsultantData()