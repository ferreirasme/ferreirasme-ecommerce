-- =====================================================
-- MIGRATION ÚNICA CORRIGIDA - Sistema de Consultoras
-- =====================================================

-- Habilitar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE CONSULTORAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    
    -- Dados pessoais
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    nif TEXT,
    birth_date DATE,
    
    -- Endereço
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    address_postal_code TEXT,
    address_country TEXT DEFAULT 'PT',
    
    -- Dados bancários
    bank_name TEXT,
    bank_iban TEXT,
    bank_account_holder TEXT,
    
    -- Status e controle
    status TEXT CHECK (status IN ('active', 'inactive', 'suspended', 'pending')) DEFAULT 'pending',
    activation_date TIMESTAMP WITH TIME ZONE,
    deactivation_date TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,
    
    -- Configurações de comissão
    commission_percentage DECIMAL(5, 2) DEFAULT 10.00,
    commission_period_days INTEGER DEFAULT 45,
    minimum_order_value DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Metas e performance
    monthly_target DECIMAL(10, 2) DEFAULT 0.00,
    total_sales DECIMAL(10, 2) DEFAULT 0.00,
    total_commission_earned DECIMAL(10, 2) DEFAULT 0.00,
    
    -- LGPD e compliance
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_ip INET,
    consent_version TEXT,
    data_retention_until DATE,
    deletion_requested_at TIMESTAMP WITH TIME ZONE,
    deletion_scheduled_for DATE,
    anonymized_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. TABELA DE CLIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Dados do cliente
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    birth_date DATE,
    
    -- Endereço
    address JSONB,
    
    -- Controle
    status TEXT CHECK (status IN ('active', 'inactive', 'blocked')) DEFAULT 'active',
    source TEXT CHECK (source IN ('manual', 'referral', 'campaign', 'social_media', 'other')) DEFAULT 'manual',
    
    -- Relacionamento
    relationship_start_date DATE DEFAULT CURRENT_DATE,
    relationship_end_date DATE,
    
    -- Performance
    total_purchases DECIMAL(10, 2) DEFAULT 0.00,
    purchase_count INTEGER DEFAULT 0,
    last_purchase_date DATE,
    
    -- LGPD
    consent_date TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT false,
    data_sharing_consent BOOLEAN DEFAULT false,
    
    -- Metadados
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(consultant_id, email)
);

-- =====================================================
-- 3. TABELA DE COMISSÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consultant_commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    -- Valores
    order_total DECIMAL(10, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    
    -- Status do pagamento
    status TEXT CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')) DEFAULT 'pending',
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_by UUID REFERENCES auth.users(id),
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Período de referência
    reference_month INTEGER NOT NULL,
    reference_year INTEGER NOT NULL,
    
    -- Cancelamento
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,
    
    -- Metadados
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 4. TABELA DE CONSENTIMENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Tipo de consentimento
    consent_type TEXT CHECK (consent_type IN (
        'data_processing',
        'marketing',
        'data_sharing',
        'cookies',
        'newsletter',
        'terms_of_service',
        'privacy_policy'
    )) NOT NULL,
    
    -- Detalhes
    action TEXT CHECK (action IN ('granted', 'revoked', 'updated')) NOT NULL,
    version TEXT NOT NULL,
    content_hash TEXT,
    
    -- Rastreamento
    ip_address INET,
    user_agent TEXT,
    
    -- Validade
    valid_until DATE,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Garantir que apenas um tipo de usuário é referenciado
    CONSTRAINT check_single_user_type CHECK (
        (user_id IS NOT NULL AND consultant_id IS NULL AND client_id IS NULL) OR
        (user_id IS NULL AND consultant_id IS NOT NULL AND client_id IS NULL) OR
        (user_id IS NULL AND consultant_id IS NULL AND client_id IS NOT NULL)
    )
);

-- =====================================================
-- 5. TABELA DE AUDITORIA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    -- Dados da mudança
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    
    -- Contexto
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 6. ADICIONAR CAMPOS NA TABELA ORDERS
-- =====================================================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES public.consultants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS commission_status TEXT CHECK (commission_status IN ('not_applicable', 'pending', 'calculated', 'paid')) DEFAULT 'not_applicable';

-- =====================================================
-- 7. VERIFICAR E CRIAR/ATUALIZAR TABELA ADMINS
-- =====================================================
-- Adicionar campos faltantes se a tabela já existir
DO $$ 
BEGIN
    -- Se a tabela admins não existir, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        CREATE TABLE admins (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Adicionar colunas faltantes se necessário
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'phone') THEN
        ALTER TABLE admins ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'active') THEN
        ALTER TABLE admins ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Tabela de permissões administrativas
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES admins(id),
    UNIQUE(admin_id, permission)
);

-- Tabela de logs administrativos (diferente de audit_logs)
CREATE TABLE IF NOT EXISTS admin_logs (
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

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_code ON public.consultants(code);
CREATE INDEX IF NOT EXISTS idx_consultants_status ON public.consultants(status);
CREATE INDEX IF NOT EXISTS idx_consultants_email ON public.consultants(email);

CREATE INDEX IF NOT EXISTS idx_clients_consultant_id ON public.clients(consultant_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

CREATE INDEX IF NOT EXISTS idx_commissions_consultant_id ON public.consultant_commissions(consultant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.consultant_commissions(status);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- =====================================================
-- 9. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. POLÍTICAS RLS BÁSICAS
-- =====================================================

-- Consultants - podem ver seu próprio perfil
CREATE POLICY "Consultants can view own profile" ON public.consultants
    FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all consultants" ON public.consultants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.id = auth.uid()
            AND admins.active = true
        )
    );

-- Service role tem acesso total
CREATE POLICY "Service role full access consultants" ON public.consultants
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access clients" ON public.clients
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access commissions" ON public.consultant_commissions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access audit" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Admins
CREATE POLICY "Admins can view own profile" ON admins
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role full access admins" ON admins
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access admin_logs" ON admin_logs
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 11. FUNÇÃO PARA GERAR CÓDIGO DE CONSULTORA
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_consultant_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'CONS' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM public.consultants WHERE code = v_code) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consultants_updated_at 
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER clients_updated_at 
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER commissions_updated_at 
    BEFORE UPDATE ON public.consultant_commissions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Verificar se tudo foi criado
SELECT 
    'Tabelas criadas:' as info,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('consultants', 'clients', 'consultant_commissions', 'admins', 'audit_logs');