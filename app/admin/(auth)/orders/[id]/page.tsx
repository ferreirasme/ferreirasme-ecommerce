"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  User, 
  CreditCard, 
  MapPin,
  Calendar,
  Euro,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Edit
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface OrderItem {
  id: string
  product_id: string
  product: {
    name: string
    sku: string
  }
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  subtotal_amount: number
  shipping_amount: number
  discount_amount: number
  status: string
  payment_status: string
  payment_method: string
  payment_intent_id?: string
  shipping_method: string
  shipping_status: string
  shipping_tracking?: string
  shipping_address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  billing_address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  notes?: string
  created_at: string
  updated_at: string
  consultant_id?: string
  consultant?: {
    full_name: string
    code: string
    email: string
    phone: string
  }
  order_items: OrderItem[]
}

interface StatusHistoryEntry {
  id: string
  order_id: string
  status: string
  changed_from?: string
  changed_to: string
  changed_by: string
  notes?: string
  created_at: string
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const { id } = await params
        
        // Fetch order with relations
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            consultant:consultants!consultant_id(
              full_name,
              code,
              email,
              phone
            ),
            order_items(
              *,
              product:products(
                name,
                sku
              )
            )
          `)
          .eq('id', id)
          .single()

        if (orderError) throw orderError
        
        setOrder(orderData)
        setNotes(orderData.notes || "")

        // Fetch status history
        const { data: historyData, error: historyError } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', id)
          .order('created_at', { ascending: false })

        if (historyError) console.error('Error fetching history:', historyError)
        else setStatusHistory(historyData || [])

      } catch (error: any) {
        console.error('Error fetching order:', error)
        toast.error('Erro ao carregar pedido')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrder()
  }, [params])

  const updateOrderStatus = async (field: 'status' | 'payment_status' | 'shipping_status', value: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) throw error

      // Add to status history
      if (field === 'status') {
        await supabase
          .from('order_status_history')
          .insert({
            order_id: order.id,
            status: field,
            changed_from: order.status,
            changed_to: value,
            changed_by: 'admin', // You might want to get the actual admin user
            notes: `Status alterado de ${order.status} para ${value}`
          })
      }

      setOrder({ ...order, [field]: value })
      toast.success('Status atualizado com sucesso!')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const updateNotes = async () => {
    if (!order) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) throw error

      toast.success('Observações atualizadas!')
    } catch (error: any) {
      console.error('Error updating notes:', error)
      toast.error('Erro ao atualizar observações')
    } finally {
      setUpdating(false)
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

  const generateInvoice = () => {
    // This would generate a PDF invoice
    toast.info('Funcionalidade de fatura em desenvolvimento')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Pedido não encontrado</div>
          <Link href="/admin/orders">
            <Button className="mt-4">Voltar aos pedidos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Criado em {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Fatura
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.product.sku} • Quantidade: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.total_price)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(item.unit_price)} cada
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Envio</span>
                  <span>{formatPrice(order.shipping_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Dados Pessoais</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {order.customer_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {order.customer_email}
                  </div>
                  {order.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {order.customer_phone}
                    </div>
                  )}
                </div>
              </div>
              
              {order.consultant && (
                <div>
                  <h3 className="font-medium mb-2">Consultora Responsável</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {order.consultant.full_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Código:</span>
                      {order.consultant.code}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereços
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Endereço de Entrega</h3>
                <div className="text-sm space-y-1">
                  <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                  {order.shipping_address.complement && (
                    <p>{order.shipping_address.complement}</p>
                  )}
                  <p>{order.shipping_address.neighborhood}</p>
                  <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                  <p>{order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
              
              {order.billing_address && (
                <div>
                  <h3 className="font-medium mb-2">Endereço de Faturação</h3>
                  <div className="text-sm space-y-1">
                    <p>{order.billing_address.street}, {order.billing_address.number}</p>
                    {order.billing_address.complement && (
                      <p>{order.billing_address.complement}</p>
                    )}
                    <p>{order.billing_address.neighborhood}</p>
                    <p>{order.billing_address.city} - {order.billing_address.state}</p>
                    <p>{order.billing_address.postal_code}</p>
                    <p>{order.billing_address.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o pedido..."
                rows={4}
              />
              <Button 
                className="mt-4" 
                onClick={updateNotes}
                disabled={updating}
              >
                Salvar Observações
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Status</CardTitle>
              <CardDescription>Atualize os status do pedido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status do Pedido</label>
                <Select 
                  value={order.status} 
                  onValueChange={(value) => updateOrderStatus('status', value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status do Pagamento</label>
                <Select 
                  value={order.payment_status} 
                  onValueChange={(value) => updateOrderStatus('payment_status', value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  {getPaymentBadge(order.payment_status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status do Envio</label>
                <Select 
                  value={order.shipping_status} 
                  onValueChange={(value) => updateOrderStatus('shipping_status', value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Aguardando</SelectItem>
                    <SelectItem value="processing">Preparando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="returned">Devolvido</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  {getShippingBadge(order.shipping_status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{getPaymentBadge(order.payment_status)}</span>
              </div>
              {order.payment_intent_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Transação</span>
                  <span className="font-mono text-xs">{order.payment_intent_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informações de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">{order.shipping_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{getShippingBadge(order.shipping_status)}</span>
              </div>
              {order.shipping_tracking && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rastreio</span>
                  <span className="font-mono text-xs">{order.shipping_tracking}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico de Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusHistory.map((entry) => (
                    <div key={entry.id} className="text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{entry.notes}</p>
                          <p className="text-xs text-muted-foreground">
                            Por {entry.changed_by}
                          </p>
                        </div>
                        <time className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), 'dd/MM HH:mm')}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}