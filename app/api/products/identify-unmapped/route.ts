import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get products without odoo_id
    const { data: unmappedProducts, error: unmappedError } = await supabase
      .from('products')
      .select('id, name, sku, created_at')
      .is('odoo_id', null)
      .order('created_at', { ascending: false })

    if (unmappedError) {
      throw unmappedError
    }

    // Get count of mapped products
    const { count: mappedCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)

    // Get total products count
    const { count: totalCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      unmapped: unmappedProducts || [],
      stats: {
        total: totalCount || 0,
        mapped: mappedCount || 0,
        unmapped: unmappedProducts?.length || 0,
        mappingPercentage: totalCount ? Math.round(((mappedCount || 0) / totalCount) * 100) : 0
      }
    })

  } catch (error: any) {
    console.error('Error identifying unmapped products:', error)
    return NextResponse.json(
      { error: error.message || 'Error identifying unmapped products' },
      { status: 500 }
    )
  }
}