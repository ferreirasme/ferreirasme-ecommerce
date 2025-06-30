"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, ShoppingBag, TrendingUp, DollarSign, Package, ArrowUp, ArrowDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"
import { AdminDashboardChart } from "@/components/admin/AdminDashboardChart"
import { AdminRecentOrders } from "@/components/admin/AdminRecentOrders"
import { AdminTopConsultants } from "@/components/admin/AdminTopConsultants"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalRevenue: number
  revenueChange: number
  totalOrders: number
  ordersChange: number
  totalConsultants: number
  consultantsChange: number
  totalClients: number
  clientsChange: number
  totalCommissions: number
  commissionsChange: number
  totalProducts: number
  productsChange: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const supabase = createClient()
      
      // Buscar estatísticas gerais
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      // Total de vendas
      const { data: currentRevenue } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'completed')

      const { data: lastRevenue } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())
        .eq('status', 'completed')

      const totalRevenue = currentRevenue?.reduce((sum, order) => sum + order.total, 0) || 0
      const lastMonthRevenue = lastRevenue?.reduce((sum, order) => sum + order.total, 0) || 0
      const revenueChange = lastMonthRevenue > 0 
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      // Total de pedidos
      const { count: currentOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const { count: lastOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())

      const ordersChange = (lastOrders || 0) > 0 
        ? (((currentOrders || 0) - (lastOrders || 0)) / (lastOrders || 0)) * 100 
        : 0

      // Total de consultoras
      const { count: totalConsultants } = await supabase
        .from('consultants')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      const { count: newConsultants } = await supabase
        .from('consultants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const consultantsChange = (totalConsultants || 0) > 0 
        ? ((newConsultants || 0) / (totalConsultants || 0)) * 100 
        : 0

      // Total de clientes
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      const { count: newClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const clientsChange = (totalClients || 0) > 0 
        ? ((newClients || 0) / (totalClients || 0)) * 100 
        : 0

      // Total de comissões
      const { data: currentCommissions } = await supabase
        .from('consultant_commissions')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'approved')

      const totalCommissions = currentCommissions?.reduce((sum, comm) => sum + comm.amount, 0) || 0

      const { data: lastCommissions } = await supabase
        .from('consultant_commissions')
        .select('amount')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())
        .eq('status', 'approved')

      const lastMonthCommissions = lastCommissions?.reduce((sum, comm) => sum + comm.amount, 0) || 0
      const commissionsChange = lastMonthCommissions > 0 
        ? ((totalCommissions - lastMonthCommissions) / lastMonthCommissions) * 100 
        : 0

      // Total de produtos
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      const { count: newProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const productsChange = (totalProducts || 0) > 0 
        ? ((newProducts || 0) / (totalProducts || 0)) * 100 
        : 0

      setStats({
        totalRevenue,
        revenueChange,
        totalOrders: currentOrders || 0,
        ordersChange,
        totalConsultants: totalConsultants || 0,
        consultantsChange,
        totalClients: totalClients || 0,
        clientsChange,
        totalCommissions,
        commissionsChange,
        totalProducts: totalProducts || 0,
        productsChange
      })
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Receita Total",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total de Pedidos",
      value: stats?.totalOrders || 0,
      change: stats?.ordersChange || 0,
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Consultoras Ativas",
      value: stats?.totalConsultants || 0,
      change: stats?.consultantsChange || 0,
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Total de Clientes",
      value: stats?.totalClients || 0,
      change: stats?.clientsChange || 0,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Comissões Pagas",
      value: formatCurrency(stats?.totalCommissions || 0),
      change: stats?.commissionsChange || 0,
      icon: TrendingUp,
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      title: "Produtos Ativos",
      value: stats?.totalProducts || 0,
      change: stats?.productsChange || 0,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do seu e-commerce</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-[120px] mb-1" />
                <Skeleton className="h-4 w-[80px]" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => {
            const Icon = stat.icon
            const isPositive = stat.change > 0
            
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-full`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs">
                    {isPositive ? (
                      <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground ml-1">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Gráficos e tabelas */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminDashboardChart />
        </div>
        <div>
          <AdminTopConsultants />
        </div>
        <div className="lg:col-span-3">
          <AdminRecentOrders />
        </div>
      </div>
    </div>
  )
}