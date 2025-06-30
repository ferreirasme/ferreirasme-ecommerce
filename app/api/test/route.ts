import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/security/auth-middleware'

export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Require admin authentication
  const authResult = await requireAdmin()
  if ('status' in authResult) return authResult

  try {
    const supabase = await createClient()
    
    // Test database connection
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      supabase: {
        connected: !catError && !prodError,
        categoriesCount: categories?.length || 0,
        productsCount: products?.length || 0,
        errors: {
          categories: catError?.message,
          products: prodError?.message
        }
      },
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
        supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
        supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing',
        resendKey: process.env.RESEND_API_KEY ? 'Configured' : 'Missing'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}