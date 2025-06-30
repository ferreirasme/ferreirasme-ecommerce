-- Inserir categorias
INSERT INTO public.categories (name, slug, description) VALUES
('Anéis', 'aneis', 'Anéis elegantes para todas as ocasiões'),
('Colares', 'colares', 'Colares sofisticados e delicados'),
('Brincos', 'brincos', 'Brincos que complementam seu visual'),
('Pulseiras', 'pulseiras', 'Pulseiras modernas e atemporais'),
('Novidades', 'novidades', 'Últimos lançamentos da coleção');

-- Inserir produtos
INSERT INTO public.products (name, slug, description, price, sale_price, sku, stock_quantity, category_id, featured) VALUES
-- Anéis
('Anel Solitário Zircônia', 'anel-solitario-zirconia', 'Elegante anel solitário com zircônia de alta qualidade, perfeito para ocasiões especiais. Banho de ouro 18k com garantia de 6 meses.', 89.90, 69.90, 'AN001', 50, (SELECT id FROM categories WHERE slug = 'aneis'), true),
('Anel Aparador Duplo', 'anel-aparador-duplo', 'Anel aparador duplo delicado com detalhes em zircônia. Design moderno e versátil.', 99.90, NULL, 'AN002', 30, (SELECT id FROM categories WHERE slug = 'aneis'), false),
('Anel Infinito Cravejado', 'anel-infinito-cravejado', 'Anel com símbolo do infinito cravejado com micro zircônias. Representa amor eterno.', 119.90, NULL, 'AN003', 25, (SELECT id FROM categories WHERE slug = 'aneis'), true),

-- Colares
('Colar Ponto de Luz', 'colar-ponto-luz', 'Colar delicado com ponto de luz em zircônia. Comprimento ajustável de 40-45cm.', 129.90, NULL, 'CO001', 40, (SELECT id FROM categories WHERE slug = 'colares'), true),
('Colar Choker Elos', 'colar-choker-elos', 'Choker moderno com elos dourados. Tendência que combina com diversos estilos.', 159.90, NULL, 'CO002', 20, (SELECT id FROM categories WHERE slug = 'colares'), false),
('Colar Gravatinha', 'colar-gravatinha', 'Colar estilo gravatinha com pedra oval. Elegante e sofisticado.', 189.90, 149.90, 'CO003', 15, (SELECT id FROM categories WHERE slug = 'colares'), true),

-- Brincos
('Brinco Argola Cravejada', 'brinco-argola-cravejada', 'Argolas médias cravejadas com zircônias. Par perfeito para o dia a dia.', 79.90, NULL, 'BR001', 60, (SELECT id FROM categories WHERE slug = 'brincos'), true),
('Brinco Ear Cuff', 'brinco-ear-cuff', 'Ear cuff moderno sem necessidade de furo. Design arrojado e confortável.', 59.90, NULL, 'BR002', 45, (SELECT id FROM categories WHERE slug = 'brincos'), false),
('Brinco Gota Cristal', 'brinco-gota-cristal', 'Brinco em formato de gota com cristal lapidado. Ideal para ocasiões especiais.', 99.90, 79.90, 'BR003', 35, (SELECT id FROM categories WHERE slug = 'brincos'), true),

-- Pulseiras
('Pulseira Veneziana', 'pulseira-veneziana', 'Pulseira veneziana clássica com fecho reforçado. Comprimento de 18cm.', 149.90, 119.90, 'PU001', 25, (SELECT id FROM categories WHERE slug = 'pulseiras'), true),
('Pulseira Berloque', 'pulseira-berloque', 'Pulseira para berloques com 3 pingentes inclusos. Personalize do seu jeito.', 179.90, NULL, 'PU002', 20, (SELECT id FROM categories WHERE slug = 'pulseiras'), false),
('Pulseira Riviera', 'pulseira-riviera', 'Pulseira riviera com zircônias em toda extensão. Luxo e elegância.', 299.90, 249.90, 'PU003', 10, (SELECT id FROM categories WHERE slug = 'pulseiras'), true);

-- Adicionar produtos às novidades (últimos 4 produtos)
UPDATE public.products 
SET category_id = (SELECT id FROM categories WHERE slug = 'novidades')
WHERE slug IN ('anel-infinito-cravejado', 'colar-gravatinha', 'brinco-gota-cristal', 'pulseira-riviera');

-- Inserir imagens dos produtos (URLs de exemplo - você precisará adicionar as imagens reais)
INSERT INTO public.product_images (product_id, image_url, alt_text, position, is_primary) 
SELECT 
    id,
    'https://via.placeholder.com/400x400?text=' || REPLACE(name, ' ', '+'),
    name || ' - Imagem principal',
    0,
    true
FROM public.products;

-- Adicionar imagens secundárias para produtos em destaque
INSERT INTO public.product_images (product_id, image_url, alt_text, position, is_primary) 
SELECT 
    id,
    'https://via.placeholder.com/400x400?text=' || REPLACE(name, ' ', '+') || '+2',
    name || ' - Imagem 2',
    1,
    false
FROM public.products
WHERE featured = true;

INSERT INTO public.product_images (product_id, image_url, alt_text, position, is_primary) 
SELECT 
    id,
    'https://via.placeholder.com/400x400?text=' || REPLACE(name, ' ', '+') || '+3',
    name || ' - Imagem 3',
    2,
    false
FROM public.products
WHERE featured = true;