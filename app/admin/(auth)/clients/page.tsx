"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Upload, Download } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Client {
  id: string
  full_name: string
  email: string
  phone: string
  status: string
  total_purchases: number
  purchase_count: number
  created_at: string
  consultant: {
    id: string
    code: string
    full_name: string
  }
}

interface Consultant {
  id: string
  code: string
  full_name: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConsultant, setSelectedConsultant] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchConsultants()
  }, [])

  useEffect(() => {
    fetchClients()
  }, [currentPage, searchTerm, selectedConsultant])

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, code, full_name')
        .eq('status', 'active')
        .order('full_name')

      if (error) throw error
      setConsultants(data || [])
    } catch (error) {
      console.error('Error fetching consultants:', error)
    }
  }

  const fetchClients = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('clients')
        .select(`
          *,
          consultant:consultants(id, code, full_name)
        `, { count: 'exact' })

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      if (selectedConsultant !== 'all') {
        query = query.eq('consultant_id', selectedConsultant)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      setClients(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const exportClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          consultant:consultants(code, full_name)
        `)

      if (selectedConsultant !== 'all') {
        query = query.eq('consultant_id', selectedConsultant)
      }

      const { data, error } = await query

      if (error) throw error

      // Convert to CSV
      const csv = [
        ['Nome', 'Email', 'Telefone', 'Consultora', 'Total Compras', 'Qtd Pedidos', 'Status', 'Data Cadastro'],
        ...(data || []).map(client => [
          client.full_name,
          client.email,
          client.phone || '',
          client.consultant?.full_name || '',
          client.total_purchases,
          client.purchase_count,
          client.status,
          new Date(client.created_at).toLocaleDateString('pt-PT')
        ])
      ].map(row => row.join(',')).join('\n')

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success('Clientes exportados com sucesso!')
    } catch (error) {
      console.error('Error exporting clients:', error)
      toast.error('Erro ao exportar clientes')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      blocked: { label: 'Bloqueado', variant: 'destructive' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <div className="flex gap-2">
          <Link href="/admin/clients/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          </Link>
          <Button variant="outline" onClick={exportClients}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

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
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por consultora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as consultoras</SelectItem>
                {consultants.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.full_name} ({consultant.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              Mostrando {clients.length} de {totalPages * itemsPerPage} clientes
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Consultora</TableHead>
                <TableHead>Total Compras</TableHead>
                <TableHead>Qtd. Pedidos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.full_name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      {client.consultant ? (
                        <Link
                          href={`/admin/consultants/${client.consultant.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.consultant.full_name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>€{client.total_purchases.toFixed(2)}</TableCell>
                    <TableCell>{client.purchase_count}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString('pt-PT')}</TableCell>
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