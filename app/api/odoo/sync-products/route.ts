import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odoo/client';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/security/check-admin';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const admin = await checkIsAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }
  try {
    const { limit = 10, offset = 0 } = await request.json();
    
    // Conectar ao Odoo
    const odooClient = getOdooClient();
    const products = await odooClient.getProducts(limit, offset);

    // Conectar ao Supabase
    const supabase = await createClient();

    // Preparar produtos para inserção
    const productsToInsert = products.map(product => ({
      odoo_id: product.id,
      name: product.name,
      description: product.description_sale || '',
      price: product.list_price,
      stock_quantity: product.qty_available,
      sku: product.default_code || '',
      barcode: product.barcode || '',
      category_name: product.categ_id[1], // Nome da categoria
      images: product.image_1920 ? [{ url: `data:image/png;base64,${product.image_1920}` }] : [],
      attributes: {
        cost_price: product.standard_price,
        odoo_category_id: product.categ_id[0]
      }
    }));

    // Inserir ou atualizar produtos
    const { data, error } = await supabase
      .from('products_sync')
      .upsert(productsToInsert, {
        onConflict: 'odoo_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw error;
    }

    // Registrar log de sincronização
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'products',
        status: 'success',
        records_synced: data?.length || 0,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} produtos sincronizados`,
      products: data
    });

  } catch (error: any) {
    console.error('Erro ao sincronizar produtos:', error);

    // Registrar erro no log
    try {
      const supabase = await createClient();
      await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'products',
          status: 'error',
          error_message: error.message,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao sincronizar produtos',
      details: error.message
    }, { status: 500 });
  }
}