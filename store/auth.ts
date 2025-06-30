import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { persist } from 'zustand/middleware'

// Tipos de usuário e roles
export type UserRole = 'admin' | 'manager' | 'consultant' | 'customer'

// Permissões por role
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'manage_users',
    'manage_consultants',
    'manage_products',
    'manage_orders',
    'view_reports',
    'manage_settings',
    'view_all_data',
    'export_data',
    'manage_commissions',
    'approve_commissions'
  ],
  manager: [
    'manage_consultants',
    'manage_products',
    'manage_orders',
    'view_reports',
    'view_all_data',
    'manage_commissions',
    'approve_commissions'
  ],
  consultant: [
    'view_own_clients',
    'manage_own_clients',
    'view_own_commissions',
    'view_own_reports',
    'create_orders_for_clients'
  ],
  customer: [
    'view_own_orders',
    'view_own_profile',
    'manage_own_profile',
    'create_orders'
  ]
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  metadata?: {
    consultant_id?: string
    first_login?: boolean
    two_factor_enabled?: boolean
    last_login?: string
    login_count?: number
  }
}

interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: UserProfile
}

interface AuthState {
  user: UserProfile | null
  session: AuthSession | null
  loading: boolean
  rememberMe: boolean
  consultantData: any | null
  
  // Actions
  setUser: (user: UserProfile | null) => void
  setSession: (session: AuthSession | null) => void
  setLoading: (loading: boolean) => void
  setRememberMe: (remember: boolean) => void
  setConsultantData: (data: any | null) => void
  
  // Auth methods
  signIn: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>
  signInAsConsultant: (code: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
  
  // Permission checks
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  isConsultant: () => boolean
  
  // Consultant specific
  loadConsultantData: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      rememberMe: false,
      consultantData: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setRememberMe: (rememberMe) => set({ rememberMe }),
      setConsultantData: (consultantData) => set({ consultantData }),

      signIn: async (email, password, remember = false) => {
        const supabase = createClient()
        set({ loading: true, rememberMe: remember })

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ loading: false })
            return { success: false, error: error.message }
          }

          if (!data.session || !data.user) {
            set({ loading: false })
            return { success: false, error: 'Falha ao criar sessão' }
          }

          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError || !profile) {
            set({ loading: false })
            return { success: false, error: 'Perfil não encontrado' }
          }

          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email!,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.metadata?.role || 'customer',
            metadata: profile.metadata
          }

          const authSession: AuthSession = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0,
            user: userProfile
          }

          set({ 
            user: userProfile, 
            session: authSession,
            loading: false 
          })

          // Registrar log de acesso
          await supabase.from('access_logs').insert({
            user_id: data.user.id,
            action: 'login',
            ip_address: window.location.hostname,
            user_agent: navigator.userAgent,
            metadata: { method: 'password' }
          })

          // Atualizar metadata do usuário
          await supabase
            .from('profiles')
            .update({
              metadata: {
                ...profile.metadata,
                last_login: new Date().toISOString(),
                login_count: (profile.metadata?.login_count || 0) + 1
              }
            })
            .eq('id', data.user.id)

          // Verificar se é primeiro login
          const requiresPasswordChange = profile.metadata?.first_login === true

          // Se for consultora, carregar dados adicionais
          if (userProfile.role === 'consultant' && userProfile.metadata?.consultant_id) {
            await get().loadConsultantData()
          }

          return { success: true, requiresPasswordChange }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: 'Erro ao fazer login' }
        }
      },

      signInAsConsultant: async (code, password, remember = false) => {
        const supabase = createClient()
        set({ loading: true, rememberMe: remember })

        try {
          // Primeiro, buscar a consultora pelo código
          const { data: consultant, error: consultantError } = await supabase
            .from('consultants')
            .select('*')
            .eq('code', code)
            .single()

          if (consultantError || !consultant) {
            set({ loading: false })
            return { success: false, error: 'Código de consultora inválido' }
          }

          // Fazer login com o email da consultora
          const { data, error } = await supabase.auth.signInWithPassword({
            email: consultant.email,
            password,
          })

          if (error) {
            set({ loading: false })
            return { success: false, error: error.message }
          }

          if (!data.session || !data.user) {
            set({ loading: false })
            return { success: false, error: 'Falha ao criar sessão' }
          }

          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError || !profile) {
            set({ loading: false })
            return { success: false, error: 'Perfil não encontrado' }
          }

          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email!,
            full_name: profile.full_name,
            phone: profile.phone,
            role: 'consultant',
            metadata: {
              ...profile.metadata,
              consultant_id: consultant.id
            }
          }

          const authSession: AuthSession = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0,
            user: userProfile
          }

          set({ 
            user: userProfile, 
            session: authSession,
            consultantData: consultant,
            loading: false 
          })

          // Registrar log de acesso
          await supabase.from('access_logs').insert({
            user_id: data.user.id,
            action: 'login',
            ip_address: window.location.hostname,
            user_agent: navigator.userAgent,
            metadata: { method: 'consultant_code', consultant_id: consultant.id }
          })

          // Atualizar metadata
          await supabase
            .from('profiles')
            .update({
              metadata: {
                ...profile.metadata,
                consultant_id: consultant.id,
                last_login: new Date().toISOString(),
                login_count: (profile.metadata?.login_count || 0) + 1
              }
            })
            .eq('id', data.user.id)

          // Verificar se é primeiro login
          const requiresPasswordChange = profile.metadata?.first_login === true || consultant.metadata?.requires_password_change === true

          return { success: true, requiresPasswordChange }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: 'Erro ao fazer login' }
        }
      },

      signOut: async () => {
        const supabase = createClient()
        const user = get().user

        if (user) {
          // Registrar log de logout
          await supabase.from('access_logs').insert({
            user_id: user.id,
            action: 'logout',
            ip_address: window.location.hostname,
            user_agent: navigator.userAgent
          })
        }

        await supabase.auth.signOut()
        set({ user: null, session: null, consultantData: null })
      },

      refreshSession: async () => {
        const supabase = createClient()
        const { data, error } = await supabase.auth.refreshSession()

        if (error || !data.session) {
          set({ user: null, session: null })
          return false
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user!.id)
          .single()

        if (profile) {
          const userProfile: UserProfile = {
            id: data.user!.id,
            email: data.user!.email!,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.metadata?.role || 'customer',
            metadata: profile.metadata
          }

          const authSession: AuthSession = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0,
            user: userProfile
          }

          set({ 
            user: userProfile, 
            session: authSession 
          })

          // Se for consultora, carregar dados adicionais
          if (userProfile.role === 'consultant' && userProfile.metadata?.consultant_id) {
            await get().loadConsultantData()
          }

          return true
        }

        return false
      },

      hasPermission: (permission) => {
        const user = get().user
        if (!user) return false

        const permissions = rolePermissions[user.role]
        return permissions.includes(permission)
      },

      hasRole: (role) => {
        const user = get().user
        if (!user) return false

        if (Array.isArray(role)) {
          return role.includes(user.role)
        }

        return user.role === role
      },

      isConsultant: () => {
        const user = get().user
        return user?.role === 'consultant'
      },

      loadConsultantData: async () => {
        const user = get().user
        if (!user || user.role !== 'consultant' || !user.metadata?.consultant_id) {
          return
        }

        const supabase = createClient()
        const { data, error } = await supabase
          .from('consultants')
          .select('*')
          .eq('id', user.metadata.consultant_id)
          .single()

        if (!error && data) {
          set({ consultantData: data })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        // Só persiste a sessão se rememberMe for true
        ...(state.rememberMe ? {
          user: state.user,
          session: state.session,
          consultantData: state.consultantData
        } : {})
      })
    }
  )
)

// Hook para inicializar a autenticação
export const useInitAuth = () => {
  const { setLoading, refreshSession, session } = useAuthStore()

  const initAuth = async () => {
    setLoading(true)
    
    // Verificar se a sessão ainda é válida
    if (session && session.expires_at > Date.now() / 1000) {
      setLoading(false)
      return
    }

    // Tentar renovar a sessão
    await refreshSession()
    setLoading(false)
  }

  return { initAuth }
}