'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign
} from 'lucide-react'
import { Commission, CommissionStatus, CommissionFilter } from '@/types/consultant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { formatCurrency } from '@/lib/format'

interface CommissionListProps {
  commissions: Commission[]
  onExport?: () => void
  isLoading?: boolean
}

const statusConfig = {
  [CommissionStatus.PENDING]: {
    label: 'Pendente',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800'
  },
  [CommissionStatus.APPROVED]: {
    label: 'Aprovada',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800'
  },
  [CommissionStatus.PAID]: {
    label: 'Paga',
    icon: DollarSign,
    color: 'bg-blue-100 text-blue-800'
  },
  [CommissionStatus.CANCELLED]: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'bg-red-100 text-red-800'
  }
}

export function CommissionList({ commissions, onExport, isLoading }: CommissionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'all'>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter(commission => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        if (
          !commission.orderDetails.orderNumber.toLowerCase().includes(search) &&
          !commission.orderDetails.customerName.toLowerCase().includes(search)
        ) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all' && commission.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateRange.start || dateRange.end) {
        const orderDate = new Date(commission.orderDate)
        if (dateRange.start && orderDate < new Date(dateRange.start)) {
          return false
        }
        if (dateRange.end && orderDate > new Date(dateRange.end)) {
          return false
        }
      }

      return true
    })
  }, [commissions, searchTerm, statusFilter, dateRange])

  // Calculate totals
  const totals = useMemo(() => {
    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      paid: 0
    }

    filteredCommissions.forEach(commission => {
      result.total += commission.commissionAmount
      
      switch (commission.status) {
        case CommissionStatus.PENDING:
          result.pending += commission.commissionAmount
          break
        case CommissionStatus.APPROVED:
          result.approved += commission.commissionAmount
          break
        case CommissionStatus.PAID:
          result.paid += commission.commissionAmount
          break
      }
    })

    return result
  }, [filteredCommissions])

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission)
    setShowDetails(true)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total em Comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totals.pending)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.approved)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.paid)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões</CardTitle>
          <CardDescription>
            Gerencie e acompanhe suas comissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por pedido ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CommissionStatus | 'all')}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Data inicial"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full md:w-auto"
                />
                <Input
                  type="date"
                  placeholder="Data final"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full md:w-auto"
                />
              </div>
              
              {onExport && (
                <Button
                  variant="outline"
                  onClick={onExport}
                  disabled={isLoading}
                  className="w-full md:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>

            {/* Commission table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor do Pedido</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma comissão encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((commission) => {
                      const StatusIcon = statusConfig[commission.status].icon
                      return (
                        <motion.tr
                          key={commission.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">
                            #{commission.orderDetails.orderNumber}
                          </TableCell>
                          <TableCell>{commission.orderDetails.customerName}</TableCell>
                          <TableCell>
                            {format(new Date(commission.orderDate), "dd 'de' MMM 'de' yyyy", {
                              locale: pt
                            })}
                          </TableCell>
                          <TableCell>{formatCurrency(commission.orderAmount)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(commission.commissionAmount)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {commission.commissionRate}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[commission.status].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[commission.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(commission)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Comissão #{selectedCommission?.orderDetails.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre esta comissão
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-6">
              {/* Status and dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge className={statusConfig[selectedCommission.status].color}>
                    {statusConfig[selectedCommission.status].label}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data do Pedido</h4>
                  <p className="text-sm">
                    {format(new Date(selectedCommission.orderDate), "dd 'de' MMMM 'de' yyyy", {
                      locale: pt
                    })}
                  </p>
                </div>
              </div>

              {/* Financial details */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor do Pedido</span>
                  <span className="font-medium">{formatCurrency(selectedCommission.orderAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Comissão</span>
                  <span className="font-medium">{selectedCommission.commissionRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Valor da Comissão</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(selectedCommission.commissionAmount)}
                  </span>
                </div>
              </div>

              {/* Order items */}
              <div>
                <h4 className="font-medium mb-2">Itens do Pedido</h4>
                <div className="space-y-2">
                  {selectedCommission.orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional dates */}
              {selectedCommission.approvalDate && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Aprovação</h4>
                  <p className="text-sm">
                    {format(new Date(selectedCommission.approvalDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: pt
                    })}
                  </p>
                </div>
              )}
              
              {selectedCommission.paymentDate && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Pagamento</h4>
                  <p className="text-sm">
                    {format(new Date(selectedCommission.paymentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: pt
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}