import { NextRequest, NextResponse } from 'next/server'
import { checkIsAdmin } from '@/lib/security/check-admin'
const xmlrpc = require('xmlrpc')

export async function GET(request: NextRequest) {
  console.log('=== ODOO TEST CONNECTION START ===')
  
  // Check admin authentication
  const admin = await checkIsAdmin(request);
  console.log('Admin check result:', admin ? 'Admin authenticated' : 'Not admin')
  
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }
  
  try {
    const url = process.env.ODOO_URL!
    const db = process.env.ODOO_DB!
    const username = process.env.ODOO_USERNAME!
    const apiKey = process.env.ODOO_API_KEY!
    
    console.log('Environment variables check:', {
      url: url ? 'Set' : 'Missing',
      db: db ? 'Set' : 'Missing',
      username: username ? 'Set' : 'Missing',
      apiKey: apiKey ? 'Set' : 'Missing'
    })

    // Check required vars
    if (!url || !db || !username || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Odoo configuration'
      }, { status: 500 })
    }

    // Create XML-RPC client
    const common = xmlrpc.createClient({ 
      url: `${url}/xmlrpc/2/common`,
      headers: {
        'User-Agent': 'NodeJS XML-RPC Client',
        'Content-Type': 'text/xml'
      }
    })

    // Test authentication
    const uid = await new Promise<number>((resolve, reject) => {
      common.methodCall('authenticate', [db, username, apiKey, {}], (err: any, uid: number) => {
        if (err) reject(err)
        else resolve(uid)
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Odoo connection successful',
      uid,
      config: {
        url,
        db,
        username
      }
    })

  } catch (error: any) {
    console.error('Odoo connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection failed'
    }, { status: 500 })
  }
}