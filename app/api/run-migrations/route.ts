import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Verificar se tem a senha correta (segurança básica)
    const { password } = await request.json();
    
    if (password !== process.env.MIGRATION_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Lista de migrations para executar
    const migrations = [
      {
        name: '003_consultants_system',
        file: '/supabase/migrations/003_consultants_system.sql'
      },
      {
        name: '008_consultant_commission_period',
        file: '/supabase/migrations/008_consultant_commission_period.sql'
      }
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        // Ler o arquivo SQL
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(
          path.join(process.cwd(), migration.file),
          'utf8'
        );

        // Executar a migration
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          results.push({
            migration: migration.name,
            status: 'error',
            error: error.message
          });
        } else {
          results.push({
            migration: migration.name,
            status: 'success'
          });
        }
      } catch (err: any) {
        results.push({
          migration: migration.name,
          status: 'error',
          error: err.message
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run migrations' },
      { status: 500 }
    );
  }
}