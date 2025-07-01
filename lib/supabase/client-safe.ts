import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Verificar se estamos no browser
  if (typeof window === 'undefined') {
    throw new Error('createClient só pode ser usado no browser')
  }

  // Usar singleton para evitar múltiplas instâncias
  if (clientInstance) {
    return clientInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Variáveis de ambiente Supabase não configuradas')
    throw new Error('Supabase não configurado')
  }

  try {
    clientInstance = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-client-info': 'ferreirasme-ecommerce'
        }
      }
    })

    return clientInstance
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error)
    throw error
  }
}