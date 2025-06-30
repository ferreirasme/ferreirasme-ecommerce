import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Define protected routes
const protectedRoutes = [
  '/conta',
  '/checkout',
  '/api/shipping/create',
  '/api/test', // Should be removed in production
  '/api/setup-db', // Should be removed in production
  '/api/fix-otp-rls', // Should be removed in production
  '/api/test-email', // Should be removed in production
];

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/api/admin',
];

// Routes that should be removed in production
const debugRoutes = [
  '/api/test',
  '/api/setup-db',
  '/api/fix-otp-rls',
  '/api/test-email',
  '/test-ctt',
  '/test-results',
  '/test-supabase',
  '/teste',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Block debug routes in production
  if (process.env.NODE_ENV === 'production' && debugRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured');
    return NextResponse.next();
  }

  // Create response first
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin access
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
  }

  return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};