import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/lib/security/check-admin'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    
    // SQL to add missing columns safely
    const sql = `
      -- Add missing columns to products table safely
      -- Only add columns if they don't already exist

      -- Add odoo_image column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'odoo_image'
        ) THEN
          ALTER TABLE products ADD COLUMN odoo_image TEXT;
        END IF;
      END $$;

      -- Add description_sale column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'description_sale'
        ) THEN
          ALTER TABLE products ADD COLUMN description_sale TEXT;
        END IF;
      END $$;

      -- Add import_date column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'import_date'
        ) THEN
          ALTER TABLE products ADD COLUMN import_date TIMESTAMP DEFAULT NOW();
        END IF;
      END $$;

      -- Add last_stock_update column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'last_stock_update'
        ) THEN
          ALTER TABLE products ADD COLUMN last_stock_update TIMESTAMP DEFAULT NOW();
        END IF;
      END $$;

      -- Add main_image_url column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'main_image_url'
        ) THEN
          ALTER TABLE products ADD COLUMN main_image_url TEXT;
        END IF;
      END $$;

      -- Add indexes for performance
      CREATE INDEX IF NOT EXISTS idx_products_odoo_id ON products(odoo_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
      CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
    `

    // Execute the SQL
    const { data, error } = await adminClient.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({ 
        error: 'Failed to apply migrations',
        details: error.message 
      }, { status: 500 })
    }

    // Check which columns exist now
    const checkColumns = await adminClient
      .from('information_schema.columns' as any)
      .select('column_name')
      .eq('table_name', 'products')
      .in('column_name', ['odoo_image', 'description_sale', 'import_date', 'last_stock_update', 'main_image_url'])

    return NextResponse.json({ 
      success: true,
      message: 'Missing columns added successfully',
      columns_checked: checkColumns.data?.map(c => c.column_name) || []
    })

  } catch (error: any) {
    console.error('Error applying migrations:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}