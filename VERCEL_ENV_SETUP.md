# Configuração de Variáveis de Ambiente no Vercel

## Variáveis Necessárias

### 1. Variáveis do Supabase (já configuradas)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Variáveis da Odoo (PRECISAM SER ADICIONADAS)
Acesse: https://vercel.com/ferreirasme/ferreirasme-ecommerce/settings/environment-variables

Adicione as seguintes variáveis:

```
ODOO_URL=https://ferreirasme.odoo.com
ODOO_DB=ferreirasme
ODOO_USERNAME=tamaraleal@gmail.com
ODOO_API_KEY=[SUA_API_KEY_AQUI]
```

### 3. Outras Variáveis Importantes
```
RESEND_API_KEY=[já configurada]
NEXT_PUBLIC_APP_URL=https://ferreirasme-ecommerce.vercel.app
```

## Como Adicionar no Vercel

1. Acesse o dashboard do projeto no Vercel
2. Vá para Settings > Environment Variables
3. Adicione cada variável com:
   - Key: Nome da variável (ex: ODOO_URL)
   - Value: Valor da variável
   - Environment: Production, Preview, Development (marque todos)
4. Clique em "Save"

## Verificação

Após adicionar as variáveis:

1. Acesse: https://ferreirasme-ecommerce.vercel.app/api/test-env
2. Verifique se todas as variáveis aparecem como "Set"
3. Teste a página: https://ferreirasme-ecommerce.vercel.app/admin/test-odoo

## Debug de Problemas

### Erro "Não autenticado"
1. Limpe os cookies do navegador
2. Faça login novamente em /admin/login
3. Verifique se o email usado está na tabela `admins`

### Erro de Conexão Odoo
1. Verifique se a API Key da Odoo está correta
2. Teste em: /admin/test-odoo
3. Verifique os logs no Vercel dashboard

### Consultoras/Produtos não aparecem
1. Execute primeiro a importação da Odoo
2. Verifique se há dados nas tabelas do Supabase
3. Teste as queries diretamente no Supabase dashboard