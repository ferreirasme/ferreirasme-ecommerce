const CONSULTANT_STORAGE_KEY = 'consultant_code'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 dias em segundos

export interface ConsultantTracking {
  code: string
  timestamp: number
  source?: string
}

/**
 * Funções client-side para localStorage e cookies
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
    
    // Também salvar em cookie do lado do cliente
    const expires = new Date()
    expires.setTime(expires.getTime() + (COOKIE_MAX_AGE * 1000))
    document.cookie = `consultant_ref=${JSON.stringify(tracking)};expires=${expires.toUTCString()};path=/`
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
    // Remover cookie também
    document.cookie = 'consultant_ref=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
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