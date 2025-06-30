'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProviderFixed({ children }: AuthProviderProps) {
  const initialized = useRef(false)
  const { setLoading, refreshSession, session } = useAuthStore()

  useEffect(() => {
    // Prevenir múltiplas inicializações
    if (initialized.current) return
    initialized.current = true

    const initAuth = async () => {
      console.log('AuthProvider: Iniciando autenticação...')
      setLoading(true)
      
      try {
        // Verificar se a sessão ainda é válida
        if (session && session.expires_at > Date.now() / 1000) {
          console.log('AuthProvider: Sessão válida encontrada')
          setLoading(false)
          return
        }

        // Tentar renovar a sessão
        console.log('AuthProvider: Tentando renovar sessão...')
        await refreshSession()
      } catch (error) {
        console.error('AuthProvider: Erro ao inicializar auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, []) // Sem dependências para executar apenas uma vez

  return <>{children}</>
}