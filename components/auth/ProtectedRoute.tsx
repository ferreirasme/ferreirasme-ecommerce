'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  fallback = <LoadingFallback />
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && !user) {
      // Salvar a rota atual para redirecionar após o login
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname || '/')}`
      router.push(redirectUrl)
    }
  }, [user, loading, router, pathname, redirectTo])

  if (loading) {
    return fallback || <LoadingFallback />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}