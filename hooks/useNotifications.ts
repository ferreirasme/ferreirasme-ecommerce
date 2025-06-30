import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useNotificationStore, notificationHelpers } from '@/store/notifications'
import { useConsultantStore } from '@/store/consultant-store'

export function useNotifications() {
  const supabase = createClientComponentClient()
  const { currentConsultant } = useConsultantStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!currentConsultant) return

    // Subscribe to commission changes
    const commissionChannel = supabase
      .channel('commission-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultant_commissions',
          filter: `consultant_id=eq.${currentConsultant.id}`,
        },
        (payload) => {
          const commission = payload.new
          addNotification(
            notificationHelpers.newCommission(
              commission.order_number,
              commission.commission_amount
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultant_commissions',
          filter: `consultant_id=eq.${currentConsultant.id}`,
        },
        (payload) => {
          const commission = payload.new
          const oldCommission = payload.old

          // Check if status changed to paid
          if (oldCommission.status !== 'paid' && commission.status === 'paid') {
            addNotification(
              notificationHelpers.paymentApproved(commission.commission_amount)
            )
          }
        }
      )
      .subscribe()

    // Subscribe to new clients
    const clientChannel = supabase
      .channel('client-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients',
          filter: `consultant_id=eq.${currentConsultant.id}`,
        },
        (payload) => {
          const client = payload.new
          addNotification(
            notificationHelpers.newClient(client.full_name)
          )
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(commissionChannel)
      supabase.removeChannel(clientChannel)
    }
  }, [currentConsultant, supabase, addNotification])

  return useNotificationStore()
}