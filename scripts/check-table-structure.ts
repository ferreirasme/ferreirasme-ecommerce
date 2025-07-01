import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkTableStructure(tableName: string) {
  console.log(`\n=== Checking structure for table: ${tableName} ===\n`)
  
  try {
    // First, check if table exists
    const { error: tableError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(0)
    
    if (tableError) {
      console.log(`❌ Table "${tableName}" does not exist`)
      console.log(`   Error: ${tableError.message}`)
      return
    }
    
    console.log(`✅ Table "${tableName}" exists`)
    
    // Create function to get column information
    const { error: fnError } = await supabaseAdmin.rpc('query', {
      query: `
        CREATE OR REPLACE FUNCTION get_table_columns_info(p_table_name text)
        RETURNS TABLE(
          column_name text,
          data_type text,
          is_nullable text,
          column_default text
        )
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT 
            column_name::text,
            data_type::text,
            is_nullable::text,
            column_default::text
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = p_table_name
          ORDER BY ordinal_position;
        $$;
      `
    })
    
    // Get column information
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns_info', { p_table_name: tableName })
    
    if (columnsError) {
      console.log('Error getting columns:', columnsError.message)
      
      // Alternative: try raw query
      const { data: rawColumns, error: rawError } = await supabaseAdmin.rpc('query', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      })
      
      if (rawError) {
        console.log('Could not get column information')
      } else {
        console.log('\nColumns found:')
        rawColumns?.forEach((col: any) => {
          console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
        })
      }
    } else {
      console.log('\nColumns:')
      columns?.forEach((col: any) => {
        console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })
      
      // Check for specific image columns
      const imageColumns = ['odoo_image', 'profile_image_url', 'odoo_image_1920', 'main_image_url', 'image_1920']
      console.log('\nChecking for image columns:')
      
      imageColumns.forEach(colName => {
        const found = columns?.find((c: any) => c.column_name === colName)
        if (found) {
          console.log(`✅ ${colName} - EXISTS`)
        } else {
          console.log(`❌ ${colName} - NOT FOUND`)
        }
      })
    }
    
    // Get sample data to see actual structure
    console.log('\nSample data:')
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.log('Error getting sample:', sampleError.message)
    } else if (sampleData && sampleData.length > 0) {
      console.log('Available columns in actual data:')
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`- ${key}`)
      })
    } else {
      console.log('No data found in table')
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

async function main() {
  console.log('Checking table structures in Supabase...')
  
  // Check both tables
  await checkTableStructure('products')
  await checkTableStructure('consultants')
  
  // Check if migrations were applied
  console.log('\n=== Checking applied migrations ===\n')
  
  const migrationFiles = [
    '20250701_add_odoo_id.sql',
    '20250701_add_odoo_fields.sql', 
    '20250701_add_profile_image.sql',
    '20250701_products_admin_fields.sql'
  ]
  
  console.log('Key migrations that should add image columns:')
  migrationFiles.forEach(file => {
    console.log(`- ${file}`)
  })
  
  console.log('\nIMPORTANT: Make sure all migrations in supabase/migrations/ have been applied to your database!')
}

main()