-- Add description_sale field for Odoo sales description
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description_sale TEXT;

-- Add comments
COMMENT ON COLUMN products.description_sale IS 'Sales description from Odoo for customer-facing content';