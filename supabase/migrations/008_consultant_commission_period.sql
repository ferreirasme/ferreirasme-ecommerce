-- Adicionar campo commission_period_days na tabela consultants
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS commission_period_days INTEGER DEFAULT 45;

-- Comentário explicativo
COMMENT ON COLUMN consultants.commission_period_days IS 'Período em dias para cálculo e pagamento de comissões (padrão: 45 dias)';

-- Atualizar consultoras existentes para 45 dias
UPDATE consultants 
SET commission_period_days = 45 
WHERE commission_period_days IS NULL;