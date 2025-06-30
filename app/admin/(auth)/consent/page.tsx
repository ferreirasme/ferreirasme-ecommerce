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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Shield, 
  UserCheck, 
  FileText, 
  Download,
  Search,
  Filter
} from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ConsentRecord {
  id: string
  user_id: string | null
  consultant_id: string | null
  client_id: string | null
  consent_type: string
  action: string
  version: string
  ip_address: string
  user_agent: string
  valid_until: string | null
  created_at: string
  consultant?: {
    full_name: string
    code: string
  }
  client?: {
    full_name: string
  }
}

export default function ConsentManagementPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [consentTypeFilter, setConsentTypeFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchConsents()
  }, [consentTypeFilter, userTypeFilter, searchTerm, currentPage])

  const fetchConsents = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('consent_records')
        .select(`
          *,
          consultant:consultants(full_name, code),
          client:clients(full_name)
        `, { count: 'exact' })

      if (consentTypeFilter !== 'all') {
        query = query.eq('consent_type', consentTypeFilter)
      }

      if (userTypeFilter === 'consultant') {
        query = query.not('consultant_id', 'is', null)
      } else if (userTypeFilter === 'client') {
        query = query.not('client_id', 'is', null)
      } else if (userTypeFilter === 'user') {
        query = query.not('user_id', 'is', null)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      setConsents(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching consents:', error)
      toast.error('Erro ao carregar consentimentos')
    } finally {
      setLoading(false)
    }
  }

  const getConsentTypeBadge = (type: string) => {
    const typeConfig = {
      data_processing: { label: 'Processamento de Dados', variant: 'default' as const },
      marketing: { label: 'Marketing', variant: 'secondary' as const },
      data_sharing: { label: 'Compartilhamento', variant: 'outline' as const },
      cookies: { label: 'Cookies', variant: 'outline' as const },
      newsletter: { label: 'Newsletter', variant: 'secondary' as const },
      terms_of_service: { label: 'Termos de Serviço', variant: 'default' as const },
      privacy_policy: { label: 'Política de Privacidade', variant: 'default' as const }
    }

    const config = typeConfig[type as keyof typeof typeConfig] || { label: type, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getActionBadge = (action: string) => {
    const actionConfig = {
      granted: { label: 'Concedido', variant: 'default' as const },
      revoked: { label: 'Revogado', variant: 'destructive' as const },
      updated: { label: 'Atualizado', variant: 'secondary' as const }
    }

    const config = actionConfig[action as keyof typeof actionConfig] || { label: action, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getUserInfo = (record: ConsentRecord) => {
    if (record.consultant) {
      return `${record.consultant.full_name} (${record.consultant.code})`
    } else if (record.client) {
      return record.client.full_name
    } else if (record.user_id) {
      return `Usuário: ${record.user_id.slice(0, 8)}...`
    }
    return 'Desconhecido'
  }

  const exportConsents = async () => {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select(`
          *,
          consultant:consultants(full_name, code),
          client:clients(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convert to CSV
      const csv = [
        ['Tipo', 'Ação', 'Usuário', 'Versão', 'IP', 'Data', 'Válido até'],
        ...(data || []).map(record => [
          record.consent_type,
          record.action,
          getUserInfo(record),
          record.version,
          record.ip_address,
          new Date(record.created_at).toLocaleDateString('pt-PT'),
          record.valid_until ? new Date(record.valid_until).toLocaleDateString('pt-PT') : ''
        ])
      ].map(row => row.join(',')).join('\n')

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `consentimentos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success('Consentimentos exportados com sucesso!')
    } catch (error) {
      console.error('Error exporting consents:', error)
      toast.error('Erro ao exportar consentimentos')
    }
  }

  // Calculate statistics
  const stats = {
    total: consents.length,
    granted: consents.filter(c => c.action === 'granted').length,
    revoked: consents.filter(c => c.action === 'revoked').length,
    consultants: new Set(consents.filter(c => c.consultant_id).map(c => c.consultant_id)).size,
    clients: new Set(consents.filter(c => c.client_id).map(c => c.client_id)).size
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Consentimentos</h1>
        <Button variant="outline" onClick={exportConsents}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Consentimentos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concedidos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.granted}</div>
            <p className="text-xs text-muted-foreground">
              Consentimentos ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revogados</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            <p className="text-xs text-muted-foreground">
              Consentimentos revogados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consultants + stats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Consultoras e clientes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="revoked">Revogados</TabsTrigger>
          <TabsTrigger value="expiring">Expirando</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={consentTypeFilter} onValueChange={setConsentTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tipo de consentimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="data_processing">Processamento de dados</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="data_sharing">Compartilhamento</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="terms_of_service">Termos de serviço</SelectItem>
                    <SelectItem value="privacy_policy">Política de privacidade</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="consultant">Consultoras</SelectItem>
                    <SelectItem value="client">Clientes</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Consent Records Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>
                  Registros de consentimento LGPD
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Válido até</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : consents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    consents.map((consent) => (
                      <TableRow key={consent.id}>
                        <TableCell>{getConsentTypeBadge(consent.consent_type)}</TableCell>
                        <TableCell>{getActionBadge(consent.action)}</TableCell>
                        <TableCell>{getUserInfo(consent)}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{consent.version}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{consent.ip_address}</span>
                        </TableCell>
                        <TableCell>{new Date(consent.created_at).toLocaleDateString('pt-PT')}</TableCell>
                        <TableCell>
                          {consent.valid_until 
                            ? new Date(consent.valid_until).toLocaleDateString('pt-PT')
                            : '-'
                          }
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
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos Ativos</CardTitle>
              <CardDescription>
                Todos os consentimentos atualmente concedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revoked">
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos Revogados</CardTitle>
              <CardDescription>
                Histórico de consentimentos revogados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos Expirando</CardTitle>
              <CardDescription>
                Consentimentos próximos da data de expiração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}