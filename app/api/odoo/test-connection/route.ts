import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';
import { checkIsAdmin } from '@/lib/security/check-admin';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const admin = await checkIsAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }
  try {
    // Verificar se as variáveis estão configuradas
    const requiredVars = ['ODOO_URL', 'ODOO_DB', 'ODOO_USERNAME', 'ODOO_API_KEY'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente faltando',
        missing: missingVars
      }, { status: 500 });
    }

    // Tentar conectar
    const client = getOdooClient();
    await client.connect();

    // Buscar algumas categorias para testar
    const categories = await client.getCategories();

    return NextResponse.json({
      success: true,
      message: 'Conexão com Odoo estabelecida com sucesso',
      data: {
        url: process.env.ODOO_URL,
        db: process.env.ODOO_DB,
        categoriesCount: categories.length,
        sampleCategories: categories.slice(0, 5)
      }
    });

  } catch (error: any) {
    console.error('Erro ao conectar com Odoo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao conectar com Odoo',
      details: error.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}