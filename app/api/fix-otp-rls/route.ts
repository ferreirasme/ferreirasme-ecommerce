import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/auth-middleware'

export async function GET() {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  // Require admin authentication
  const authResult = await requireAdmin()
  if ('status' in authResult) {
    return authResult
  }

  return NextResponse.json({
    message: 'Para corrigir o erro de RLS na tabela otp_codes',
    solution: 'Execute o seguinte SQL no Supabase:',
    sql: `
-- Desabilitar RLS temporariamente para testes
ALTER TABLE public.otp_codes DISABLE ROW LEVEL SECURITY;

-- Ou criar políticas mais permissivas:
-- DROP POLICY IF EXISTS "Anyone can insert OTP" ON public.otp_codes;
-- DROP POLICY IF EXISTS "Users can view own OTP" ON public.otp_codes;
-- DROP POLICY IF EXISTS "Service can update OTP" ON public.otp_codes;

-- CREATE POLICY "Enable all for otp_codes" ON public.otp_codes
-- FOR ALL USING (true) WITH CHECK (true);
    `.trim(),
    instructions: [
      '1. Acesse o Supabase Dashboard',
      '2. Vá para SQL Editor',
      '3. Cole e execute o SQL acima',
      '4. Teste novamente o envio de OTP'
    ]
  })
}