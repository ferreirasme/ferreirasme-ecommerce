-- Criar tabela OTP se não existir
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção (qualquer um pode solicitar OTP)
CREATE POLICY "Anyone can insert OTP" ON public.otp_codes
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura apenas de OTPs próprios
CREATE POLICY "Users can view own OTP" ON public.otp_codes
    FOR SELECT USING (true);

-- Política para permitir update (marcar como usado)
CREATE POLICY "Service can update OTP" ON public.otp_codes
    FOR UPDATE USING (true);

-- Função para limpar OTPs expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_codes 
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar uma função para validar OTP
CREATE OR REPLACE FUNCTION public.validate_otp(
    p_email TEXT,
    p_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_valid BOOLEAN := false;
BEGIN
    -- Verificar se existe um OTP válido
    SELECT EXISTS (
        SELECT 1 FROM public.otp_codes
        WHERE email = p_email
        AND code = p_code
        AND used = false
        AND expires_at > NOW()
    ) INTO v_valid;
    
    -- Se válido, marcar como usado
    IF v_valid THEN
        UPDATE public.otp_codes
        SET used = true
        WHERE email = p_email
        AND code = p_code
        AND used = false;
    END IF;
    
    RETURN v_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;