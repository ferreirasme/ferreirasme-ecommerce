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

async function listAllTables() {
  try {
    // Query to get all tables from the public schema
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      // Alternative approach using raw SQL
      console.log('Using alternative approach with raw SQL...')
      
      const { data: tables, error: sqlError } = await supabaseAdmin.rpc('get_all_tables', {})
      
      if (sqlError) {
        // If RPC doesn't exist, we'll create it
        console.log('Creating RPC function...')
        
        const { error: createError } = await supabaseAdmin.rpc('query', {
          query: `
            CREATE OR REPLACE FUNCTION get_all_tables()
            RETURNS TABLE(table_name text)
            LANGUAGE sql
            SECURITY DEFINER
            AS $$
              SELECT table_name::text
              FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name;
            $$;
          `
        })
        
        if (createError) {
          // Last resort: try direct query
          const { data: directQuery, error: directError } = await supabaseAdmin
            .rpc('query', {
              query: `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
              `
            })
          
          if (directError) {
            console.error('Error querying tables:', directError)
            
            // Based on the schema.sql file, here are the expected tables:
            console.log('\nBased on schema.sql, the following tables should exist:')
            const expectedTables = [
              'profiles',
              'categories',
              'products',
              'product_images',
              'carts',
              'cart_items',
              'orders',
              'order_items',
              'otp_codes'
            ]
            
            console.log('\nExpected tables:')
            expectedTables.forEach(table => console.log(`- ${table}`))
            
            // Let's verify each table exists
            console.log('\nVerifying each table...')
            for (const table of expectedTables) {
              const { error: checkError } = await supabaseAdmin
                .from(table)
                .select('*')
                .limit(0)
              
              if (checkError) {
                console.log(`❌ ${table}: NOT FOUND - ${checkError.message}`)
              } else {
                console.log(`✅ ${table}: EXISTS`)
              }
            }
            
            // Check for consultants table specifically
            console.log('\nChecking for consultants table...')
            const { error: consultantsError } = await supabaseAdmin
              .from('consultants')
              .select('*')
              .limit(0)
            
            if (consultantsError) {
              console.log('❌ consultants: NOT FOUND - This table does not exist in the database')
              console.log('   Error:', consultantsError.message)
            } else {
              console.log('✅ consultants: EXISTS')
            }
            
            return
          }
          
          console.log('Tables from direct query:', directQuery)
        } else {
          // Try the function again
          const { data: tables2, error: sqlError2 } = await supabaseAdmin.rpc('get_all_tables', {})
          if (!sqlError2) {
            console.log('Tables found:', tables2)
          }
        }
      } else {
        console.log('Tables found:', tables)
      }
    } else {
      console.log('Tables in public schema:')
      data?.forEach(table => console.log(`- ${table.table_name}`))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the function
listAllTables()