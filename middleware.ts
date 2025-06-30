import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Clonar a resposta
  const response = NextResponse.next()

  // Adicionar headers para permitir Stripe
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // CSP mais permissivo para permitir Stripe
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
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}