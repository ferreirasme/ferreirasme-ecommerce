import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST CONSULTANTS API ===')
    
    const supabase = await createClient()
    
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', user ? `User: ${user.email}` : 'No user', authError?.message)
    
    if (!user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 })
    }
    
    // 2. Check if admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single()
    
    console.log('Admin check:', adminData ? 'Is admin' : 'Not admin', adminError?.message)
    
    if (!adminData) {
      return NextResponse.json({
        error: 'Not an admin',
        adminError: adminError?.message,
        userEmail: user.email
      }, { status: 403 })
    }
    
    // 3. Query consultants
    const { data: consultants, error: consultantsError, count } = await supabase
      .from('consultants')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('Consultants query:', {
      count,
      dataLength: consultants?.length,
      error: consultantsError?.message
    })
    
    if (consultantsError) {
      return NextResponse.json({
        error: 'Query failed',
        consultantsError: consultantsError.message,
        details: consultantsError
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        id: user.id
      },
      admin: {
        email: adminData.email,
        id: adminData.id
      },
      consultants: {
        total: count,
        data: consultants,
        returned: consultants?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}