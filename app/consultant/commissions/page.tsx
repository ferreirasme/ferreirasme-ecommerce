'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Euro, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface Commission {
  id: string
  order_id: string
  amount: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
  paid_at?: string
  order: {
    order_number: string
    total: number
    client: {
      name: string
    }
  }
}

interface CommissionStats {
  total: number
  pending: number
  approved: number
  paid: number
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<CommissionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCommissions()
  }, [selectedPeriod, selectedStatus])

  const fetchCommissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      let query = supabase
        .from('commissions')
        .select(`
          id,
          order_id,
          amount,
          status,
          created_at,
          paid_at,
          order:orders!inner (
            order_number,
            total,
            client:clients!inner (
              name
            )
          )
        `)
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false })

      // Aplicar filtro de período
      if (selectedPeriod !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (selectedPeriod) {
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      // Aplicar filtro de status
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedData = data?.map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        amount: item.amount,
        status: item.status,
        created_at: item.created_at,
        paid_at: item.paid_at,
        order: {
          order_number: item.order?.order_number || '',
          total: item.order?.total || 0,
          client: {
            name: item.order?.client?.name || 'Cliente desconhecido'
          }
        }
      })) || []

      setCommissions(formattedData)

      // Calcular estatísticas
      const totalStats = data?.reduce((acc, commission: any) => {
        acc.total += commission.amount
        if (commission.status in acc) {
          acc[commission.status as keyof typeof acc] += commission.amount
        }
        return acc
      }, { total: 0, pending: 0, approved: 0, paid: 0 }) || stats

      setStats(totalStats)
    } catch (error) {
      console.error('Error fetching commissions:', error)
      toast.error('Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    // Implementar exportação de relatório
    toast.info('Funcionalidade de exportação em desenvolvimento')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>
      case 'approved':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Aprovada</Badge>
      case 'paid':
        return <Badge className="bg-green-600"><Euro className="mr-1 h-3 w-3" />Paga</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const statsCards = [
    {
      title: 'Total de Comissões',
      value: formatCurrency(stats.total),
      icon: Euro,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Pendentes',
      value: formatCurrency(stats.pending),
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Aprovadas',
      value: formatCurrency(stats.approved),
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Pagas',
      value: formatCurrency(stats.paid),
      icon: Euro,
      color: 'text-purple-600 bg-purple-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Comissões</h1>
          <p className="text-muted-foreground">
            Acompanhe suas comissões e pagamentos
          </p>
        </div>
        
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Cards de estatísticas */}
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filtros e tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Histórico de Comissões</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Carregando comissões...</p>
            </div>
          ) : commissions.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">
                Nenhuma comissão encontrada
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Pedido</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        #{commission.order.order_number}
                      </TableCell>
                      <TableCell>
                        {commission.order.client.name}
                      </TableCell>
                      <TableCell>
                        {formatDate(commission.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(commission.order.total)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(commission.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}