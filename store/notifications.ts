import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 
  | 'commission' 
  | 'payment' 
  | 'client' 
  | 'info' 
  | 'warning' 
  | 'success'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
  metadata?: Record<string, any>
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  
  // Getters
  getUnreadNotifications: () => Notification[]
  getNotificationsByType: (type: NotificationType) => Notification[]
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      },
      
      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          if (!notification || notification.read) return state
          
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        })
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },
      
      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          const wasUnread = notification && !notification.read
          
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          }
        })
      },
      
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
      },
      
      getUnreadNotifications: () => {
        const state = get()
        return state.notifications.filter((n) => !n.read)
      },
      
      getNotificationsByType: (type) => {
        const state = get()
        return state.notifications.filter((n) => n.type === type)
      },
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Limitar a 50 notificações
      }),
    }
  )
)

// Helper para criar notificações de diferentes tipos
export const notificationHelpers = {
  newCommission: (orderNumber: string, amount: number) => ({
    type: 'commission' as NotificationType,
    title: 'Nova Comissão',
    message: `Comissão de €${amount.toFixed(2)} registrada para o pedido #${orderNumber}`,
    link: '/consultant/dashboard',
  }),
  
  paymentApproved: (amount: number) => ({
    type: 'payment' as NotificationType,
    title: 'Pagamento Aprovado',
    message: `Pagamento de €${amount.toFixed(2)} foi aprovado e será processado em breve`,
    link: '/consultant/dashboard',
  }),
  
  newClient: (clientName: string) => ({
    type: 'client' as NotificationType,
    title: 'Nova Cliente',
    message: `${clientName} foi vinculada à sua conta`,
    link: '/consultant/dashboard',
  }),
  
  info: (title: string, message: string) => ({
    type: 'info' as NotificationType,
    title,
    message,
  }),
  
  warning: (title: string, message: string) => ({
    type: 'warning' as NotificationType,
    title,
    message,
  }),
  
  success: (title: string, message: string) => ({
    type: 'success' as NotificationType,
    title,
    message,
  }),
}