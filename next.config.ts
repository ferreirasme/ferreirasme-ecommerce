import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async headers() {
    // Disable security headers in development for easier testing
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV !== 'production' 
              ? `
                default-src 'self' http://localhost:* http://172.18.59.172:* http://192.168.131.99:* http://127.0.0.1:* http://0.0.0.0:*;
                script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com http://localhost:* http://172.18.59.172:* http://192.168.131.99:* http://127.0.0.1:* http://0.0.0.0:*;
                style-src 'self' 'unsafe-inline' http://localhost:* http://172.18.59.172:* http://192.168.131.99:* http://127.0.0.1:* http://0.0.0.0:*;
                img-src 'self' data: https: blob: http://localhost:* http://172.18.59.172:* http://192.168.131.99:* http://127.0.0.1:* http://0.0.0.0:*;
                font-src 'self' data: http://localhost:* http://172.18.59.172:* http://192.168.131.99:* http://127.0.0.1:* http://0.0.0.0:*;
                connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cttexpresso.pt https://viacep.com.br http://localhost:* http://172.18.59.172:* http://192.168.131.99:* http://127.0.0.1:* http://0.0.0.0:*;
                frame-src 'self' https://challenges.cloudflare.com https://checkout.stripe.com https://js.stripe.com;
                object-src 'none';
                base-uri 'self';
                form-action 'self';
                frame-ancestors 'none';
              `.replace(/\s{2,}/g, ' ').trim()
              : `
                default-src 'self';
                script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com;
                style-src 'self' 'unsafe-inline';
                img-src 'self' data: https: blob:;
                font-src 'self' data:;
                connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cttexpresso.pt https://viacep.com.br https://api.stripe.com;
                frame-src 'self' https://challenges.cloudflare.com https://checkout.stripe.com https://js.stripe.com;
                object-src 'none';
                base-uri 'self';
                form-action 'self';
                frame-ancestors 'none';
                upgrade-insecure-requests;
              `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
