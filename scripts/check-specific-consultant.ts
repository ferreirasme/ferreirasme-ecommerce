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

async function checkSpecificConsultant() {
  const targetEmail = 'consultora@ferreirasme.com'
  console.log(`🔍 Verificando situação de: ${targetEmail}\n`)

  try {
    // 1. Verificar na tabela consultants
    console.log('1. Verificando na tabela consultants...')
    const { data: consultant, error: consultantError } = await supabaseAdmin
      .from('consultants')
      .select('*')
      .eq('email', targetEmail)
      .single()

    if (consultant) {
      console.log('✅ Consultora ENCONTRADA na tabela consultants:')
      console.log(`   ID: ${consultant.id}`)
      console.log(`   Nome: ${consultant.full_name}`)
      console.log(`   Código: ${consultant.code}`)
      console.log(`   User ID: ${consultant.user_id}`)
      console.log(`   Status: ${consultant.status}`)
      console.log(`   Criado em: ${consultant.created_at}`)
    } else {
      console.log('❌ Consultora NÃO encontrada na tabela consultants')
      if (consultantError) {
        console.log(`   Erro: ${consultantError.message}`)
      }
    }

    // 2. Verificar no Auth
    console.log('\n2. Verificando no sistema Auth...')
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    const authUser = users?.find(u => u.email === targetEmail)
    
    if (authUser) {
      console.log('✅ Usuário ENCONTRADO no Auth:')
      console.log(`   ID: ${authUser.id}`)
      console.log(`   Email: ${authUser.email}`)
      console.log(`   Criado em: ${authUser.created_at}`)
      console.log(`   Email confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`)
      console.log(`   Metadata: ${JSON.stringify(authUser.user_metadata)}`)
    } else {
      console.log('❌ Usuário NÃO encontrado no Auth')
    }

    // 3. Análise da situação
    console.log('\n3. ANÁLISE DA SITUAÇÃO:')
    if (authUser && !consultant) {
      console.log('⚠️  PROBLEMA DETECTADO:')
      console.log('   - Usuário existe no Auth mas NÃO na tabela consultants')
      console.log('   - Isso explica por que a consultora não aparece na lista')
      console.log('   - A correção implementada deve resolver isso')
      console.log(`   - User ID para criar consultora: ${authUser.id}`)
    } else if (!authUser && consultant) {
      console.log('⚠️  SITUAÇÃO INCOMUM:')
      console.log('   - Consultora existe na tabela mas NÃO no Auth')
      console.log('   - Pode ser um problema de sincronização')
    } else if (authUser && consultant) {
      console.log('✅ TUDO OK:')
      console.log('   - Usuário existe em ambos os lugares')
      console.log('   - A consultora deveria aparecer na lista')
    } else {
      console.log('ℹ️  NENHUM REGISTRO:')
      console.log('   - Email não existe em nenhum lugar')
      console.log('   - Pode ser criado normalmente')
    }

  } catch (error) {
    console.error('Erro inesperado:', error)
  }
}

// Run the check
checkSpecificConsultant()