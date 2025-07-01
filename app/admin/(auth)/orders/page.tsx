"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  Eye, 
  Package,
  Filter,
  Download,
  Calendar,
  Euro,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  payment_status: string
  payment_method: string
  shipping_method: string
  shipping_status: string
  created_at: string
  updated_at: string
  consultant_id?: string
  consultant?: {
    full_name: string
    code: string
  }
  items_count?: number
}

interface OrderStats {
  total_orders: number
  total_revenue: number
  pending_orders: number
  processing_orders: number
  completed_orders: number
  average_order_value: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    processing_orders: 0,
    completed_orders: 0,
    average_order_value: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [currentPage, searchTerm, statusFilter, paymentFilter, dateFilter])

  const fetchStats = async () => {
    try {
      // Get total orders and revenue
      const { data: totalData, error: totalError } = await supabase
        .from('orders')
        .select('id, total_amount')
      
      if (totalError) throw totalError

      // Get orders by status
      const { data: statusData, error: statusError } = await supabase
        .from('orders')
        .select('status')
      
      if (statusError) throw statusError

      const stats: OrderStats = {
        total_orders: totalData?.length || 0,
        total_revenue: totalData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        pending_orders: statusData?.filter(o => o.status === 'pending').length || 0,
        processing_orders: statusData?.filter(o => o.status === 'processing').length || 0,
        completed_orders: statusData?.filter(o => o.status === 'completed').length || 0,
        average_order_value: 0
      }

      stats.average_order_value = stats.total_orders > 0 
        ? stats.total_revenue / stats.total_orders 
        : 0

      setStats(stats)
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Build query
      let query = supabase
        .from('orders')
        .select(`
          *,
          consultant:consultants!consultant_id(
            full_name,
            code
          )
        `, { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }

      if (paymentFilter !== "all") {
        query = query.eq('payment_status', paymentFilter)
      }

      // Date filter
      if (dateFilter !== "all") {
        const now = new Date()
        let startDate = new Date()
        
        switch (dateFilter) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
          case "year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      // Get item counts for each order
      const ordersWithCounts = await Promise.all(
        (data || []).map(async (order) => {
          const { count } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id)
          
          return {
            ...order,
            items_count: count || 0
          }
        })
      )

      setOrders(ordersWithCounts)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      processing: { label: 'Processando', variant: 'default' as const, icon: Package },
      completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
      refunded: { label: 'Reembolsado', variant: 'secondary' as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={'className' in config ? config.className : undefined}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const paymentConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const },
      paid: { label: 'Pago', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      failed: { label: 'Falhou', variant: 'destructive' as const },
      refunded: { label: 'Reembolsado', variant: 'secondary' as const }
    }

    const config = paymentConfig[status as keyof typeof paymentConfig] || paymentConfig.pending

    return <Badge variant={config.variant} className={'className' in config ? config.className : undefined}>{config.label}</Badge>
  }

  const getShippingBadge = (status: string) => {
    const shippingConfig = {
      pending: { label: 'Aguardando', variant: 'outline' as const },
      processing: { label: 'Preparando', variant: 'default' as const },
      shipped: { label: 'Enviado', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      delivered: { label: 'Entregue', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      returned: { label: 'Devolvido', variant: 'secondary' as const }
    }

    const config = shippingConfig[status as keyof typeof shippingConfig] || shippingConfig.pending

    return (
      <Badge variant={config.variant} className={'className' in config ? config.className : undefined}>
        {status === 'shipped' && <Truck className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const exportOrders = async () => {
    try {
      // Fetch all orders for export
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convert to CSV
      const csv = [
        ['Número', 'Data', 'Cliente', 'Email', 'Total', 'Status', 'Pagamento', 'Envio'].join(','),
        ...(data || []).map(order => [
          order.order_number,
          format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
          order.customer_name,
          order.customer_email,
          order.total_amount,
          order.status,
          order.payment_status,
          order.shipping_status
        ].join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pedidos-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Pedidos exportados com sucesso!')
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Erro ao exportar pedidos')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <Button onClick={exportOrders}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
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
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatPrice(stats.total_revenue)}</p>
              </div>
              <Euro className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pedido Médio</p>
                <p className="text-2xl font-bold">{formatPrice(stats.average_order_value)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending_orders}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              Mostrando {orders.length} de {totalPages * itemsPerPage} pedidos
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Consultora</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.order_number}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: pt })}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.consultant ? (
                        <div>
                          <div className="font-medium">{order.consultant.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Código: {order.consultant.code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.items_count || 0} items</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                    <TableCell>{getShippingBadge(order.shipping_status)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}