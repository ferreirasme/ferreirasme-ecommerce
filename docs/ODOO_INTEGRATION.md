# Integração Odoo - Ferreira's Me E-commerce

## 📋 Objetivo

Integrar o e-commerce com a conta Odoo da Ferreira's Me para:
- Importar catálogo de produtos
- Sincronizar estoque em tempo real
- Gerenciar pedidos
- Manter consistência de dados

## 🔍 Pesquisa Inicial

### Opções de Integração com Odoo

1. **API REST do Odoo (xmlrpc)**
   - Protocolo padrão do Odoo
   - Requer autenticação com API key
   - Acesso completo aos modelos

2. **Odoo External API**
   - Biblioteca JavaScript: `odoo-xmlrpc`
   - Permite operações CRUD
   - Suporta filtros e queries complexas

3. **Webhooks do Odoo**
   - Notificações em tempo real
   - Útil para sincronização de estoque
   - Requer configuração no Odoo

## 🏗️ Arquitetura Proposta

```
Odoo.com
    ↓ (API REST)
Next.js API Routes
    ↓
Supabase Database
    ↓
Frontend E-commerce
```

## 📦 Estrutura de Dados

### Produtos no Odoo
- `product.template`: Template de produto
- `product.product`: Variantes do produto
- `stock.quant`: Quantidade em estoque

### Mapeamento para Supabase
```sql
-- Tabela de produtos sincronizados
CREATE TABLE products_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  category_id UUID REFERENCES categories(id),
  images JSONB,
  attributes JSONB,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de sincronização
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'products', 'stock', 'orders'
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  records_synced INTEGER,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ Implementação

### Fase 1: Configuração Inicial
1. Obter credenciais da API Odoo
2. Criar tabelas de sincronização
3. Implementar cliente Odoo

### Fase 2: Importação de Produtos
1. Listar produtos do Odoo
2. Mapear campos para nosso schema
3. Importar imagens
4. Criar categorias

### Fase 3: Sincronização de Estoque
1. Webhook para mudanças de estoque
2. Job periódico de sincronização
3. Alertas de estoque baixo

### Fase 4: Gestão de Pedidos
1. Criar pedidos no Odoo
2. Atualizar status
3. Sincronizar tracking

## 🔑 Variáveis de Ambiente Necessárias

```env
# Odoo API
ODOO_URL=https://ferreirasme.odoo.com
ODOO_DB=ferreirasme
ODOO_USERNAME=api@ferreirasme.com
ODOO_API_KEY=your-api-key
```

## 📚 Bibliotecas Recomendadas

```json
{
  "dependencies": {
    "odoo-xmlrpc": "^1.0.8",
    "node-cron": "^3.0.3"
  }
}
```

## ⚠️ Considerações

1. **Rate Limiting**: Odoo pode ter limites de API
2. **Sincronização**: Evitar conflitos de dados
3. **Performance**: Cache de produtos frequentes
4. **Segurança**: Não expor credenciais Odoo

## 🚀 Próximos Passos

1. Solicitar credenciais API do Odoo
2. Testar conexão com ambiente sandbox
3. Mapear estrutura de produtos atual
4. Implementar importação inicial

---

**Atualizado em**: 01/07/2025