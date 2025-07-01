import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This endpoint is for debugging environment variables
  // It should be removed or secured in production
  
  const envCheck = {
    odoo: {
      url: process.env.ODOO_URL ? 'Set' : 'Missing',
      db: process.env.ODOO_DB ? 'Set' : 'Missing',
      username: process.env.ODOO_USERNAME ? 'Set' : 'Missing',
      apiKey: process.env.ODOO_API_KEY ? 'Set' : 'Missing',
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    },
    app: {
      nodeEnv: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    }
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: envCheck,
    headers: {
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    }
  })
}