-- =====================================================
-- Funções Auxiliares e Procedures para Sistema de Consultoras
-- =====================================================

-- Função para registrar nova consultora
CREATE OR REPLACE FUNCTION public.register_consultant(
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_whatsapp TEXT DEFAULT NULL,
    p_nif TEXT DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_address JSONB DEFAULT NULL,
    p_commission_percentage DECIMAL(5,2) DEFAULT 10.00
) RETURNS UUID AS $$
DECLARE
    v_consultant_id UUID;
    v_code TEXT;
BEGIN
    -- Gerar código único
    v_code := public.generate_consultant_code();
    
    -- Inserir consultora
    INSERT INTO public.consultants (
        user_id,
        code,
        full_name,
        email,
        phone,
        whatsapp,
        nif,
        birth_date,
        commission_percentage,
        status,
        consent_date,
        consent_version,
        data_retention_until
    ) VALUES (
        p_user_id,
        v_code,
        p_full_name,
        p_email,
        p_phone,
        p_whatsapp,
        p_nif,
        p_birth_date,
        p_commission_percentage,
        'pending',
        NOW(),
        '1.0.0',
        CURRENT_DATE + INTERVAL '5 years' -- Retenção padrão de 5 anos
    ) RETURNING id INTO v_consultant_id;
    
    -- Se endereço foi fornecido, atualizar
    IF p_address IS NOT NULL THEN
        UPDATE public.consultants
        SET 
            address_street = p_address->>'street',
            address_number = p_address->>'number',
            address_complement = p_address->>'complement',
            address_neighborhood = p_address->>'neighborhood',
            address_city = p_address->>'city',
            address_state = p_address->>'state',
            address_postal_code = p_address->>'postal_code',
            address_country = COALESCE(p_address->>'country', 'PT')
        WHERE id = v_consultant_id;
    END IF;
    
    -- Registrar consentimento
    INSERT INTO public.consent_records (
        consultant_id,
        consent_type,
        action,
        version,
        ip_address,
        valid_until
    ) VALUES (
        v_consultant_id,
        'data_processing',
        'granted',
        '1.0.0',
        inet_client_addr(),
        CURRENT_DATE + INTERVAL '5 years'
    );
    
    RETURN v_consultant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para ativar consultora
CREATE OR REPLACE FUNCTION public.activate_consultant(
    p_consultant_id UUID,
    p_activated_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.consultants
    SET 
        status = 'active',
        activation_date = NOW(),
        updated_by = COALESCE(p_activated_by, auth.uid())
    WHERE id = p_consultant_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar cliente à consultora
CREATE OR REPLACE FUNCTION public.add_client_to_consultant(
    p_consultant_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_address JSONB DEFAULT NULL,
    p_source TEXT DEFAULT 'manual',
    p_marketing_consent BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Verificar se consultora está ativa
    IF NOT EXISTS (
        SELECT 1 FROM public.consultants 
        WHERE id = p_consultant_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Consultora não está ativa';
    END IF;
    
    -- Inserir cliente
    INSERT INTO public.clients (
        consultant_id,
        full_name,
        email,
        phone,
        whatsapp,
        birth_date,
        address,
        source,
        marketing_consent,
        consent_date
    ) VALUES (
        p_consultant_id,
        p_full_name,
        p_email,
        p_phone,
        p_whatsapp,
        p_birth_date,
        p_address,
        p_source,
        p_marketing_consent,
        CASE WHEN p_marketing_consent THEN NOW() ELSE NULL END
    ) RETURNING id INTO v_client_id;
    
    -- Registrar consentimento se aplicável
    IF p_marketing_consent THEN
        INSERT INTO public.consent_records (
            client_id,
            consent_type,
            action,
            version,
            ip_address
        ) VALUES (
            v_client_id,
            'marketing',
            'granted',
            '1.0.0',
            inet_client_addr()
        );
    END IF;
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular resumo mensal de comissões
CREATE OR REPLACE FUNCTION public.get_monthly_commission_summary(
    p_consultant_id UUID,
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS TABLE (
    total_sales DECIMAL(10, 2),
    total_commission DECIMAL(10, 2),
    pending_commission DECIMAL(10, 2),
    paid_commission DECIMAL(10, 2),
    order_count INTEGER,
    client_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(cc.order_total), 0)::DECIMAL(10, 2) as total_sales,
        COALESCE(SUM(cc.commission_amount), 0)::DECIMAL(10, 2) as total_commission,
        COALESCE(SUM(CASE WHEN cc.status = 'pending' THEN cc.commission_amount ELSE 0 END), 0)::DECIMAL(10, 2) as pending_commission,
        COALESCE(SUM(CASE WHEN cc.status = 'paid' THEN cc.commission_amount ELSE 0 END), 0)::DECIMAL(10, 2) as paid_commission,
        COUNT(DISTINCT cc.order_id)::INTEGER as order_count,
        COUNT(DISTINCT cc.client_id)::INTEGER as client_count
    FROM public.consultant_commissions cc
    WHERE cc.consultant_id = p_consultant_id
    AND cc.reference_month = p_month
    AND cc.reference_year = p_year
    AND cc.status != 'cancelled';
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para aprovar e pagar comissões
CREATE OR REPLACE FUNCTION public.approve_commission(
    p_commission_id UUID,
    p_approved_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.consultant_commissions
    SET 
        status = 'approved',
        approved_at = NOW(),
        approved_by = COALESCE(p_approved_by, auth.uid())
    WHERE id = p_commission_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.pay_commission(
    p_commission_id UUID,
    p_payment_method TEXT,
    p_payment_reference TEXT DEFAULT NULL,
    p_paid_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_commission RECORD;
BEGIN
    -- Buscar comissão
    SELECT * INTO v_commission
    FROM public.consultant_commissions
    WHERE id = p_commission_id
    AND status = 'approved';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comissão não encontrada ou não está aprovada';
    END IF;
    
    -- Atualizar status
    UPDATE public.consultant_commissions
    SET 
        status = 'paid',
        paid_at = NOW(),
        paid_by = COALESCE(p_paid_by, auth.uid()),
        payment_method = p_payment_method,
        payment_reference = p_payment_reference
    WHERE id = p_commission_id;
    
    -- Atualizar total de comissões pagas da consultora
    UPDATE public.consultants
    SET total_commission_earned = total_commission_earned + v_commission.commission_amount
    WHERE id = v_commission.consultant_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para solicitar exclusão de dados (LGPD)
CREATE OR REPLACE FUNCTION public.request_data_deletion(
    p_consultant_id UUID,
    p_days_until_deletion INTEGER DEFAULT 30
) RETURNS DATE AS $$
DECLARE
    v_deletion_date DATE;
BEGIN
    v_deletion_date := CURRENT_DATE + p_days_until_deletion;
    
    UPDATE public.consultants
    SET 
        deletion_requested_at = NOW(),
        deletion_scheduled_for = v_deletion_date,
        status = 'inactive'
    WHERE id = p_consultant_id
    AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Consultora não encontrada ou sem permissão';
    END IF;
    
    -- Registrar solicitação
    INSERT INTO public.consent_records (
        consultant_id,
        consent_type,
        action,
        version,
        ip_address
    ) VALUES (
        p_consultant_id,
        'data_processing',
        'revoked',
        '1.0.0',
        inet_client_addr()
    );
    
    RETURN v_deletion_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para exportar dados pessoais (LGPD)
CREATE OR REPLACE FUNCTION public.export_personal_data(
    p_consultant_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_data JSONB;
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM public.consultants
        WHERE id = p_consultant_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para acessar estes dados';
    END IF;
    
    -- Coletar todos os dados
    SELECT jsonb_build_object(
        'consultant', row_to_json(c.*),
        'clients', (
            SELECT jsonb_agg(row_to_json(cl.*))
            FROM public.clients cl
            WHERE cl.consultant_id = c.id
        ),
        'commissions', (
            SELECT jsonb_agg(row_to_json(cc.*))
            FROM public.consultant_commissions cc
            WHERE cc.consultant_id = c.id
        ),
        'consent_records', (
            SELECT jsonb_agg(row_to_json(cr.*))
            FROM public.consent_records cr
            WHERE cr.consultant_id = c.id
        ),
        'orders', (
            SELECT jsonb_agg(row_to_json(o.*))
            FROM public.orders o
            WHERE o.consultant_id = c.id
        )
    ) INTO v_data
    FROM public.consultants c
    WHERE c.id = p_consultant_id;
    
    RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para dashboard de consultora
CREATE OR REPLACE FUNCTION public.get_consultant_dashboard(
    p_consultant_id UUID DEFAULT NULL
) RETURNS TABLE (
    consultant_id UUID,
    total_clients INTEGER,
    active_clients INTEGER,
    total_orders INTEGER,
    total_revenue DECIMAL(10, 2),
    total_commission_earned DECIMAL(10, 2),
    pending_commission DECIMAL(10, 2),
    current_month_revenue DECIMAL(10, 2),
    current_month_commission DECIMAL(10, 2),
    last_30_days_orders INTEGER,
    monthly_target DECIMAL(10, 2),
    monthly_target_progress DECIMAL(5, 2)
) AS $$
BEGIN
    -- Se não foi passado ID, usar o da consultora logada
    IF p_consultant_id IS NULL THEN
        SELECT id INTO p_consultant_id
        FROM public.consultants
        WHERE user_id = auth.uid();
    END IF;
    
    RETURN QUERY
    WITH stats AS (
        SELECT 
            c.id,
            c.monthly_target,
            COUNT(DISTINCT cl.id) as total_clients,
            COUNT(DISTINCT CASE WHEN cl.status = 'active' THEN cl.id END) as active_clients,
            COUNT(DISTINCT o.id) as total_orders,
            COALESCE(SUM(o.total), 0) as total_revenue,
            c.total_commission_earned,
            COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.id END) as last_30_days_orders
        FROM public.consultants c
        LEFT JOIN public.clients cl ON cl.consultant_id = c.id
        LEFT JOIN public.orders o ON o.consultant_id = c.id
        WHERE c.id = p_consultant_id
        GROUP BY c.id, c.monthly_target, c.total_commission_earned
    ),
    current_month AS (
        SELECT 
            consultant_id,
            COALESCE(SUM(order_total), 0) as month_revenue,
            COALESCE(SUM(commission_amount), 0) as month_commission,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) as pending
        FROM public.consultant_commissions
        WHERE consultant_id = p_consultant_id
        AND reference_month = EXTRACT(MONTH FROM CURRENT_DATE)
        AND reference_year = EXTRACT(YEAR FROM CURRENT_DATE)
        AND status != 'cancelled'
        GROUP BY consultant_id
    )
    SELECT 
        s.id,
        s.total_clients::INTEGER,
        s.active_clients::INTEGER,
        s.total_orders::INTEGER,
        s.total_revenue::DECIMAL(10, 2),
        s.total_commission_earned::DECIMAL(10, 2),
        COALESCE(cm.pending, 0)::DECIMAL(10, 2),
        COALESCE(cm.month_revenue, 0)::DECIMAL(10, 2),
        COALESCE(cm.month_commission, 0)::DECIMAL(10, 2),
        s.last_30_days_orders::INTEGER,
        s.monthly_target::DECIMAL(10, 2),
        CASE 
            WHEN s.monthly_target > 0 THEN 
                LEAST((COALESCE(cm.month_revenue, 0) / s.monthly_target * 100), 100)
            ELSE 0 
        END::DECIMAL(5, 2)
    FROM stats s
    LEFT JOIN current_month cm ON cm.consultant_id = s.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Scheduled job para processar exclusões (executar diariamente via cron)
-- Esta função deve ser chamada por um job agendado
CREATE OR REPLACE FUNCTION public.daily_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Processar exclusões agendadas
    PERFORM public.process_scheduled_deletions();
    
    -- Limpar OTPs expirados
    DELETE FROM public.otp_codes 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    -- Limpar sessões antigas de carrinho
    DELETE FROM public.carts
    WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Atualizar status de clientes inativos
    UPDATE public.clients
    SET status = 'inactive'
    WHERE status = 'active'
    AND last_purchase_date < CURRENT_DATE - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION public.register_consultant IS 'Registra uma nova consultora com todos os dados necessários e cria registros de consentimento LGPD';
COMMENT ON FUNCTION public.activate_consultant IS 'Ativa uma consultora pendente';
COMMENT ON FUNCTION public.add_client_to_consultant IS 'Adiciona um novo cliente vinculado a uma consultora';
COMMENT ON FUNCTION public.get_monthly_commission_summary IS 'Retorna resumo de comissões mensais de uma consultora';
COMMENT ON FUNCTION public.request_data_deletion IS 'Solicita exclusão de dados pessoais conforme LGPD';
COMMENT ON FUNCTION public.export_personal_data IS 'Exporta todos os dados pessoais de uma consultora (LGPD)';
COMMENT ON FUNCTION public.get_consultant_dashboard IS 'Retorna dados consolidados para dashboard da consultora';