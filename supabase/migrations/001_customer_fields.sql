-- Adicionar campos de cliente à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', 'O'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Criar tabela de endereços
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('shipping', 'billing', 'both')) DEFAULT 'both',
    name TEXT NOT NULL,
    street_address TEXT NOT NULL,
    street_number TEXT,
    floor TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT,
    country TEXT DEFAULT 'PT' NOT NULL,
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_profiles_nif ON public.profiles(nif);

-- Enable RLS para addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para addresses
CREATE POLICY "Users can view own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at em addresses
CREATE TRIGGER handle_addresses_updated_at BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para garantir apenas um endereço padrão por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.addresses
        SET is_default = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para endereço padrão único
CREATE TRIGGER ensure_single_default_address_trigger
    BEFORE INSERT OR UPDATE OF is_default ON public.addresses
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION public.ensure_single_default_address();