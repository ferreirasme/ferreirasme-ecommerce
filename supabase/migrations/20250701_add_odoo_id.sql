-- Add odoo_id column to consultants table for tracking Odoo imports
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS odoo_id INTEGER UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consultants_odoo_id ON consultants(odoo_id);

-- Add odoo_id to products table as well
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS odoo_id INTEGER UNIQUE;

CREATE INDEX IF NOT EXISTS idx_products_odoo_id ON products(odoo_id);

-- Add comment
COMMENT ON COLUMN consultants.odoo_id IS 'ID do parceiro na Odoo para sincronização';
COMMENT ON COLUMN products.odoo_id IS 'ID do produto na Odoo para sincronização';