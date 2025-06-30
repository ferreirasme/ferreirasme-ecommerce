"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ChartData {
  month: string
  vendas: number
  comissoes: number
  pedidos: number
}

export function AdminDashboardChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [])

  async function loadChartData() {
    try {
      const supabase = createClient()
      const months: ChartData[] = []
      
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        // Vendas do mês
        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .eq('status', 'completed')
        
        const vendas = orders?.reduce((sum, order) => sum + order.total, 0) || 0
        
        // Comissões do mês
        const { data: commissions } = await supabase
          .from('consultant_commissions')
          .select('amount')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .eq('status', 'approved')
        
        const comissoes = commissions?.reduce((sum, comm) => sum + comm.amount, 0) || 0
        
        // Número de pedidos
        const { count: pedidos } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
        
        months.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          vendas,
          comissoes,
          pedidos: pedidos || 0
        })
      }
      
      setData(months)
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'pedidos') return value
    return formatCurrency(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Vendas</CardTitle>
        <CardDescription>
          Acompanhe o desempenho do seu e-commerce nos últimos 12 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vendas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vendas" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={formatTooltipValue} />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Vendas"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="comissoes" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={formatTooltipValue} />
                <Bar 
                  dataKey="comissoes" 
                  fill="#ec4899"
                  name="Comissões"
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="pedidos" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={formatTooltipValue} />
                <Bar 
                  dataKey="pedidos" 
                  fill="#3b82f6"
                  name="Pedidos"
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}