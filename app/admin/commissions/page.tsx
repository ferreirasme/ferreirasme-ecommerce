"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Calendar,
  Download
} from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Commission {
  id: string
  order_id: string
  order_total: number
  commission_percentage: number
  commission_amount: number
  status: string
  reference_month: number
  reference_year: number
  created_at: string
  approved_at: string | null
  paid_at: string | null
  consultant: {
    id: string
    code: string
    full_name: string
    bank_iban: string
  }
  client: {
    full_name: string
  } | null
}

interface PaymentDialog {
  open: boolean
  commissions: Commission[]
  totalAmount: number
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialog>({
    open: false,
    commissions: [],
    totalAmount: 0
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCommissions()
  }, [statusFilter, monthFilter, yearFilter, searchTerm])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('consultant_commissions')
        .select(`
          *,
          consultant:consultants(id, code, full_name, bank_iban),
          client:clients(full_name)
        `)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      query = query
        .eq('reference_month', monthFilter)
        .eq('reference_year', yearFilter)

      if (searchTerm) {
        query = query.or(`consultant.full_name.ilike.%${searchTerm}%,consultant.code.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      setCommissions(data || [])
    } catch (error) {
      console.error('Error fetching commissions:', error)
      toast.error('Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      approved: { label: 'Aprovada', variant: 'default' as const, icon: CheckCircle2 },
      paid: { label: 'Paga', variant: 'default' as const, icon: DollarSign },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: null }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    )
  }

  const handleSelectCommission = (id: string) => {
    setSelectedCommissions(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const pendingCommissions = commissions.filter(c => c.status === 'pending')
    if (selectedCommissions.length === pendingCommissions.length) {
      setSelectedCommissions([])
    } else {
      setSelectedCommissions(pendingCommissions.map(c => c.id))
    }
  }

  const handleApproveSelected = async () => {
    if (selectedCommissions.length === 0) {
      toast.error('Selecione pelo menos uma comissão')
      return
    }

    try {
      const { error } = await supabase
        .from('consultant_commissions')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .in('id', selectedCommissions)
        .eq('status', 'pending')

      if (error) throw error

      toast.success(`${selectedCommissions.length} comissões aprovadas!`)
      setSelectedCommissions([])
      fetchCommissions()
    } catch (error) {
      console.error('Error approving commissions:', error)
      toast.error('Erro ao aprovar comissões')
    }
  }

  const preparePayment = () => {
    const selectedComms = commissions.filter(c => 
      selectedCommissions.includes(c.id) && c.status === 'approved'
    )
    
    if (selectedComms.length === 0) {
      toast.error('Selecione apenas comissões aprovadas para pagamento')
      return
    }

    const totalAmount = selectedComms.reduce((sum, c) => sum + c.commission_amount, 0)

    setPaymentDialog({
      open: true,
      commissions: selectedComms,
      totalAmount
    })
  }

  const handlePayment = async () => {
    try {
      const { error } = await supabase
        .from('consultant_commissions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .in('id', paymentDialog.commissions.map(c => c.id))

      if (error) throw error

      // Update consultant totals
      for (const commission of paymentDialog.commissions) {
        await supabase
          .from('consultants')
          .update({
            total_commission_earned: supabase.rpc('increment', { 
              x: commission.consultant.id, 
              amount: commission.commission_amount 
            })
          })
          .eq('id', commission.consultant.id)
      }

      toast.success('Pagamento registrado com sucesso!')
      setPaymentDialog({ open: false, commissions: [], totalAmount: 0 })
      setSelectedCommissions([])
      fetchCommissions()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Erro ao processar pagamento')
    }
  }

  const exportCommissions = async () => {
    try {
      const csv = [
        ['Consultora', 'Código', 'Pedido', 'Valor Pedido', 'Comissão %', 'Valor Comissão', 'Status', 'Data'],
        ...commissions.map(c => [
          c.consultant.full_name,
          c.consultant.code,
          c.order_id.slice(0, 8),
          c.order_total.toFixed(2),
          c.commission_percentage,
          c.commission_amount.toFixed(2),
          c.status,
          new Date(c.created_at).toLocaleDateString('pt-PT')
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `comissoes_${monthFilter}_${yearFilter}.csv`
      link.click()

      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      console.error('Error exporting commissions:', error)
      toast.error('Erro ao exportar relatório')
    }
  }

  // Calculate statistics
  const stats = {
    total: commissions.length,
    pending: commissions.filter(c => c.status === 'pending').length,
    approved: commissions.filter(c => c.status === 'approved').length,
    paid: commissions.filter(c => c.status === 'paid').length,
    totalValue: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pendingValue: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
    approvedValue: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0),
    paidValue: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Comissões</h1>
        <Button variant="outline" onClick={exportCommissions}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              €{stats.pendingValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              €{stats.approvedValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              €{stats.paidValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              €{stats.totalValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por consultora..."
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter.toString()} onValueChange={(v) => setMonthFilter(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2024, month - 1).toLocaleDateString('pt-PT', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter.toString()} onValueChange={(v) => setYearFilter(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      {selectedCommissions.length > 0 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCommissions.length} comissões selecionadas
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedCommissions([])}
                >
                  Limpar seleção
                </Button>
                <Button 
                  size="sm"
                  onClick={handleApproveSelected}
                >
                  Aprovar selecionadas
                </Button>
                <Button 
                  size="sm"
                  variant="default"
                  onClick={preparePayment}
                >
                  Registrar pagamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commissions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              Comissões de {new Date(yearFilter, monthFilter - 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedCommissions.length === commissions.filter(c => c.status === 'pending').length && selectedCommissions.length > 0}
                  />
                </TableHead>
                <TableHead>Consultora</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Pedido</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Nenhuma comissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCommissions.includes(commission.id)}
                        onChange={() => handleSelectCommission(commission.id)}
                        disabled={commission.status === 'paid' || commission.status === 'cancelled'}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{commission.consultant.full_name}</p>
                        <p className="text-sm text-gray-500">{commission.consultant.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{commission.order_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{commission.client?.full_name || '-'}</TableCell>
                    <TableCell>€{commission.order_total.toFixed(2)}</TableCell>
                    <TableCell>{commission.commission_percentage}%</TableCell>
                    <TableCell className="font-semibold">
                      €{commission.commission_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell>{new Date(commission.created_at).toLocaleDateString('pt-PT')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => !open && setPaymentDialog({ open: false, commissions: [], totalAmount: 0 })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o pagamento das comissões selecionadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Resumo do pagamento:</p>
              <p className="text-2xl font-bold">€{paymentDialog.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {paymentDialog.commissions.length} comissões
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {paymentDialog.commissions.map((commission) => (
                <div key={commission.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{commission.consultant.full_name}</p>
                    <p className="text-sm text-gray-500">IBAN: {commission.consultant.bank_iban || 'Não informado'}</p>
                  </div>
                  <p className="font-semibold">€{commission.commission_amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPaymentDialog({ open: false, commissions: [], totalAmount: 0 })}
            >
              Cancelar
            </Button>
            <Button onClick={handlePayment}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}