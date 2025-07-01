-- Seed data for products testing

-- First, ensure we have some categories
INSERT INTO categories (id, name, slug, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Brincos', 'brincos', 'Brincos de todos os estilos'),
  ('22222222-2222-2222-2222-222222222222', 'Colares', 'colares', 'Colares e correntes'),
  ('33333333-3333-3333-3333-333333333333', 'Pulseiras', 'pulseiras', 'Pulseiras e braceletes'),
  ('44444444-4444-4444-4444-444444444444', 'Anéis', 'aneis', 'Anéis de todos os tamanhos')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (
  id, 
  name, 
  slug, 
  description, 
  price, 
  sale_price, 
  sku, 
  stock_quantity, 
  featured, 
  active, 
  status,
  main_image_url,
  odoo_id
) VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    'Brinco Pérola Clássico',
    'brinco-perola-classico',
    'Brincos com pérolas naturais e acabamento em prata',
    29.90,
    NULL,
    'BRI-001',
    50,
    true,
    true,
    'active',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    1001
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'Colar Coração Rose Gold',
    'colar-coracao-rose-gold',
    'Colar delicado com pingente de coração em rose gold',
    45.00,
    39.90,
    'COL-002',
    30,
    true,
    true,
    'active',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    1002
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    'Pulseira Berloque Prata',
    'pulseira-berloque-prata',
    'Pulseira em prata com berloques personalizáveis',
    89.90,
    NULL,
    'PUL-003',
    15,
    false,
    true,
    'active',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    1003
  ),
  (
    '55555555-5555-5555-5555-555555555554',
    'Anel Solitário Zircônia',
    'anel-solitario-zirconia',
    'Anel solitário com zircônia brilhante',
    59.90,
    NULL,
    'ANE-004',
    0,
    false,
    true,
    'out_of_stock',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
    1004
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Conjunto Festa Dourado',
    'conjunto-festa-dourado',
    'Conjunto completo: brinco, colar e pulseira dourados',
    120.00,
    99.90,
    'CON-005',
    8,
    true,
    true,
    'active',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
    1005
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    'Brinco Argola Grande',
    'brinco-argola-grande',
    'Brincos de argola grandes em prata 925',
    35.00,
    NULL,
    'BRI-006',
    25,
    false,
    false,
    'inactive',
    'https://images.unsplash.com/photo-1588444650733-d0767b753fc8?w=400',
    1006
  )
ON CONFLICT (id) DO NOTHING;

-- Link products to categories
INSERT INTO product_categories (product_id, category_id) VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333333'),
  ('55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333'),
  ('55555555-5555-5555-5555-555555555556', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Add some product images
INSERT INTO product_images (product_id, image_url, alt_text, position, is_primary) VALUES
  ('55555555-5555-5555-5555-555555555551', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 'Brinco Pérola vista frontal', 0, true),
  ('55555555-5555-5555-5555-555555555551', 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800', 'Brinco Pérola detalhe', 1, false),
  ('55555555-5555-5555-5555-555555555552', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', 'Colar Coração Rose Gold', 0, true),
  ('55555555-5555-5555-5555-555555555553', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800', 'Pulseira Berloque', 0, true),
  ('55555555-5555-5555-5555-555555555554', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', 'Anel Solitário', 0, true),
  ('55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', 'Conjunto Festa Dourado completo', 0, true)
ON CONFLICT (id) DO NOTHING;