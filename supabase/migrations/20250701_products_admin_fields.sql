-- Add additional fields for products administration
-- Add status field if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued'));

-- Add image fields for better integration
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS main_image_url TEXT,
ADD COLUMN IF NOT EXISTS odoo_image TEXT; -- Base64 image from Odoo

-- Add timestamps for tracking
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS import_date TIMESTAMP WITH TIME ZONE;

-- Create product_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, category_id)
);

-- Create index for product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Enable RLS on product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for product_categories (public read)
CREATE POLICY "Product categories are viewable by everyone" ON product_categories
    FOR SELECT USING (true);

-- Admin policies for products (for admin users)
CREATE POLICY "Admin users can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Admin policies for product_categories
CREATE POLICY "Admin users can manage product categories" ON product_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Add comments
COMMENT ON COLUMN products.status IS 'Product availability status';
COMMENT ON COLUMN products.main_image_url IS 'Main product image URL';
COMMENT ON COLUMN products.odoo_image IS 'Base64 encoded image from Odoo';
COMMENT ON COLUMN products.last_stock_update IS 'Last time stock was updated';
COMMENT ON COLUMN products.import_date IS 'Date when product was imported from Odoo';