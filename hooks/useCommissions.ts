import { useState, useEffect, useCallback, useMemo } from 'react'
import { Commission, CommissionFilter, CommissionStatus } from '@/types/consultant'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/use-toast'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface UseCommissionsReturn {
  commissions: Commission[]
  isLoading: boolean
  error: Error | null
  filters: CommissionFilter
  setFilters: (filters: CommissionFilter) => void
  fetchCommissions: (consultantId: string) => Promise<void>
  exportCommissions: () => Promise<void>
  getMonthlyStats: () => MonthlyStats[]
  getTotalsByStatus: () => StatusTotals
}

interface MonthlyStats {
  month: string
  total: number
  count: number
}

interface StatusTotals {
  [CommissionStatus.PENDING]: number
  [CommissionStatus.APPROVED]: number
  [CommissionStatus.PAID]: number
  [CommissionStatus.CANCELLED]: number
}

export function useCommissions(): UseCommissionsReturn {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<CommissionFilter>({})
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Fetch commissions with filters
  const fetchCommissions = useCallback(async (consultantId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      
      // Add filters to query params
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.clientId) queryParams.append('clientId', filters.clientId)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount.toString())
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString())
      
      // Simulate API call
      const response = await fetch(
        `/api/consultants/${consultantId}/commissions?${queryParams.toString()}`,
        {
          headers: {
            // 'Authorization': `Bearer ${user?.token}`, // Token removed from UserProfile
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch commissions')
      }
      
      const data = await response.json()
      setCommissions(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as comissões',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, user, toast])

  // Export commissions to CSV
  const exportCommissions = useCallback(async () => {
    try {
      const csvData = [
        ['Pedido', 'Cliente', 'Data', 'Valor do Pedido', 'Taxa', 'Comissão', 'Status'],
        ...commissions.map(commission => [
          commission.orderDetails.orderNumber,
          commission.orderDetails.customerName,
          new Date(commission.orderDate).toLocaleDateString('pt-PT'),
          commission.orderAmount.toFixed(2),
          `${commission.commissionRate}%`,
          commission.commissionAmount.toFixed(2),
          commission.status
        ])
      ]
      
      const csv = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `comissoes_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Sucesso',
        description: 'Comissões exportadas com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar as comissões',
        variant: 'destructive'
      })
    }
  }, [commissions, toast])

  // Calculate monthly statistics
  const getMonthlyStats = useCallback((): MonthlyStats[] => {
    const stats: { [key: string]: { total: number; count: number } } = {}
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i)
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        key: date.toISOString().substring(0, 7) // YYYY-MM format
      }
    }).reverse()
    
    // Initialize stats for last 6 months
    last6Months.forEach(({ key }) => {
      stats[key] = { total: 0, count: 0 }
    })
    
    // Calculate stats from commissions
    commissions
      .filter(c => c.status !== CommissionStatus.CANCELLED)
      .forEach(commission => {
        const monthKey = commission.orderDate.substring(0, 7)
        if (stats[monthKey]) {
          stats[monthKey].total += commission.commissionAmount
          stats[monthKey].count += 1
        }
      })
    
    return Object.entries(stats).map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count
    }))
  }, [commissions])

  // Calculate totals by status
  const getTotalsByStatus = useCallback((): StatusTotals => {
    const totals: StatusTotals = {
      [CommissionStatus.PENDING]: 0,
      [CommissionStatus.APPROVED]: 0,
      [CommissionStatus.PAID]: 0,
      [CommissionStatus.CANCELLED]: 0
    }
    
    commissions.forEach(commission => {
      totals[commission.status] += commission.commissionAmount
    })
    
    return totals
  }, [commissions])

  // Mock data for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && commissions.length === 0) {
      const mockCommissions: Commission[] = [
        {
          id: '1',
          consultantId: '1',
          orderId: 'order1',
          clientId: 'client1',
          status: CommissionStatus.PAID,
          orderAmount: 150.00,
          commissionRate: 10,
          commissionAmount: 15.00,
          orderDate: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
          orderDetails: {
            orderNumber: '2024001',
            customerName: 'Ana Santos',
            items: [
              { name: 'Colar Prata', quantity: 1, price: 80.00 },
              { name: 'Brincos Cristal', quantity: 1, price: 70.00 }
            ]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          consultantId: '1',
          orderId: 'order2',
          clientId: 'client2',
          status: CommissionStatus.APPROVED,
          orderAmount: 200.00,
          commissionRate: 10,
          commissionAmount: 20.00,
          orderDate: subMonths(new Date(), 1).toISOString(),
          approvalDate: new Date().toISOString(),
          orderDetails: {
            orderNumber: '2024002',
            customerName: 'João Pereira',
            items: [
              { name: 'Pulseira Dourada', quantity: 2, price: 100.00 }
            ]
          },
          createdAt: subMonths(new Date(), 1).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          consultantId: '1',
          orderId: 'order3',
          clientId: 'client3',
          status: CommissionStatus.PENDING,
          orderAmount: 300.00,
          commissionRate: 10,
          commissionAmount: 30.00,
          orderDate: new Date().toISOString(),
          orderDetails: {
            orderNumber: '2024003',
            customerName: 'Maria Oliveira',
            items: [
              { name: 'Conjunto Completo', quantity: 1, price: 300.00 }
            ]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      setTimeout(() => {
        setCommissions(mockCommissions)
      }, 1000)
    }
  }, [commissions.length])

  return {
    commissions,
    isLoading,
    error,
    filters,
    setFilters,
    fetchCommissions,
    exportCommissions,
    getMonthlyStats,
    getTotalsByStatus
  }
}