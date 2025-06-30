'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Skeleton } from '@/components/ui/skeleton'

interface ConsultantGuardProps {
  children: React.ReactNode
  requireActive?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ConsultantGuard({ 
  children, 
  requireActive = true,
  redirectTo = '/consultant/login',
  fallback = <LoadingFallback />
}: ConsultantGuardProps) {
  const router = useRouter()
  const { user, consultantData, loading, isConsultant } = useAuthStore()

  useEffect(() => {
    if (!loading) {
      if (!user || !isConsultant()) {
        router.push(redirectTo)
      } else if (requireActive && consultantData?.status !== 'ACTIVE') {
        router.push('/consultant/suspended')
      }
    }
  }, [user, consultantData, loading, isConsultant, requireActive, router, redirectTo])

  if (loading) {
    return fallback || <LoadingFallback />
  }

  if (!user || !isConsultant()) {
    return null
  }

  if (requireActive && consultantData?.status !== 'ACTIVE') {
    return <SuspendedFallback />
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

function SuspendedFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Conta Suspensa</h1>
        <p className="text-muted-foreground mb-4">
          Sua conta de consultora está temporariamente suspensa. 
          Entre em contato com o suporte para mais informações.
        </p>
        <a 
          href="mailto:suporte@ferreirasme.com" 
          className="text-primary hover:underline"
        >
          suporte@ferreirasme.com
        </a>
      </div>
    </div>
  )
}