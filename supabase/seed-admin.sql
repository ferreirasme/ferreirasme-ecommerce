-- Script para criar primeiro usuário administrador
-- Execute este script no SQL Editor do Supabase Dashboard

-- Substitua estes valores com seus dados reais
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'seu-email@exemplo.com'; -- ALTERE AQUI
  v_password text := 'SenhaSegura123!'; -- ALTERE AQUI
  v_nome text := 'Seu Nome'; -- ALTERE AQUI
  v_telefone text := '+351912345678'; -- ALTERE AQUI (formato português)
BEGIN
  -- 1. Criar usuário no auth.users
  -- Nota: No Supabase Dashboard, você precisa criar o usuário pela interface primeiro
  -- Vá em Authentication > Users > Invite User
  -- Use o email e senha definidos acima
  
  -- 2. Após criar o usuário pela interface, execute apenas esta parte:
  -- Pegar o ID do usuário criado
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = v_email
  LIMIT 1;

  -- 3. Verificar se encontrou o usuário
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado. Certifique-se de criar o usuário em Authentication > Users primeiro.';
  END IF;

  -- 4. Criar ou atualizar perfil como admin
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_email,
    v_nome,
    v_telefone,
    'admin',
    jsonb_build_object(
      'first_login', false,
      'permissions', array['all']
    ),
    now(),
    now()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  -- 5. Criar entrada na tabela users se não existir
  INSERT INTO public.users (
    id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Admin criado com sucesso! Email: %, ID: %', v_email, v_user_id;
END $$;

-- Verificar se foi criado corretamente
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.role,
  p.metadata
FROM profiles p
WHERE p.role = 'admin';