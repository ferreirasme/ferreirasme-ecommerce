# Relatório de Estrutura das Tabelas no Banco de Dados

## Resumo da Análise

Após verificar a estrutura real do banco de dados em produção, identifiquei as seguintes informações:

## 1. Tabela `products`

### Colunas Existentes:
- id
- name
- slug
- description
- price
- sale_price
- sku
- stock_quantity
- category_id
- featured
- active
- metadata
- created_at
- updated_at
- odoo_id

### Colunas de Imagem AUSENTES:
- ❌ `odoo_image` - NÃO EXISTE
- ❌ `main_image_url` - NÃO EXISTE
- ❌ `last_stock_update` - NÃO EXISTE
- ❌ `import_date` - NÃO EXISTE
- ❌ `status` - NÃO EXISTE
- ❌ `description_sale` - NÃO EXISTE

## 2. Tabela `consultants`

### Colunas Existentes:
Todas as colunas esperadas estão presentes, incluindo:
- ✅ `profile_image_url`
- ✅ `odoo_image_1920`

## Problema Identificado

O erro "column products.odoo_image does not exist" ocorre porque as seguintes migrations NÃO foram aplicadas ao banco de dados:

1. **20250701_products_admin_fields.sql** - Esta migration adiciona:
   - `status`
   - `main_image_url`
   - `odoo_image`
   - `last_stock_update`
   - `import_date`

2. **20250701_products_description_sale.sql** - Esta migration adiciona:
   - `description_sale`

## Solução Recomendada

### Opção 1: Aplicar as Migrations Faltantes

Execute as seguintes migrations no banco de dados:

```sql
-- 20250701_products_admin_fields.sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
ADD COLUMN IF NOT EXISTS main_image_url TEXT,
ADD COLUMN IF NOT EXISTS odoo_image TEXT,
ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS import_date TIMESTAMP WITH TIME ZONE;

-- 20250701_products_description_sale.sql (se existir)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS description_sale TEXT;
```

### Opção 2: Atualizar o Código para Usar Apenas Colunas Existentes

Modifique o código de importação para:
1. Remover referências às colunas inexistentes
2. Usar a tabela `product_images` para armazenar imagens

## Arquivos que Precisam ser Atualizados

Se escolher a Opção 2 (mais segura para produção):

1. `/lib/database/schema-validator.ts` - Remover colunas inexistentes
2. `/app/api/products/import/route.ts` - Atualizar lógica de importação
3. `/app/api/products/import-excel/route.ts` - Atualizar lógica de importação
4. `/app/api/products/import-excel-v2/route.ts` - Atualizar lógica de importação

## Recomendação

Para evitar quebrar a produção, recomendo:

1. **Imediato**: Atualizar o código para trabalhar apenas com as colunas existentes
2. **Posteriormente**: Aplicar as migrations faltantes em um momento apropriado com backup do banco

## Código Atualizado do schema-validator.ts

```typescript
products: {
  columns: [
    'id',
    'name',
    'slug',
    'description',
    'price',
    'sale_price',
    'sku',
    'stock_quantity',
    'category_id',
    'featured',
    'active',
    'metadata',
    'created_at',
    'updated_at',
    'odoo_id'
  ],
  required: ['name', 'slug', 'price'],
  unique: ['slug', 'sku', 'odoo_id']
}
```