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
import { Plus, Search, Edit, Eye, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Consultant {
  id: string
  code: string
  full_name: string
  email: string
  phone: string
  status: string
  commission_percentage: number
  total_sales: number
  total_commission_earned: number
  created_at: string
  _count?: {
    clients: number
  }
}

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchConsultants()
  }, [currentPage, searchTerm])

  const fetchConsultants = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('consultants')
        .select(`
          *,
          clients (count)
        `, { count: 'exact' })

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      // Transform the data to include client count
      const transformedData = data?.map(consultant => ({
        ...consultant,
        _count: {
          clients: consultant.clients?.[0]?.count || 0
        }
      })) || []

      setConsultants(transformedData)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching consultants:', error)
      toast.error('Erro ao carregar consultoras')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (consultantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultants')
        .update({ 
          status: newStatus,
          ...(newStatus === 'active' ? { activation_date: new Date().toISOString() } : {}),
          ...(newStatus === 'inactive' ? { deactivation_date: new Date().toISOString() } : {})
        })
        .eq('id', consultantId)

      if (error) throw error

      toast.success('Status atualizado com sucesso')
      fetchConsultants()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const },
      inactive: { label: 'Inativa', variant: 'secondary' as const },
      suspended: { label: 'Suspensa', variant: 'destructive' as const },
      pending: { label: 'Pendente', variant: 'outline' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consultoras</h1>
        <Link href="/admin/consultants/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consultora
          </Button>
        </Link>
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
                  placeholder="Buscar por nome, email ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">Exportar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              Mostrando {consultants.length} de {totalPages * itemsPerPage} consultoras
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Total Vendas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : consultants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Nenhuma consultora encontrada
                  </TableCell>
                </TableRow>
              ) : (
                consultants.map((consultant) => (
                  <TableRow key={consultant.id}>
                    <TableCell className="font-medium">{consultant.code}</TableCell>
                    <TableCell>{consultant.full_name}</TableCell>
                    <TableCell>{consultant.email}</TableCell>
                    <TableCell>{consultant.phone}</TableCell>
                    <TableCell>{getStatusBadge(consultant.status)}</TableCell>
                    <TableCell>{consultant._count?.clients || 0}</TableCell>
                    <TableCell>{consultant.commission_percentage}%</TableCell>
                    <TableCell>€{consultant.total_sales.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Link href={`/admin/consultants/${consultant.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/admin/consultants/${consultant.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          {consultant.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleStatusChange(consultant.id, 'inactive')}>
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatusChange(consultant.id, 'active')}>
                              Ativar
                            </DropdownMenuItem>
                          )}
                          {consultant.status !== 'suspended' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(consultant.id, 'suspended')}
                              className="text-red-600"
                            >
                              Suspender
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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