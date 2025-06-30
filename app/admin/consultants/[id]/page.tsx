"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Save, Users, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Consultant {
  id: string
  code: string
  full_name: string
  email: string
  phone: string
  whatsapp: string
  nif: string
  birth_date: string
  address_street: string
  address_number: string
  address_complement: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_postal_code: string
  address_country: string
  bank_name: string
  bank_iban: string
  bank_account_holder: string
  commission_percentage: number
  monthly_target: number
  total_sales: number
  total_commission_earned: number
  status: string
  notes: string
  created_at: string
  activation_date: string
}

interface Client {
  id: string
  full_name: string
  email: string
  phone: string
  total_purchases: number
  purchase_count: number
  created_at: string
}

interface Commission {
  id: string
  order_id: string
  order_total: number
  commission_amount: number
  status: string
  created_at: string
  reference_month: number
  reference_year: number
}

export default function ConsultantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Consultant | null>(null)

  useEffect(() => {
    fetchConsultantData()
  }, [params.id])

  const fetchConsultantData = async () => {
    try {
      setLoading(true)

      // Fetch consultant details
      const { data: consultantData, error: consultantError } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', params.id)
        .single()

      if (consultantError) throw consultantError

      setConsultant(consultantData)
      setFormData(consultantData)

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('consultant_id', params.id)
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError
      setClients(clientsData || [])

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('consultant_commissions')
        .select('*')
        .eq('consultant_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (commissionsError) throw commissionsError
      setCommissions(commissionsData || [])

    } catch (error) {
      console.error('Error fetching consultant data:', error)
      toast.error('Erro ao carregar dados da consultora')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('consultants')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          nif: formData.nif,
          birth_date: formData.birth_date,
          address_street: formData.address_street,
          address_number: formData.address_number,
          address_complement: formData.address_complement,
          address_neighborhood: formData.address_neighborhood,
          address_city: formData.address_city,
          address_state: formData.address_state,
          address_postal_code: formData.address_postal_code,
          bank_name: formData.bank_name,
          bank_iban: formData.bank_iban,
          bank_account_holder: formData.bank_account_holder,
          commission_percentage: formData.commission_percentage,
          monthly_target: formData.monthly_target,
          notes: formData.notes
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('Consultora atualizada com sucesso!')
      setEditMode(false)
      setConsultant(formData)
    } catch (error) {
      console.error('Error updating consultant:', error)
      toast.error('Erro ao atualizar consultora')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
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

  const getCommissionStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const },
      approved: { label: 'Aprovada', variant: 'default' as const },
      paid: { label: 'Paga', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>
  }

  if (!consultant || !formData) {
    return <div>Consultora não encontrada</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/consultants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{consultant.full_name}</h1>
            <p className="text-gray-500">Código: {consultant.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(consultant.status)}
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => {
                setEditMode(false)
                setFormData(consultant)
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Editar</Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{consultant.total_sales.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Ganhas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{consultant.total_commission_earned.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Comissão</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultant.commission_percentage}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="clients">Clientes ({clients.length})</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={formData.address_street || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_number">Número</Label>
                  <Input
                    id="address_number"
                    name="address_number"
                    value={formData.address_number || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={formData.address_city || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">Distrito</Label>
                  <Input
                    id="address_state"
                    name="address_state"
                    value={formData.address_state || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_postal_code">Código Postal</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={formData.address_postal_code || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Bancários</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">IBAN</Label>
                  <Input
                    id="bank_iban"
                    name="bank_iban"
                    value={formData.bank_iban || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Vinculados</CardTitle>
              <CardDescription>Lista de clientes associados a esta consultora</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Total Compras</TableHead>
                    <TableHead>Qtd. Pedidos</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Nenhum cliente vinculado
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.full_name}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>€{client.total_purchases.toFixed(2)}</TableCell>
                        <TableCell>{client.purchase_count}</TableCell>
                        <TableCell>
                          {new Date(client.created_at).toLocaleDateString('pt-PT')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comissões</CardTitle>
              <CardDescription>Últimas comissões da consultora</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Valor do Pedido</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Nenhuma comissão registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="font-medium">
                          #{commission.order_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>€{commission.order_total.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          €{commission.commission_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getCommissionStatusBadge(commission.status)}</TableCell>
                        <TableCell>
                          {commission.reference_month}/{commission.reference_year}
                        </TableCell>
                        <TableCell>
                          {new Date(commission.created_at).toLocaleDateString('pt-PT')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}