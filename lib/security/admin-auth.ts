import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'consultant'
  permissions: string[]
}

export async function checkAdminAuth(request: NextRequest): Promise<AdminUser | null> {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    // Check if user has admin or manager role
    const userRole = profile.metadata?.role || 'user'
    if (!['admin', 'manager', 'consultant'].includes(userRole)) {
      return null
    }

    // Get permissions based on role
    const permissions = getPermissionsByRole(userRole)

    return {
      id: session.user.id,
      email: session.user.email!,
      role: userRole,
      permissions
    }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return null
  }
}

function getPermissionsByRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'consultants.view',
      'consultants.create',
      'consultants.update',
      'consultants.delete',
      'clients.view',
      'clients.create',
      'clients.update',
      'clients.delete',
      'clients.import',
      'commissions.view',
      'commissions.approve',
      'commissions.pay',
      'commissions.cancel',
      'consent.view',
      'consent.manage',
      'audit.view',
      'settings.manage'
    ],
    manager: [
      'consultants.view',
      'consultants.create',
      'consultants.update',
      'clients.view',
      'clients.create',
      'clients.update',
      'clients.import',
      'commissions.view',
      'commissions.approve',
      'consent.view',
      'audit.view'
    ],
    consultant: [
      'consultants.view.own',
      'consultants.update.own',
      'clients.view.own',
      'clients.create.own',
      'clients.update.own',
      'commissions.view.own',
      'consent.view.own'
    ]
  }

  return rolePermissions[role] || []
}

export function hasPermission(user: AdminUser, permission: string): boolean {
  return user.permissions.includes(permission)
}

export function createAdminAuthMiddleware(requiredPermission?: string) {
  return async function middleware(request: NextRequest) {
    const user = await checkAdminAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Add user to request headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)
    requestHeaders.set('x-user-permissions', JSON.stringify(user.permissions))

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
}

// Helper to get user from headers in API routes
export function getUserFromHeaders(headers: Headers): AdminUser | null {
  const userId = headers.get('x-user-id')
  const userRole = headers.get('x-user-role')
  const permissions = headers.get('x-user-permissions')

  if (!userId || !userRole || !permissions) {
    return null
  }

  return {
    id: userId,
    email: '', // Not passed in headers for security
    role: userRole as AdminUser['role'],
    permissions: JSON.parse(permissions)
  }
}