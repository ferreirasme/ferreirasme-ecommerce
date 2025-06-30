-- Função para incrementar os ganhos de uma consultora
CREATE OR REPLACE FUNCTION public.increment_consultant_earnings(
    consultant_id UUID,
    amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.consultants
    SET total_commission_earned = total_commission_earned + amount
    WHERE id = consultant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_consultant_earnings TO authenticated;