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

    // Get overall statistics
    const [
      totalProductsResult,
      mappedProductsResult,
      productsWithPhotosResult,
      recentSyncLogsResult
    ] = await Promise.all([
      // Total products
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }),
      
      // Products with odoo_id
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .not('odoo_id', 'is', null),
      
      // Products with photos
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .not('main_image_url', 'is', null),
      
      // Recent sync logs
      supabase
        .from('sync_logs')
        .select('*')
        .eq('sync_type', 'products')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const totalProducts = totalProductsResult.count || 0
    const mappedProducts = mappedProductsResult.count || 0
    const productsWithPhotos = productsWithPhotosResult.count || 0

    // Get products by status
    const { data: statusCounts } = await supabase
      .from('products')
      .select('status')
      .not('status', 'is', null)

    const statusBreakdown = statusCounts?.reduce((acc: any, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get products missing photos but with odoo_id (ready for photo import)
    const { count: readyForPhotoImport } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('odoo_id', 'is', null)
      .is('main_image_url', null)

    // Get recent admin logs for product imports
    const { data: recentImportLogs } = await supabase
      .from('admin_logs')
      .select('*')
      .in('action', [
        'IMPORT_PRODUCTS_FROM_ODOO',
        'MATCH_PRODUCTS_WITH_ODOO',
        'IMPORT_PRODUCT_PHOTOS_FROM_ODOO',
        'BATCH_IMPORT_PRODUCT_PHOTOS_FROM_ODOO'
      ])
      .order('created_at', { ascending: false })
      .limit(5)

    // Calculate progress percentages
    const mappingProgress = totalProducts > 0 ? Math.round((mappedProducts / totalProducts) * 100) : 0
    const photoProgress = totalProducts > 0 ? Math.round((productsWithPhotos / totalProducts) * 100) : 0
    const photoProgressOfMapped = mappedProducts > 0 ? Math.round((productsWithPhotos / mappedProducts) * 100) : 0

    return NextResponse.json({
      success: true,
      statistics: {
        total: totalProducts,
        mapped: mappedProducts,
        unmapped: totalProducts - mappedProducts,
        withPhotos: productsWithPhotos,
        withoutPhotos: totalProducts - productsWithPhotos,
        readyForPhotoImport: readyForPhotoImport || 0,
        statusBreakdown
      },
      progress: {
        mapping: {
          percentage: mappingProgress,
          label: `${mappedProducts} of ${totalProducts} products mapped to Odoo`
        },
        photos: {
          percentage: photoProgress,
          label: `${productsWithPhotos} of ${totalProducts} products have photos`
        },
        photosOfMapped: {
          percentage: photoProgressOfMapped,
          label: `${productsWithPhotos} of ${mappedProducts} mapped products have photos`
        }
      },
      recentSyncLogs: recentSyncLogsResult.data || [],
      recentImportLogs: recentImportLogs || [],
      recommendations: getRecommendations(totalProducts, mappedProducts, productsWithPhotos, readyForPhotoImport || 0)
    })

  } catch (error: any) {
    console.error('Error getting import status:', error)
    return NextResponse.json(
      { error: error.message || 'Error getting import status' },
      { status: 500 }
    )
  }
}

function getRecommendations(total: number, mapped: number, withPhotos: number, readyForPhotos: number): string[] {
  const recommendations: string[] = []

  if (mapped < total) {
    recommendations.push(`${total - mapped} products need to be matched with Odoo. Run the matching process.`)
  }

  if (readyForPhotos > 0) {
    recommendations.push(`${readyForPhotos} products are ready for photo import. Run the photo import process.`)
  }

  if (withPhotos < mapped && readyForPhotos === 0) {
    recommendations.push(`Some mapped products might not have photos in Odoo. Check Odoo for missing product images.`)
  }

  if (recommendations.length === 0) {
    recommendations.push('All products are properly mapped and have photos! 🎉')
  }

  return recommendations
}