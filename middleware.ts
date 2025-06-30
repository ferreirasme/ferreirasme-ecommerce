import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh session if expired - this extends the session automatically
  const { data: { session }, error } = await supabase.auth.getSession()

  // Protected routes configuration
  const protectedRoutes = {
    '/admin': ['admin', 'manager', 'consultant'],
    '/consultant': ['consultant'],
    '/conta': ['admin', 'manager', 'consultant', 'customer'],
    '/checkout': ['admin', 'manager', 'consultant', 'customer'],
  }

  // Check if the current path requires authentication
  const pathname = request.nextUrl.pathname
  const requiresAuth = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  )

  // Handle authentication for protected routes
  if (requiresAuth) {
    if (!session) {
      // No session, redirect to appropriate login page
      const isConsultantRoute = pathname.startsWith('/consultant')
      const loginUrl = isConsultantRoute ? '/consultant/login' : '/login'
      const redirectUrl = new URL(loginUrl, request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user needs to change password on first access
    if (session.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', session.user.id)
        .single()

      // Redirect to first access page if needed
      if (profile?.metadata?.first_login === true && pathname !== '/first-access') {
        return NextResponse.redirect(new URL('/first-access', request.url))
      }

      // Check role-based access
      const userRole = profile?.metadata?.role || 'customer'
      
      // Find the most specific route that matches
      let allowedRoles: string[] = []
      for (const [route, roles] of Object.entries(protectedRoutes)) {
        if (pathname.startsWith(route)) {
          allowedRoles = roles
        }
      }

      // Admin-specific route checks
      if (pathname.startsWith('/admin')) {
        if (!['admin', 'manager', 'consultant'].includes(userRole)) {
          return NextResponse.redirect(new URL('/', request.url))
        }

        // Consultant-specific restrictions within admin area
        if (userRole === 'consultant') {
          const consultantAllowedPaths = [
            '/admin/consultants/profile',
            '/admin/clients',
            '/admin/commissions'
          ]
          
          const isAllowed = consultantAllowedPaths.some(path => 
            pathname.startsWith(path)
          ) || pathname === '/admin'

          if (!isAllowed) {
            return NextResponse.redirect(new URL('/admin', request.url))
          }
        }
      }

      // Consultant-specific routes
      if (pathname.startsWith('/consultant') && userRole !== 'consultant') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  // Add security headers
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // CSP header with comprehensive security policies
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://api.cttexpresso.pt;
    frame-src 'self' https://js.stripe.com https://checkout.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://checkout.stripe.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  // Set security headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Add custom headers for auth state
  if (session) {
    response.headers.set('X-User-Role', session.user.user_metadata?.role || 'customer')
    response.headers.set('X-Session-Expires', new Date(session.expires_at! * 1000).toISOString())
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)',
  ],
}