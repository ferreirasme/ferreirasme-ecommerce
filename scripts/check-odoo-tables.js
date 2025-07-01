const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuração do Supabase não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOdooTables() {
  console.log('🔍 Verificando tabelas de integração Odoo...\n');

  const tables = ['products_sync', 'sync_logs', 'category_mappings'];
  
  for (const tableName of tables) {
    console.log(`📋 Tabela: ${tableName}`);
    console.log('=' .repeat(50));
    
    try {
      // Buscar informações da estrutura da tabela
      const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: tableName });
      
      if (error && error.code === 'PGRST202') {
        // Se a função não existe, vamos criar uma consulta direta
        const { data, error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (queryError) {
          console.log(`❌ Erro ao verificar tabela: ${queryError.message}`);
          continue;
        }
        
        // A tabela existe, mas não conseguimos ver suas colunas
        console.log('✅ Tabela existe!');
        
        // Vamos tentar fazer uma consulta para ver a estrutura
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sampleData && sampleData.length > 0) {
          console.log('\nColunas detectadas:');
          Object.keys(sampleData[0]).forEach(col => {
            console.log(`  - ${col}`);
          });
        } else {
          console.log('  (Não foi possível listar as colunas - tabela vazia)');
        }
      } else if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else if (columns) {
        console.log('✅ Tabela existe!');
        console.log('\nColunas:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
      
      // Contar registros
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`\n📊 Total de registros: ${count || 0}`);
      }
      
    } catch (err) {
      console.log(`❌ Erro ao verificar tabela ${tableName}: ${err.message}`);
    }
    
    console.log('\n');
  }
  
  // Verificar últimas sincronizações
  console.log('📅 Últimas sincronizações:');
  console.log('=' .repeat(50));
  
  try {
    const { data: logs, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log(`❌ Erro ao buscar logs: ${error.message}`);
    } else if (logs && logs.length > 0) {
      logs.forEach(log => {
        console.log(`\n- Tipo: ${log.sync_type}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  Registros sincronizados: ${log.records_synced}`);
        console.log(`  Registros falhados: ${log.records_failed}`);
        console.log(`  Data: ${new Date(log.created_at).toLocaleString('pt-BR')}`);
        if (log.error_message) {
          console.log(`  Erro: ${log.error_message}`);
        }
      });
    } else {
      console.log('Nenhuma sincronização encontrada ainda.');
    }
  } catch (err) {
    console.log(`❌ Erro ao verificar logs: ${err.message}`);
  }
}

// Criar função RPC para obter colunas (se não existir)
async function createColumnFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
    RETURNS TABLE(column_name text, data_type text, is_nullable text)
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        column_name::text, 
        data_type::text, 
        is_nullable::text
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY ordinal_position;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('query', { query: functionSQL });
    if (!error) {
      console.log('✅ Função auxiliar criada com sucesso\n');
    }
  } catch (err) {
    // Ignorar erro se a função já existe
  }
}

// Executar verificação
(async () => {
  await createColumnFunction();
  await checkOdooTables();
})();