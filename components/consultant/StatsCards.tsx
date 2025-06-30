'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Euro, 
  TrendingUp, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface StatsData {
  totalClients: number
  clientsGrowth: number
  totalCommissions: number
  commissionsGrowth: number
  pendingCommissions: number
  totalSales: number
  salesGrowth: number
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalClients: 0,
    clientsGrowth: 0,
    totalCommissions: 0,
    commissionsGrowth: 0,
    pendingCommissions: 0,
    totalSales: 0,
    salesGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Buscar total de clientes
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .eq('consultant_id', user.id)

        // Buscar comissões
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount, status')
          .eq('consultant_id', user.id)

        const totalCommissions = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0
        const pendingCommissions = commissions?.filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + c.amount, 0) || 0

        // Buscar total de vendas
        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .eq('consultant_id', user.id)

        const totalSales = orders?.reduce((sum, o) => sum + o.total, 0) || 0

        // Calcular crescimento (mock - em produção, comparar com período anterior)
        const mockGrowth = () => Math.floor(Math.random() * 30) - 10

        setStats({
          totalClients: clientsCount || 0,
          clientsGrowth: mockGrowth(),
          totalCommissions,
          commissionsGrowth: mockGrowth(),
          pendingCommissions,
          totalSales,
          salesGrowth: mockGrowth()
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatGrowth = (value: number) => {
    const isPositive = value > 0
    return (
      <span className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value)}%
      </span>
    )
  }

  const statsCards = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients.toString(),
      growth: stats.clientsGrowth,
      icon: Users,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Comissões Totais',
      value: formatCurrency(stats.totalCommissions),
      growth: stats.commissionsGrowth,
      icon: Euro,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Comissões Pendentes',
      value: formatCurrency(stats.pendingCommissions),
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Vendas Totais',
      value: formatCurrency(stats.totalSales),
      growth: stats.salesGrowth,
      icon: ShoppingBag,
      color: 'text-purple-600 bg-purple-50'
    }
  ]

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon
        
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.growth !== undefined && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatGrowth(stat.growth)} em relação ao mês anterior
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}