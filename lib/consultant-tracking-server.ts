import { cookies } from 'next/headers'

const CONSULTANT_COOKIE_NAME = 'consultant_ref'
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
  const cookieStore = await cookies()
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
  const cookieStore = await cookies()
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
  const cookieStore = await cookies()
  cookieStore.delete(CONSULTANT_COOKIE_NAME)
}