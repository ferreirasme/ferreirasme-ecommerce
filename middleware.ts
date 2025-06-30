import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // For now, just pass through all requests
  return NextResponse.next();
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