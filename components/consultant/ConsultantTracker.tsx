"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ConsultantTrackingClient } from "@/lib/consultant-tracking-client"

export function ConsultantTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Detectar código de consultora na URL
    const refCode = searchParams?.get('ref')
    
    if (refCode) {
      console.log('[ConsultantTracker] Código detectado na URL:', refCode)
      
      // Salvar código no tracking
      ConsultantTrackingClient.set(refCode, 'url_parameter')
      
      // Também salvar em cookie para tracking server-side
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      document.cookie = `consultant_ref=${refCode.toUpperCase()}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
      
      // Log para analytics (se disponível)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'consultant_referral', {
          consultant_code: refCode.toUpperCase(),
          source: 'url_parameter'
        })
      }
    }
  }, [searchParams])

  // Este componente não renderiza nada
  return null
}