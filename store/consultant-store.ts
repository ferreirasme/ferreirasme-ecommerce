import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Consultant, Client, Commission, ConsentRecord, ConsultantDashboard } from '@/types/consultant'

interface ConsultantStore {
  // Current consultant data
  currentConsultant: Consultant | null
  setCurrentConsultant: (consultant: Consultant | null) => void
  
  // Clients
  clients: Client[]
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
  removeClient: (id: string) => void
  
  // Commissions
  commissions: Commission[]
  setCommissions: (commissions: Commission[]) => void
  addCommission: (commission: Commission) => void
  updateCommission: (id: string, data: Partial<Commission>) => void
  
  // Consents
  consents: ConsentRecord[]
  setConsents: (consents: ConsentRecord[]) => void
  addConsent: (consent: ConsentRecord) => void
  updateConsent: (id: string, data: Partial<ConsentRecord>) => void
  
  // Dashboard data
  dashboard: ConsultantDashboard | null
  setDashboard: (dashboard: ConsultantDashboard | null) => void
  
  // Utility functions
  clearAll: () => void
  getClientById: (id: string) => Client | undefined
  getCommissionsByStatus: (status: string) => Commission[]
  getTotalCommissions: () => number
  getActiveClients: () => Client[]
}

export const useConsultantStore = create<ConsultantStore>(
  persist(
    (set, get) => ({
      // Current consultant
      currentConsultant: null,
      setCurrentConsultant: (consultant) => set({ currentConsultant: consultant }),
      
      // Clients
      clients: [],
      addClient: (client) => set((state) => ({ 
        clients: [...state.clients, client] 
      })),
      updateClient: (id, data) => set((state) => ({
        clients: state.clients.map(client => 
          client.id === id ? { ...client, ...data, updatedAt: new Date().toISOString() } : client
        )
      })),
      removeClient: (id) => set((state) => ({
        clients: state.clients.filter(client => client.id !== id)
      })),
      
      // Commissions
      commissions: [],
      setCommissions: (commissions) => set({ commissions }),
      addCommission: (commission) => set((state) => ({
        commissions: [...state.commissions, commission]
      })),
      updateCommission: (id, data) => set((state) => ({
        commissions: state.commissions.map(commission =>
          commission.id === id ? { ...commission, ...data, updatedAt: new Date().toISOString() } : commission
        )
      })),
      
      // Consents
      consents: [],
      setConsents: (consents) => set({ consents }),
      addConsent: (consent) => set((state) => ({
        consents: [...state.consents, consent]
      })),
      updateConsent: (id, data) => set((state) => ({
        consents: state.consents.map(consent =>
          consent.id === id ? { ...consent, ...data, updatedAt: new Date().toISOString() } : consent
        )
      })),
      
      // Dashboard
      dashboard: null,
      setDashboard: (dashboard) => set({ dashboard }),
      
      // Utility functions
      clearAll: () => set({
        currentConsultant: null,
        clients: [],
        commissions: [],
        consents: [],
        dashboard: null
      }),
      
      getClientById: (id) => {
        const state = get()
        return state.clients.find(client => client.id === id)
      },
      
      getCommissionsByStatus: (status) => {
        const state = get()
        return state.commissions.filter(commission => commission.status === status)
      },
      
      getTotalCommissions: () => {
        const state = get()
        return state.commissions.reduce((total, commission) => {
          if (commission.status !== 'CANCELLED') {
            return total + commission.commissionAmount
          }
          return total
        }, 0)
      },
      
      getActiveClients: () => {
        const state = get()
        return state.clients.filter(client => client.status === 'ACTIVE')
      }
    }),
    {
      name: 'consultant-storage',
      partialize: (state) => ({
        currentConsultant: state.currentConsultant,
        clients: state.clients,
        dashboard: state.dashboard
      })
    }
  )
)