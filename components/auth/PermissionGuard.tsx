'use client'

import { useAuthStore } from '@/store/auth'

interface PermissionGuardProps {
  children: React.ReactNode
  permission: string | string[]
  fallback?: React.ReactNode
}

export function PermissionGuard({ 
  children, 
  permission,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission } = useAuthStore()

  const hasRequiredPermission = Array.isArray(permission)
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission)

  if (!hasRequiredPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}