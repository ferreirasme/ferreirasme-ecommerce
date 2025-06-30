import { cookies } from 'next/headers'

const CONSULTANT_COOKIE_NAME = 'consultant_ref'
const CONSULTANT_STORAGE_KEY = 'consultant_code'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 dias em segundos

export interface ConsultantTracking {
  code: string
  timestamp: number
  source?: string
}

/**
 * Salva o código da consultora no cookie (server-side)
 */
export async function setConsultantCookie(code: string, source?: string) {
  const cookieStore = cookies()
  const tracking: ConsultantTracking = {
    code: code.toUpperCase(),
    timestamp: Date.now(),
    source
  }
  
  cookieStore.set(CONSULTANT_COOKIE_NAME, JSON.stringify(tracking), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  })
}

/**
 * Obtém o código da consultora do cookie (server-side)
 */
export async function getConsultantFromCookie(): Promise<ConsultantTracking | null> {
  const cookieStore = cookies()
  const cookie = cookieStore.get(CONSULTANT_COOKIE_NAME)
  
  if (!cookie) return null
  
  try {
    const tracking = JSON.parse(cookie.value) as ConsultantTracking
    // Verificar se o cookie não expirou (30 dias)
    const age = Date.now() - tracking.timestamp
    if (age > COOKIE_MAX_AGE * 1000) {
      return null
    }
    return tracking
  } catch {
    return null
  }
}

/**
 * Remove o cookie da consultora (server-side)
 */
export async function removeConsultantCookie() {
  const cookieStore = cookies()
  cookieStore.delete(CONSULTANT_COOKIE_NAME)
}

/**
 * Funções client-side para localStorage
 */
export const ConsultantTrackingClient = {
  /**
   * Salva o código da consultora no localStorage
   */
  set(code: string, source?: string) {
    if (typeof window === 'undefined') return
    
    const tracking: ConsultantTracking = {
      code: code.toUpperCase(),
      timestamp: Date.now(),
      source
    }
    
    localStorage.setItem(CONSULTANT_STORAGE_KEY, JSON.stringify(tracking))
  },
  
  /**
   * Obtém o código da consultora do localStorage
   */
  get(): ConsultantTracking | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem(CONSULTANT_STORAGE_KEY)
    if (!stored) return null
    
    try {
      const tracking = JSON.parse(stored) as ConsultantTracking
      // Verificar se não expirou (30 dias)
      const age = Date.now() - tracking.timestamp
      if (age > COOKIE_MAX_AGE * 1000) {
        this.remove()
        return null
      }
      return tracking
    } catch {
      return null
    }
  },
  
  /**
   * Remove o código da consultora do localStorage
   */
  remove() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(CONSULTANT_STORAGE_KEY)
  }
}

/**
 * Extrai código de consultora da URL
 */
export function extractConsultantCodeFromURL(url: string | URL): string | null {
  try {
    const urlObj = typeof url === 'string' ? new URL(url) : url
    const ref = urlObj.searchParams.get('ref')
    return ref ? ref.toUpperCase() : null
  } catch {
    return null
  }
}

/**
 * Gera URL com código de consultora
 */
export function generateConsultantURL(baseURL: string, consultantCode: string): string {
  try {
    const url = new URL(baseURL)
    url.searchParams.set('ref', consultantCode.toUpperCase())
    return url.toString()
  } catch {
    return baseURL
  }
}