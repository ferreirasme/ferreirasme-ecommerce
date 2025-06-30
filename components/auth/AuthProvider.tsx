'use client'

import { useEffect } from 'react'
import { useInitAuth } from '@/store/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initAuth } = useInitAuth()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return <>{children}</>
}