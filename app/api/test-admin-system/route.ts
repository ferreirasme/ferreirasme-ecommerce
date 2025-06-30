import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente admin com service role key para bypass de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  const report = {
    timestamp: new Date().toISOString(),
    tables: {
      admins: { exists: false, count: 0, data: [] as any[] },
      admin_permissions: { exists: false, count: 0, data: [] as any[] },
      admin_logs: { exists: false, count: 0, data: [] as any[] }
    },
    adminUser: {
      exists: false,
      data: null as any
    },
    permissions: {
      assigned: false,
      data: [] as any[]
    },
    policies: {
      admins: [] as string[],
      admin_permissions: [] as string[],
      admin_logs: [] as string[]
    },
    errors: [] as string[]
  }

  try {
    // 1. Verificar se as tabelas existem e contar registros
    console.log('Verificando tabelas...')
    
    // Tabela admins
    try {
      const { data: admins, error: adminsError } = await supabaseAdmin
        .from('admins')
        .select('*')
      
      if (!adminsError) {
        report.tables.admins.exists = true
        report.tables.admins.count = admins?.length || 0
        report.tables.admins.data = admins || []
      } else {
        report.errors.push(`Erro ao acessar tabela admins: ${adminsError.message}`)
      }
    } catch (e) {
      report.errors.push(`Exceção ao verificar tabela admins: ${e}`)
    }

    // Tabela admin_permissions
    try {
      const { data: permissions, error: permissionsError } = await supabaseAdmin
        .from('admin_permissions')
        .select('*')
      
      if (!permissionsError) {
        report.tables.admin_permissions.exists = true
        report.tables.admin_permissions.count = permissions?.length || 0
        report.tables.admin_permissions.data = permissions || []
      } else {
        report.errors.push(`Erro ao acessar tabela admin_permissions: ${permissionsError.message}`)
      }
    } catch (e) {
      report.errors.push(`Exceção ao verificar tabela admin_permissions: ${e}`)
    }

    // Tabela admin_logs
    try {
      const { data: logs, error: logsError } = await supabaseAdmin
        .from('admin_logs')
        .select('*')
      
      if (!logsError) {
        report.tables.admin_logs.exists = true
        report.tables.admin_logs.count = logs?.length || 0
        report.tables.admin_logs.data = logs || []
      } else {
        report.errors.push(`Erro ao acessar tabela admin_logs: ${logsError.message}`)
      }
    } catch (e) {
      report.errors.push(`Exceção ao verificar tabela admin_logs: ${e}`)
    }

    // 2. Verificar se o administrador existe
    console.log('Verificando administrador...')
    if (report.tables.admins.exists) {
      const adminUser = report.tables.admins.data.find(
        admin => admin.email === 'johnny.helder@outlook.com'
      )
      
      if (adminUser) {
        report.adminUser.exists = true
        report.adminUser.data = adminUser
        
        // 3. Verificar permissões do admin
        if (report.tables.admin_permissions.exists) {
          const adminPermissions = report.tables.admin_permissions.data.filter(
            perm => perm.admin_id === adminUser.id
          )
          
          if (adminPermissions.length > 0) {
            report.permissions.assigned = true
            report.permissions.data = adminPermissions
          }
        }
      }
    }

    // 4. Verificar políticas RLS (via SQL query)
    console.log('Verificando políticas RLS...')
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('get_policies_for_tables', {
          table_names: ['admins', 'admin_permissions', 'admin_logs']
        })
      
      if (!policiesError && policies) {
        policies.forEach((policy: any) => {
          if (policy.tablename === 'admins') {
            report.policies.admins.push(policy.policyname)
          } else if (policy.tablename === 'admin_permissions') {
            report.policies.admin_permissions.push(policy.policyname)
          } else if (policy.tablename === 'admin_logs') {
            report.policies.admin_logs.push(policy.policyname)
          }
        })
      }
    } catch (e) {
      // Se a função RPC não existir, tentamos uma abordagem alternativa
      console.log('Função RPC não encontrada, usando abordagem alternativa')
      
      // Testar políticas fazendo queries como um usuário não autenticado
      const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Tentar acessar cada tabela sem autenticação
      const { error: adminsAnonError } = await supabaseAnon
        .from('admins')
        .select('id')
        .limit(1)
      
      const { error: permsAnonError } = await supabaseAnon
        .from('admin_permissions')
        .select('id')
        .limit(1)
      
      const { error: logsAnonError } = await supabaseAnon
        .from('admin_logs')
        .select('id')
        .limit(1)
      
      // Se houver erro de permissão, as políticas estão funcionando
      if (adminsAnonError?.code === 'PGRST301') {
        report.policies.admins.push('RLS ativo - acesso anônimo bloqueado')
      }
      if (permsAnonError?.code === 'PGRST301') {
        report.policies.admin_permissions.push('RLS ativo - acesso anônimo bloqueado')
      }
      if (logsAnonError?.code === 'PGRST301') {
        report.policies.admin_logs.push('RLS ativo - acesso anônimo bloqueado')
      }
    }

    // 5. Criar um resumo do status
    const summary = {
      status: 'success',
      checks: {
        tables_created: report.tables.admins.exists && 
                       report.tables.admin_permissions.exists && 
                       report.tables.admin_logs.exists,
        admin_created: report.adminUser.exists,
        permissions_assigned: report.permissions.assigned,
        rls_active: report.policies.admins.length > 0 || 
                   report.policies.admin_permissions.length > 0 || 
                   report.policies.admin_logs.length > 0,
        has_errors: report.errors.length > 0
      },
      message: generateSummaryMessage(report)
    }

    return NextResponse.json({
      summary,
      details: report
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Erro geral:', error)
    report.errors.push(`Erro geral: ${error}`)
    
    return NextResponse.json({
      summary: {
        status: 'error',
        message: 'Erro ao executar verificações',
        error: error instanceof Error ? error.message : String(error)
      },
      details: report
    }, { status: 500 })
  }
}

function generateSummaryMessage(report: any): string {
  const messages = []
  
  if (!report.tables.admins.exists) {
    messages.push('❌ Tabela "admins" não encontrada')
  } else {
    messages.push(`✅ Tabela "admins" existe (${report.tables.admins.count} registros)`)
  }
  
  if (!report.tables.admin_permissions.exists) {
    messages.push('❌ Tabela "admin_permissions" não encontrada')
  } else {
    messages.push(`✅ Tabela "admin_permissions" existe (${report.tables.admin_permissions.count} registros)`)
  }
  
  if (!report.tables.admin_logs.exists) {
    messages.push('❌ Tabela "admin_logs" não encontrada')
  } else {
    messages.push(`✅ Tabela "admin_logs" existe (${report.tables.admin_logs.count} registros)`)
  }
  
  if (!report.adminUser.exists) {
    messages.push('❌ Administrador principal não encontrado')
  } else {
    messages.push(`✅ Administrador principal existe (${report.adminUser.data.name})`)
  }
  
  if (!report.permissions.assigned) {
    messages.push('❌ Permissões não atribuídas ao administrador')
  } else {
    messages.push(`✅ ${report.permissions.data.length} permissões atribuídas`)
  }
  
  const totalPolicies = report.policies.admins.length + 
                       report.policies.admin_permissions.length + 
                       report.policies.admin_logs.length
  
  if (totalPolicies === 0) {
    messages.push('⚠️  Nenhuma política RLS detectada')
  } else {
    messages.push(`✅ ${totalPolicies} políticas RLS detectadas`)
  }
  
  if (report.errors.length > 0) {
    messages.push(`⚠️  ${report.errors.length} erros encontrados`)
  }
  
  return messages.join('\n')
}