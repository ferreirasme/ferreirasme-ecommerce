'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Users,
  Euro,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportData {
  totalSales: number
  totalCommissions: number
  totalClients: number
  averageOrderValue: number
  conversionRate: number
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  monthlyData: Array<{
    month: string
    sales: number
    commissions: number
    clients: number
  }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalCommissions: 0,
    totalClients: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    topProducts: [],
    monthlyData: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('3months')
  const [selectedReport, setSelectedReport] = useState('overview')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Simular dados do relatório (em produção, fazer queries reais)
      const mockData: ReportData = {
        totalSales: 15750.00,
        totalCommissions: 1575.00,
        totalClients: 43,
        averageOrderValue: 366.28,
        conversionRate: 12.5,
        topProducts: [
          { name: 'Colar Cristal Elegance', quantity: 23, revenue: 2070.00 },
          { name: 'Brincos Pérola Premium', quantity: 18, revenue: 1620.00 },
          { name: 'Pulseira Dourada Delicada', quantity: 15, revenue: 1350.00 },
          { name: 'Anel Solitário Clássico', quantity: 12, revenue: 1440.00 },
          { name: 'Conjunto Festa Completo', quantity: 8, revenue: 1600.00 }
        ],
        monthlyData: [
          { month: 'Jan', sales: 4250, commissions: 425, clients: 12 },
          { month: 'Fev', sales: 5100, commissions: 510, clients: 15 },
          { month: 'Mar', sales: 6400, commissions: 640, clients: 16 }
        ]
      }

      setReportData(mockData)
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Erro ao carregar dados do relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = (format: 'pdf' | 'csv') => {
    toast.info(`Exportando relatório em ${format.toUpperCase()}...`)
    // Implementar exportação real
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const reportTypes = [
    {
      id: 'overview',
      title: 'Visão Geral',
      description: 'Resumo completo do desempenho',
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'sales',
      title: 'Relatório de Vendas',
      description: 'Análise detalhada de vendas',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50'
    },
    {
      id: 'clients',
      title: 'Relatório de Clientes',
      description: 'Comportamento e engajamento',
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'commissions',
      title: 'Relatório de Comissões',
      description: 'Detalhamento de ganhos',
      icon: Euro,
      color: 'text-orange-600 bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada do seu desempenho
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tipos de relatório */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((report) => {
          const Icon = report.icon
          
          return (
            <Card 
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedReport === report.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardHeader className="flex flex-row items-center gap-2">
                <div className={`rounded-lg p-2 ${report.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {report.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Conteúdo do relatório */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsContent value="overview" className="space-y-4">
          {/* KPIs principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalSales)}</p>
                <p className="text-xs text-muted-foreground">+12% vs mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Comissões Ganhas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalCommissions)}</p>
                <p className="text-xs text-muted-foreground">10% das vendas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportData.totalClients}</p>
                <p className="text-xs text-muted-foreground">+5 novos este mês</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(reportData.averageOrderValue)}</p>
                <p className="text-xs text-muted-foreground">Por pedido</p>
              </CardContent>
            </Card>
          </div>

          {/* Produtos mais vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Top 5 produtos por receita no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de evolução mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>
                Vendas e comissões por mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.monthlyData.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span>{formatCurrency(month.sales)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(month.sales / 10000) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>
                Análise detalhada das vendas realizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">
                Gráficos e análises de vendas em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Clientes</CardTitle>
              <CardDescription>
                Comportamento e engajamento dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">
                Análises de clientes em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Comissões</CardTitle>
              <CardDescription>
                Detalhamento completo de ganhos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">
                Análises de comissões em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações de exportação */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleExportReport('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
        <Button onClick={() => handleExportReport('pdf')}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
    </div>
  )
}