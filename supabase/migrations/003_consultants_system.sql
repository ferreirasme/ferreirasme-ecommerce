-- =====================================================
-- Sistema de Consultoras e Clientes com LGPD Compliance
-- =====================================================

-- Tabela de consultoras
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Código único da consultora (ex: CONS0001)
    
    -- Dados pessoais (com soft delete para LGPD)
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
    
    -- Dados bancários (criptografados)
    bank_name TEXT,
    bank_iban TEXT,
    bank_account_holder TEXT,
    
    -- Status e controle
    status TEXT CHECK (status IN ('active', 'inactive', 'suspended', 'pending')) DEFAULT 'pending',
    activation_date TIMESTAMP WITH TIME ZONE,
    deactivation_date TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,
    
    -- Configurações de comissão
    commission_percentage DECIMAL(5, 2) DEFAULT 10.00, -- Percentual padrão de comissão
    minimum_order_value DECIMAL(10, 2) DEFAULT 0.00, -- Valor mínimo de pedido
    
    -- Metas e performance
    monthly_target DECIMAL(10, 2) DEFAULT 0.00,
    total_sales DECIMAL(10, 2) DEFAULT 0.00,
    total_commission_earned DECIMAL(10, 2) DEFAULT 0.00,
    
    -- LGPD e compliance
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_ip INET,
    consent_version TEXT,
    data_retention_until DATE, -- Data limite para retenção de dados
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

-- Tabela de clientes vinculados às consultoras
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Pode ser null se cliente não tem conta
    
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
    
    UNIQUE(consultant_id, email) -- Um cliente por email por consultora
);

-- Tabela de comissões
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

-- Tabela de registros de consentimento LGPD
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
    
    -- Detalhes do consentimento
    action TEXT CHECK (action IN ('granted', 'revoked', 'updated')) NOT NULL,
    version TEXT NOT NULL,
    content_hash TEXT, -- Hash do conteúdo aceito
    
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

-- Tabela de histórico de mudanças (auditoria)
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

-- Adicionar campos de consultora na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES public.consultants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS commission_status TEXT CHECK (commission_status IN ('not_applicable', 'pending', 'calculated', 'paid')) DEFAULT 'not_applicable';

-- =====================================================
-- Índices para Performance
-- =====================================================

-- Consultants
CREATE INDEX idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX idx_consultants_code ON public.consultants(code);
CREATE INDEX idx_consultants_status ON public.consultants(status);
CREATE INDEX idx_consultants_email ON public.consultants(email);
CREATE INDEX idx_consultants_deletion_scheduled ON public.consultants(deletion_scheduled_for) WHERE deletion_scheduled_for IS NOT NULL;

-- Clients
CREATE INDEX idx_clients_consultant_id ON public.clients(consultant_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_status ON public.clients(status);

-- Commissions
CREATE INDEX idx_commissions_consultant_id ON public.consultant_commissions(consultant_id);
CREATE INDEX idx_commissions_order_id ON public.consultant_commissions(order_id);
CREATE INDEX idx_commissions_status ON public.consultant_commissions(status);
CREATE INDEX idx_commissions_reference ON public.consultant_commissions(reference_year, reference_month);

-- Consent Records
CREATE INDEX idx_consent_user_id ON public.consent_records(user_id);
CREATE INDEX idx_consent_consultant_id ON public.consent_records(consultant_id);
CREATE INDEX idx_consent_client_id ON public.consent_records(client_id);
CREATE INDEX idx_consent_type ON public.consent_records(consent_type);
CREATE INDEX idx_consent_created ON public.consent_records(created_at);

-- Audit Logs
CREATE INDEX idx_audit_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

-- Orders (campos adicionados)
CREATE INDEX idx_orders_consultant_id ON public.orders(consultant_id);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Consultants Policies
CREATE POLICY "Consultants can view own profile" ON public.consultants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consultants" ON public.consultants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.metadata->>'role' = 'admin'
        )
    );

CREATE POLICY "Consultants can update own profile" ON public.consultants
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Clients Policies
CREATE POLICY "Consultants can view own clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultants
            WHERE consultants.id = clients.consultant_id
            AND consultants.user_id = auth.uid()
        )
    );

CREATE POLICY "Consultants can manage own clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.consultants
            WHERE consultants.id = clients.consultant_id
            AND consultants.user_id = auth.uid()
        )
    );

-- Commissions Policies
CREATE POLICY "Consultants can view own commissions" ON public.consultant_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultants
            WHERE consultants.id = consultant_commissions.consultant_id
            AND consultants.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all commissions" ON public.consultant_commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.metadata->>'role' = 'admin'
        )
    );

-- Consent Records Policies
CREATE POLICY "Users can view own consent records" ON public.consent_records
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.consultants
            WHERE consultants.id = consent_records.consultant_id
            AND consultants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create consent records" ON public.consent_records
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.consultants
            WHERE consultants.id = consent_records.consultant_id
            AND consultants.user_id = auth.uid()
        )
    );

-- Audit Logs Policies (read-only for all, write through functions)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.metadata->>'role' = 'admin'
        )
    );

-- =====================================================
-- Functions
-- =====================================================

-- Função para gerar código único de consultora
CREATE OR REPLACE FUNCTION public.generate_consultant_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar código no formato CONS + 4 dígitos
        v_code := 'CONS' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM public.consultants WHERE code = v_code) INTO v_exists;
        
        -- Se não existe, retornar
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_consultant RECORD;
    v_commission_amount DECIMAL(10, 2);
BEGIN
    -- Só calcular se tem consultora associada
    IF NEW.consultant_id IS NOT NULL THEN
        -- Buscar dados da consultora
        SELECT * INTO v_consultant 
        FROM public.consultants 
        WHERE id = NEW.consultant_id;
        
        -- Calcular comissão
        v_commission_amount := NEW.total * (v_consultant.commission_percentage / 100);
        
        -- Criar registro de comissão
        INSERT INTO public.consultant_commissions (
            consultant_id,
            order_id,
            client_id,
            order_total,
            commission_percentage,
            commission_amount,
            reference_month,
            reference_year,
            status
        ) VALUES (
            NEW.consultant_id,
            NEW.id,
            NEW.client_id,
            NEW.total,
            v_consultant.commission_percentage,
            v_commission_amount,
            EXTRACT(MONTH FROM NEW.created_at),
            EXTRACT(YEAR FROM NEW.created_at),
            'pending'
        );
        
        -- Atualizar status de comissão no pedido
        NEW.commission_status := 'calculated';
        
        -- Atualizar totais da consultora
        UPDATE public.consultants
        SET total_sales = total_sales + NEW.total
        WHERE id = NEW.consultant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função de auditoria genérica
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
BEGIN
    -- Preparar dados
    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        -- Identificar campos alterados
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_old_data) o
        FULL OUTER JOIN jsonb_each(v_new_data) n USING (key)
        WHERE o.value IS DISTINCT FROM n.value;
    END IF;
    
    -- Inserir log
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        old_data,
        new_data,
        changed_fields
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        auth.uid(),
        v_old_data,
        v_new_data,
        v_changed_fields
    );
    
    -- Retornar
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para anonimizar dados pessoais (LGPD)
CREATE OR REPLACE FUNCTION public.anonymize_personal_data(p_consultant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonimizar dados da consultora
    UPDATE public.consultants
    SET 
        full_name = 'ANONIMIZADO',
        email = CONCAT('anonimizado_', id, '@example.com'),
        phone = '000000000',
        whatsapp = NULL,
        nif = NULL,
        birth_date = NULL,
        address_street = NULL,
        address_number = NULL,
        address_complement = NULL,
        address_neighborhood = NULL,
        address_city = NULL,
        address_state = NULL,
        address_postal_code = NULL,
        bank_name = NULL,
        bank_iban = NULL,
        bank_account_holder = NULL,
        anonymized_at = NOW()
    WHERE id = p_consultant_id;
    
    -- Anonimizar clientes vinculados
    UPDATE public.clients
    SET
        full_name = 'ANONIMIZADO',
        email = CONCAT('anonimizado_', id, '@example.com'),
        phone = NULL,
        whatsapp = NULL,
        birth_date = NULL,
        address = NULL
    WHERE consultant_id = p_consultant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar exclusões agendadas
CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS VOID AS $$
BEGIN
    -- Anonimizar consultoras com exclusão agendada
    PERFORM public.anonymize_personal_data(id)
    FROM public.consultants
    WHERE deletion_scheduled_for <= CURRENT_DATE
    AND anonymized_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================

-- Triggers de updated_at
CREATE TRIGGER handle_consultants_updated_at BEFORE UPDATE ON public.consultants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_commissions_updated_at BEFORE UPDATE ON public.consultant_commissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para calcular comissão em novos pedidos
CREATE TRIGGER calculate_commission_on_order
    AFTER INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.consultant_id IS NOT NULL)
    EXECUTE FUNCTION public.calculate_commission();

-- Triggers de auditoria (apenas para tabelas críticas)
CREATE TRIGGER audit_consultants
    AFTER INSERT OR UPDATE OR DELETE ON public.consultants
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_clients
    AFTER INSERT OR UPDATE OR DELETE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_commissions
    AFTER INSERT OR UPDATE OR DELETE ON public.consultant_commissions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- =====================================================
-- Views úteis
-- =====================================================

-- View de performance de consultoras
CREATE OR REPLACE VIEW public.consultant_performance AS
SELECT 
    c.id,
    c.code,
    c.full_name,
    c.status,
    c.commission_percentage,
    c.monthly_target,
    COUNT(DISTINCT cl.id) as total_clients,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(SUM(cc.commission_amount), 0) as total_commission,
    EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year
FROM public.consultants c
LEFT JOIN public.clients cl ON cl.consultant_id = c.id
LEFT JOIN public.orders o ON o.consultant_id = c.id
LEFT JOIN public.consultant_commissions cc ON cc.consultant_id = c.id
WHERE c.status = 'active'
GROUP BY c.id;

-- View de comissões pendentes
CREATE OR REPLACE VIEW public.pending_commissions AS
SELECT 
    cc.*,
    c.code as consultant_code,
    c.full_name as consultant_name,
    o.order_number
FROM public.consultant_commissions cc
JOIN public.consultants c ON c.id = cc.consultant_id
JOIN public.orders o ON o.id = cc.order_id
WHERE cc.status = 'pending';

-- =====================================================
-- Dados iniciais e configurações
-- =====================================================

-- Inserir versão inicial de consentimento
INSERT INTO public.consent_records (
    consent_type,
    action,
    version,
    content_hash,
    metadata
) VALUES (
    'terms_of_service',
    'updated',
    '1.0.0',
    MD5('Termos de Serviço v1.0.0'),
    '{"description": "Versão inicial dos termos de serviço"}'::JSONB
) ON CONFLICT DO NOTHING;

-- Comentários nas tabelas para documentação
COMMENT ON TABLE public.consultants IS 'Tabela de consultoras do sistema com compliance LGPD';
COMMENT ON TABLE public.clients IS 'Clientes vinculados às consultoras';
COMMENT ON TABLE public.consultant_commissions IS 'Registro de comissões das consultoras';
COMMENT ON TABLE public.consent_records IS 'Histórico de consentimentos LGPD';
COMMENT ON TABLE public.audit_logs IS 'Log de auditoria para todas as operações críticas';

COMMENT ON COLUMN public.consultants.deletion_scheduled_for IS 'Data agendada para anonimização dos dados (LGPD)';
COMMENT ON COLUMN public.consultants.anonymized_at IS 'Data em que os dados foram anonimizados';
COMMENT ON COLUMN public.consultants.data_retention_until IS 'Data limite para retenção dos dados conforme política LGPD';