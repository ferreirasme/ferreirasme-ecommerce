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