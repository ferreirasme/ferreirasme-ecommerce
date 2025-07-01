# Corrigir URL de Confirmação de Email - Supabase

## 🔧 Como Corrigir

### 1. Acesse o Dashboard do Supabase
- Vá para: https://app.supabase.com
- Selecione seu projeto

### 2. Navegue para Authentication → URL Configuration

### 3. Atualize as seguintes configurações:

#### Site URL
```
https://ferreirasme-ecommerce.vercel.app
```

#### Redirect URLs (adicione todas estas):
```
https://ferreirasme-ecommerce.vercel.app/**
https://ferreirasme-ecommerce.vercel.app
http://localhost:3005/**
http://localhost:3005
```

### 4. Email Templates (opcional mas recomendado)
- Vá para: Authentication → Email Templates
- Confirme que os templates usam `{{ .SiteURL }}` corretamente

### 5. Salve as alterações

## 🚨 Importante

- As mudanças são aplicadas imediatamente
- Novos emails usarão a URL correta
- Links antigos com localhost não funcionarão mais

## 📝 Verificação

Após configurar, ao criar uma nova consultora:
- O email deve conter: https://ferreirasme-ecommerce.vercel.app/...
- NÃO deve conter: http://localhost:3000/...

## 🔄 Alternativa Temporária

Se precisar reenviar o email de confirmação:
1. No Supabase Dashboard → Authentication → Users
2. Encontre o usuário
3. Clique nos 3 pontos → "Send confirmation email"

Isso enviará um novo email com a URL correta configurada.