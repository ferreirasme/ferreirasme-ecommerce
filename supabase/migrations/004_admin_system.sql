-- Criar tabela de administradores
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Remover coluna is_admin da tabela consultants
ALTER TABLE consultants DROP COLUMN IF EXISTS is_admin;

-- Criar tabela de permissões administrativas
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES admins(id),
  UNIQUE(admin_id, permission)
);

-- Criar tabela de logs administrativos
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Criar RLS policies para admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para admins (apenas próprio perfil)
CREATE POLICY "Admins can view their own profile" ON admins
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update their own profile" ON admins
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para admin_permissions
CREATE POLICY "Admins can view their permissions" ON admin_permissions
  FOR SELECT USING (auth.uid() = admin_id);

-- Políticas para admin_logs (admins podem ver todos os logs)
CREATE POLICY "Admins can view all logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND active = true)
  );

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE id = user_id AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION has_admin_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_permissions 
    WHERE admin_id = user_id AND permission = permission_name
  ) OR EXISTS (
    SELECT 1 FROM admin_permissions 
    WHERE admin_id = user_id AND permission = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para logs administrativos
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log será inserido pela aplicação com mais contexto
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar políticas existentes para incluir verificação de admin
-- Consultants: admins podem ver e editar todos
CREATE POLICY "Admins can view all consultants" ON consultants
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert consultants" ON consultants
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update all consultants" ON consultants
  FOR UPDATE USING (is_admin(auth.uid()));

-- Clients: admins podem ver e editar todos
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (is_admin(auth.uid()));

-- Orders: admins podem ver todos
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (is_admin(auth.uid()));

-- Consultant_commissions: admins podem ver e editar todos
CREATE POLICY "Admins can view all commissions" ON consultant_commissions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update commissions" ON consultant_commissions
  FOR UPDATE USING (is_admin(auth.uid()));

-- Inserir permissões padrão
INSERT INTO admin_permissions (admin_id, permission) VALUES
  -- Estas serão atribuídas ao primeiro admin criado
  ('00000000-0000-0000-0000-000000000000', 'super_admin'),
  ('00000000-0000-0000-0000-000000000000', 'manage_consultants'),
  ('00000000-0000-0000-0000-000000000000', 'manage_clients'),
  ('00000000-0000-0000-0000-000000000000', 'manage_orders'),
  ('00000000-0000-0000-0000-000000000000', 'manage_products'),
  ('00000000-0000-0000-0000-000000000000', 'view_reports'),
  ('00000000-0000-0000-0000-000000000000', 'manage_commissions');

-- Criar primeiro admin (ajustar ID após criar o usuário no auth)
-- Este comando deve ser executado manualmente após criar o usuário
/*
INSERT INTO admins (id, email, full_name, phone, active)
VALUES (
  'SEU-UUID-DO-AUTH-AQUI',
  'admin@ferreirasme.com',
  'Administrador Master',
  '+351999999999',
  true
);

-- Atribuir todas as permissões ao primeiro admin
UPDATE admin_permissions 
SET admin_id = 'SEU-UUID-DO-AUTH-AQUI' 
WHERE admin_id = '00000000-0000-0000-0000-000000000000';
*/