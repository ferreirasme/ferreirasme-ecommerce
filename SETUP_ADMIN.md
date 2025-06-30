# Como Criar o Primeiro Usuário Admin

## Passo 1: Criar o usuário no Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** > **Users**
3. Clique em **Add user** > **Create new user**
4. Preencha:
   - Email: seu-email@exemplo.com
   - Password: uma senha segura
   - ✅ Auto Confirm User (marque esta opção)
5. Clique em **Create user**

## Passo 2: Executar o SQL para tornar admin

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Cole e execute este código (substitua o email pelo que você usou):

```sql
-- Tornar usuário admin
UPDATE profiles 
SET 
  role = 'admin',
  metadata = jsonb_build_object(
    'first_login', false,
    'permissions', array['all']
  )
WHERE email = 'seu-email@exemplo.com';

-- Verificar se funcionou
SELECT email, role, metadata 
FROM profiles 
WHERE email = 'seu-email@exemplo.com';
```

## Passo 3: Testar o acesso

1. Acesse sua aplicação: https://seu-site.vercel.app/admin
2. Faça login com o email e senha criados
3. Você deve ter acesso total ao painel administrativo

## Dados necessários:

Para criar o admin, você precisa apenas de:
- **Email**: Para login
- **Senha**: Mínimo 6 caracteres

Opcionalmente, você pode adicionar depois:
- Nome completo
- Telefone
- NIF

## Criando uma Consultora de Teste

Após criar o admin, você pode criar uma consultora de teste:

1. Faça login como admin
2. Vá em `/admin/consultants/new`
3. Preencha os dados da consultora
4. O sistema gerará automaticamente:
   - Código único (ex: CONS001)
   - Senha temporária
   - Email de boas-vindas

## Troubleshooting

Se algo der errado:

1. **Erro de permissão**: Verifique se o campo `role` está como 'admin' na tabela profiles
2. **Não consegue logar**: Verifique se o usuário está confirmado em auth.users
3. **Página em branco**: Verifique o console do navegador (F12) para erros

## Comandos SQL Úteis

```sql
-- Ver todos os admins
SELECT * FROM profiles WHERE role = 'admin';

-- Ver todas as consultoras
SELECT * FROM consultants ORDER BY created_at DESC;

-- Ver últimos pedidos
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Ver comissões pendentes
SELECT * FROM consultant_commissions WHERE status = 'pending';
```