'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, UserRole } from '@/store/auth'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole | UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  allowedRoles,
  redirectTo = '/',
  fallback = <UnauthorizedFallback />
}: RoleGuardProps) {
  const router = useRouter()
  const { user, loading, hasRole } = useAuthStore()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!hasRole(allowedRoles)) {
        router.push(redirectTo)
      }
    }
  }, [user, loading, hasRole, allowedRoles, router, redirectTo])

  if (loading) {
    return null
  }

  if (!user || !hasRole(allowedRoles)) {
    return fallback || <UnauthorizedFallback />
  }

  return <>{children}</>
}

function UnauthorizedFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    </div>
  )
}