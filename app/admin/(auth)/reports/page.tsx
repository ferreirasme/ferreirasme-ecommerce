"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths } from "date-fns"
import { pt } from "date-fns/locale"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  Package,
  Euro,
  ShoppingCart,
  Award,
  Activity
} from "lucide-react"

interface DateRange {
  from: Date
  to: Date
}

interface SalesData {
  date: string
  revenue: number
  orders: number
  average_order: number
}

interface ProductData {
  name: string
  sales: number
  revenue: number
  quantity: number
}

interface ConsultantData {
  name: string
  sales: number
  commission: number
  orders: number
}

interface CategoryData {
  name: string
  value: number
  percentage: number
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("sales")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  
  // Data states
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [consultantData, setConsultantData] = useState<ConsultantData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    average_order_value: 0,
    total_customers: 0,
    total_products_sold: 0,
    conversion_rate: 0
  })

  const supabase = createClient()

  useEffect(() => {
    handlePeriodChange(selectedPeriod)
  }, [])

  useEffect(() => {
    loadReportData()
  }, [dateRange, activeTab])

  const handlePeriodChange = (period: string) => {
    const now = new Date()
    let from: Date, to: Date

    switch (period) {
      case "today":
        from = new Date(now.setHours(0, 0, 0, 0))
        to = new Date(now.setHours(23, 59, 59, 999))
        break
      case "week":
        from = subDays(now, 7)
        to = now
        break
      case "month":
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case "quarter":
        from = subMonths(now, 3)
        to = now
        break
      case "year":
        from = startOfYear(now)
        to = endOfYear(now)
        break
      default:
        return
    }

    setSelectedPeriod(period)
    setDateRange({ from, to })
  }

  const loadReportData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case "sales":
          await loadSalesReport()
          break
        case "products":
          await loadProductsReport()
          break
        case "consultants":
          await loadConsultantsReport()
          break
        case "customers":
          await loadCustomersReport()
          break
      }
    } catch (error: any) {
      console.error('Error loading report data:', error)
      toast.error('Erro ao carregar dados do relatório')
    } finally {
      setLoading(false)
    }
  }

  const loadSalesReport = async () => {
    // Load orders within date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .eq('status', 'completed')

    if (error) throw error

    // Group by date
    const groupedData: { [key: string]: SalesData } = {}
    
    orders?.forEach(order => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd')
      if (!groupedData[date]) {
        groupedData[date] = {
          date,
          revenue: 0,
          orders: 0,
          average_order: 0
        }
      }
      groupedData[date].revenue += order.total_amount
      groupedData[date].orders += 1
    })

    // Calculate averages and convert to array
    const salesArray = Object.values(groupedData).map(day => ({
      ...day,
      average_order: day.revenue / day.orders
    })).sort((a, b) => a.date.localeCompare(b.date))

    setSalesData(salesArray)

    // Calculate stats
    const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    const totalOrders = orders?.length || 0
    
    setStats(prev => ({
      ...prev,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0
    }))

    // Load category breakdown
    const { data: categoryBreakdown } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        product:products(
          category_id,
          categories(name)
        )
      `)
      .in('order_id', orders?.map(o => o.id) || [])

    // Process category data
    const categoryTotals: { [key: string]: number } = {}
    let totalCategoryRevenue = 0

    categoryBreakdown?.forEach(item => {
      const categoryName = (item as any).product?.[0]?.categories?.name || 'Sem categoria'
      const revenue = item.quantity * item.unit_price
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + revenue
      totalCategoryRevenue += revenue
    })

    const categoryArray = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalCategoryRevenue) * 100
    }))

    setCategoryData(categoryArray)
  }

  const loadProductsReport = async () => {
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .eq('status', 'completed')

    const orderIds = orders?.map(o => o.id) || []

    const { data: items, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        total_price,
        product:products(
          id,
          name,
          sku
        )
      `)
      .in('order_id', orderIds)

    if (error) throw error

    // Group by product
    const productMap: { [key: string]: ProductData } = {}

    items?.forEach(item => {
      const productId = (item as any).product?.[0]?.id
      if (!productId) return

      if (!productMap[productId]) {
        productMap[productId] = {
          name: (item as any).product?.[0]?.name || 'Unknown',
          sales: 0,
          revenue: 0,
          quantity: 0
        }
      }

      productMap[productId].sales += 1
      productMap[productId].revenue += item.total_price
      productMap[productId].quantity += item.quantity
    })

    const productArray = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20) // Top 20 products

    setProductData(productArray)
  }

  const loadConsultantsReport = async () => {
    const { data: commissions, error } = await supabase
      .from('consultant_commissions')
      .select(`
        *,
        consultant:consultants(
          full_name,
          code
        ),
        order:orders(
          total_amount
        )
      `)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())

    if (error) throw error

    // Group by consultant
    const consultantMap: { [key: string]: ConsultantData } = {}

    commissions?.forEach(commission => {
      const consultantId = commission.consultant_id
      if (!consultantMap[consultantId]) {
        consultantMap[consultantId] = {
          name: commission.consultant?.full_name || 'Unknown',
          sales: 0,
          commission: 0,
          orders: 0
        }
      }

      consultantMap[consultantId].sales += commission.order?.total_amount || 0
      consultantMap[consultantId].commission += commission.commission_amount
      consultantMap[consultantId].orders += 1
    })

    const consultantArray = Object.values(consultantMap)
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 20) // Top 20 consultants

    setConsultantData(consultantArray)
  }

  const loadCustomersReport = async () => {
    // For now, just update stats
    const { count: totalCustomers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')

    setStats(prev => ({
      ...prev,
      total_customers: totalCustomers || 0
    }))
  }

  const exportReport = async () => {
    try {
      let csvContent = ''
      let filename = ''

      switch (activeTab) {
        case "sales":
          csvContent = [
            ['Data', 'Receita', 'Pedidos', 'Ticket Médio'].join(','),
            ...salesData.map(row => [
              format(new Date(row.date), 'dd/MM/yyyy'),
              row.revenue.toFixed(2),
              row.orders,
              row.average_order.toFixed(2)
            ].join(','))
          ].join('\n')
          filename = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`
          break
          
        case "products":
          csvContent = [
            ['Produto', 'Vendas', 'Receita', 'Quantidade'].join(','),
            ...productData.map(row => [
              row.name,
              row.sales,
              row.revenue.toFixed(2),
              row.quantity
            ].join(','))
          ].join('\n')
          filename = `relatorio-produtos-${format(new Date(), 'yyyy-MM-dd')}.csv`
          break
          
        case "consultants":
          csvContent = [
            ['Consultora', 'Vendas', 'Comissão', 'Pedidos'].join(','),
            ...consultantData.map(row => [
              row.name,
              row.sales.toFixed(2),
              row.commission.toFixed(2),
              row.orders
            ].join(','))
          ].join('\n')
          filename = `relatorio-consultoras-${format(new Date(), 'yyyy-MM-dd')}.csv`
          break
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Análise detalhada do desempenho da loja
          </p>
        </div>
        <Button onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(dateRange.from, "dd 'de' MMMM", { locale: pt })} - {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
              </div>
              <Euro className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold">{stats.total_orders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.average_order_value)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{stats.total_customers}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos Vendidos</p>
                <p className="text-2xl font-bold">{stats.total_products_sold}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="consultants">Consultoras</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Vendas</CardTitle>
              <CardDescription>
                Receita e número de pedidos ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p>Carregando dados...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
                      formatter={(value: any, name: string) => {
                        if (name === 'Receita') return formatCurrency(value)
                        return value
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      name="Receita"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#82ca9d" 
                      name="Pedidos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendas por Categoria</CardTitle>
              <CardDescription>
                Distribuição de receita por categoria de produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p>Carregando dados...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Report */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Top 20 produtos por receita no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p>Carregando dados...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={productData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultants Report */}
        <TabsContent value="consultants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Consultoras</CardTitle>
              <CardDescription>
                Top 20 consultoras por comissão no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p>Carregando dados...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={consultantData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Vendas" />
                    <Bar dataKey="commission" fill="#82ca9d" name="Comissão" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Report */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Clientes</CardTitle>
              <CardDescription>
                Métricas e comportamento dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Relatório de clientes em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}