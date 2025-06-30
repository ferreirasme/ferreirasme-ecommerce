import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/security/auth-middleware'

export async function GET() {
  try {
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
    const supabase = await createClient()
    
    // Testar se a tabela já existe
    const { error: checkError } = await supabase
      .from('otp_codes')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Tabela otp_codes já existe!'
      })
    }
    
    // Se não existe, informar que precisa ser criada manualmente
    return NextResponse.json({
      success: false,
      message: 'Tabela otp_codes não existe.',
      instructions: [
        '1. Acesse o painel do Supabase',
        '2. Vá para SQL Editor',
        '3. Cole e execute o conteúdo do arquivo: /supabase/migrations/002_fix_otp_table.sql',
        '4. Ou execute o schema.sql completo se for a primeira vez'
      ],
      error: checkError.message
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao verificar banco de dados',
      error: error instanceof Error ? error.message : error
    })
  }
}