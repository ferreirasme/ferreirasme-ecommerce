-- Add additional fields from Odoo to consultants table
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS function VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS lang VARCHAR(10) DEFAULT 'pt_BR',
ADD COLUMN IF NOT EXISTS ref VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_rank INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_rank INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_payment_term_id INTEGER,
ADD COLUMN IF NOT EXISTS category_ids INTEGER[],
ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partner_share BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN consultants.mobile IS 'Número de celular/móvel da Odoo';
COMMENT ON COLUMN consultants.function IS 'Cargo/função (ex: Revendedor)';
COMMENT ON COLUMN consultants.website IS 'Website pessoal';
COMMENT ON COLUMN consultants.lang IS 'Idioma preferido';
COMMENT ON COLUMN consultants.ref IS 'Referência interna';
COMMENT ON COLUMN consultants.customer_rank IS 'Ranking como cliente na Odoo';
COMMENT ON COLUMN consultants.supplier_rank IS 'Ranking como fornecedor na Odoo';
COMMENT ON COLUMN consultants.credit_limit IS 'Limite de crédito';
COMMENT ON COLUMN consultants.property_payment_term_id IS 'ID das condições de pagamento na Odoo';
COMMENT ON COLUMN consultants.category_ids IS 'IDs das categorias/tags na Odoo';
COMMENT ON COLUMN consultants.is_employee IS 'Se é funcionário';
COMMENT ON COLUMN consultants.partner_share IS 'Se é parceiro compartilhado';

-- Create a view to show consultants with all their Odoo data
CREATE OR REPLACE VIEW consultants_odoo_view AS
SELECT 
  c.*,
  CASE 
    WHEN c.customer_rank > 0 THEN 'Cliente'
    WHEN c.supplier_rank > 0 THEN 'Fornecedor'
    ELSE 'Consultora'
  END as partner_type,
  CASE
    WHEN c.mobile IS NOT NULL AND c.mobile != '' THEN c.mobile
    ELSE c.whatsapp
  END as best_mobile_number
FROM consultants c;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_consultants_customer_rank ON consultants(customer_rank);
CREATE INDEX IF NOT EXISTS idx_consultants_lang ON consultants(lang);

-- Grant permissions on the view
GRANT SELECT ON consultants_odoo_view TO authenticated;