-- Tabela para produtos sincronizados do Odoo
CREATE TABLE IF NOT EXISTS products_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  category_name TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  attributes JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_products_sync_odoo_id ON products_sync(odoo_id);
CREATE INDEX idx_products_sync_sku ON products_sync(sku);
CREATE INDEX idx_products_sync_barcode ON products_sync(barcode);
CREATE INDEX idx_products_sync_active ON products_sync(active);

-- Tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('products', 'stock', 'orders', 'categories')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial', 'running')),
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas de log
CREATE INDEX idx_sync_logs_type_status ON sync_logs(sync_type, status);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Tabela de mapeamento de categorias
CREATE TABLE IF NOT EXISTS category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_category_id INTEGER UNIQUE NOT NULL,
  odoo_category_name TEXT NOT NULL,
  local_category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_products_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER products_sync_updated_at
  BEFORE UPDATE ON products_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_products_sync_updated_at();

-- Função para converter produto sincronizado em produto do catálogo
CREATE OR REPLACE FUNCTION create_product_from_sync(sync_id UUID)
RETURNS UUID AS $$
DECLARE
  new_product_id UUID;
  sync_record RECORD;
BEGIN
  -- Buscar registro de sincronização
  SELECT * INTO sync_record FROM products_sync WHERE id = sync_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto sincronizado não encontrado: %', sync_id;
  END IF;
  
  -- Inserir no catálogo principal
  INSERT INTO products (
    name,
    slug,
    description,
    price,
    stock,
    sku,
    images,
    active
  ) VALUES (
    sync_record.name,
    LOWER(REGEXP_REPLACE(sync_record.name, '[^a-zA-Z0-9]+', '-', 'g')),
    sync_record.description,
    sync_record.price,
    sync_record.stock_quantity,
    sync_record.sku,
    sync_record.images,
    sync_record.active
  )
  RETURNING id INTO new_product_id;
  
  RETURN new_product_id;
END;
$$ LANGUAGE plpgsql;

-- Permissões
GRANT SELECT ON products_sync TO authenticated;
GRANT ALL ON products_sync TO service_role;
GRANT ALL ON sync_logs TO service_role;
GRANT ALL ON category_mappings TO service_role;

-- RLS
ALTER TABLE products_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas para admin
CREATE POLICY "Admins can view products_sync" ON products_sync
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.active = true
    )
  );

CREATE POLICY "Service role full access to sync tables" ON products_sync
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to sync logs" ON sync_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to category mappings" ON category_mappings
  FOR ALL USING (auth.role() = 'service_role');