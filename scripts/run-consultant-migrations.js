const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Verificar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Executando migrations do sistema de consultoras...\n');

  try {
    // Primeiro, verificar se a tabela consultants existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'consultants');

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Tabela consultants já existe');
      
      // Adicionar apenas o campo commission_period_days
      console.log('\n📝 Adicionando campo commission_period_days...');
      
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE consultants 
          ADD COLUMN IF NOT EXISTS commission_period_days INTEGER DEFAULT 45;
          
          COMMENT ON COLUMN consultants.commission_period_days IS 'Período em dias para cálculo e pagamento de comissões (padrão: 45 dias)';
          
          UPDATE consultants 
          SET commission_period_days = 45 
          WHERE commission_period_days IS NULL;
        `
      });

      if (alterError) {
        console.error('❌ Erro ao adicionar campo:', alterError.message);
      } else {
        console.log('✅ Campo commission_period_days adicionado com sucesso');
      }
    } else {
      console.log('❌ Tabela consultants não existe');
      console.log('\n📝 Executando migration 003_consultants_system.sql...');
      console.log('⚠️  Por favor, execute a migration manualmente no Dashboard do Supabase:');
      console.log('1. Acesse: SQL Editor no Supabase Dashboard');
      console.log('2. Cole o conteúdo de: supabase/migrations/003_consultants_system.sql');
      console.log('3. Execute a query');
      console.log('4. Depois execute: supabase/migrations/008_consultant_commission_period.sql');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
runMigrations();