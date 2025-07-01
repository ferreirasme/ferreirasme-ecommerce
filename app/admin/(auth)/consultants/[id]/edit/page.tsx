"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Save, Mail, Key, User, Phone, MapPin, CreditCard, BarChart, History } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PostalCodeInput } from "@/components/forms/postal-code-input"

interface ConsultantData {
  id: string
  user_id: string
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
  commission_period_days: number
  notes: string
  status: string
  odoo_id?: number
  created_at: string
  updated_at: string
  // Additional fields from Odoo that might be useful
  customer_rank?: number
  supplier_rank?: number
  is_company?: boolean
  parent_id?: number
  ref?: string
  lang?: string
  active?: boolean
  employee?: boolean
  function?: string
  phone_sanitized?: string
  mobile?: string
  email_normalized?: string
  website?: string
  title?: string
  category_id?: number[]
  partner_share?: boolean
}

export default function EditConsultantPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consultant, setConsultant] = useState<ConsultantData | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    const loadConsultant = async () => {
      try {
        const { id } = await params
        
        const { data, error } = await supabase
          .from('consultants')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        
        if (!data) {
          throw new Error('Consultora não encontrada')
        }
        
        setConsultant(data)
      } catch (error: any) {
        console.error('Error fetching consultant:', error)
        toast.error(error.message || 'Erro ao carregar consultora')
      } finally {
        setLoading(false)
      }
    }
    
    loadConsultant()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consultant) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('consultants')
        .update({
          full_name: consultant.full_name,
          phone: consultant.phone,
          whatsapp: consultant.whatsapp,
          nif: consultant.nif,
          birth_date: consultant.birth_date,
          address_street: consultant.address_street,
          address_number: consultant.address_number,
          address_complement: consultant.address_complement,
          address_neighborhood: consultant.address_neighborhood,
          address_city: consultant.address_city,
          address_state: consultant.address_state,
          address_postal_code: consultant.address_postal_code,
          address_country: consultant.address_country,
          bank_name: consultant.bank_name,
          bank_iban: consultant.bank_iban,
          bank_account_holder: consultant.bank_account_holder,
          commission_percentage: consultant.commission_percentage,
          monthly_target: consultant.monthly_target,
          commission_period_days: consultant.commission_period_days,
          notes: consultant.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultant.id)

      if (error) throw error

      toast.success('Consultora atualizada com sucesso!')
      router.push(`/admin/consultants/${consultant.id}`)
    } catch (error) {
      console.error('Error updating consultant:', error)
      toast.error('Erro ao atualizar consultora')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!consultant) return

    try {
      const response = await fetch('/api/consultants/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: consultant.email })
      })

      if (!response.ok) throw new Error('Failed to reset password')

      toast.success('Email de redefinição de senha enviado!')
    } catch (error) {
      toast.error('Erro ao enviar email de redefinição')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!consultant) return

    try {
      const { error } = await supabase
        .from('consultants')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultant.id)

      if (error) throw error

      setConsultant({ ...consultant, status: newStatus })
      toast.success('Status atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!consultant) {
    return <div>Consultora não encontrada</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/consultants/${consultant.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Consultora</h1>
            <p className="text-gray-600">{consultant?.full_name} • {consultant?.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={consultant.status === 'active' ? 'default' : 'secondary'}>
            {consultant.status}
          </Badge>
          {consultant.odoo_id && (
            <Badge variant="outline">Odoo ID: {consultant.odoo_id}</Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="address">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="financial">
              <CreditCard className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="commission">
              <BarChart className="h-4 w-4 mr-2" />
              Comissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Dados básicos da consultora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={consultant.full_name}
                      onChange={(e) => setConsultant({ ...consultant, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={consultant.code}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF</Label>
                    <Input
                      id="nif"
                      value={consultant.nif}
                      onChange={(e) => setConsultant({ ...consultant, nif: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={consultant.birth_date}
                      onChange={(e) => setConsultant({ ...consultant, birth_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={consultant.notes}
                    onChange={(e) => setConsultant({ ...consultant, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>Email, telefone e outros meios de contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={consultant.email}
                        disabled
                        className="bg-gray-100 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handlePasswordReset}
                        title="Enviar email de redefinição de senha"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={consultant.phone}
                      onChange={(e) => setConsultant({ ...consultant, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={consultant.whatsapp}
                      onChange={(e) => setConsultant({ ...consultant, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Celular (Odoo)</Label>
                    <Input
                      id="mobile"
                      value={consultant.mobile || ''}
                      onChange={(e) => setConsultant({ ...consultant, mobile: e.target.value })}
                      placeholder="Campo adicional da Odoo"
                    />
                  </div>
                </div>

                {consultant.website && (
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={consultant.website}
                      onChange={(e) => setConsultant({ ...consultant, website: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Endereço completo da consultora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <PostalCodeInput
                      value={consultant.address_postal_code}
                      onChange={(value) => setConsultant({ ...consultant, address_postal_code: value })}
                      onAddressFound={(address) => {
                        setConsultant({
                          ...consultant,
                          address_city: address.municipality || address.locality,
                          address_state: address.district,
                          address_neighborhood: address.parish || consultant.address_neighborhood,
                          address_street: address.street || consultant.address_street
                        })
                      }}
                      label="Código Postal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_street">Rua</Label>
                    <Input
                      id="address_street"
                      value={consultant.address_street}
                      onChange={(e) => setConsultant({ ...consultant, address_street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_number">Número</Label>
                    <Input
                      id="address_number"
                      value={consultant.address_number}
                      onChange={(e) => setConsultant({ ...consultant, address_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_complement">Complemento</Label>
                    <Input
                      id="address_complement"
                      value={consultant.address_complement}
                      onChange={(e) => setConsultant({ ...consultant, address_complement: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_neighborhood">Freguesia</Label>
                    <Input
                      id="address_neighborhood"
                      value={consultant.address_neighborhood}
                      onChange={(e) => setConsultant({ ...consultant, address_neighborhood: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_city">Cidade</Label>
                    <Input
                      id="address_city"
                      value={consultant.address_city}
                      onChange={(e) => setConsultant({ ...consultant, address_city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_state">Distrito</Label>
                    <Input
                      id="address_state"
                      value={consultant.address_state}
                      onChange={(e) => setConsultant({ ...consultant, address_state: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Informações Financeiras</CardTitle>
                <CardDescription>Dados bancários e fiscais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Banco</Label>
                    <Input
                      id="bank_name"
                      value={consultant.bank_name}
                      onChange={(e) => setConsultant({ ...consultant, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_iban">IBAN</Label>
                    <Input
                      id="bank_iban"
                      value={consultant.bank_iban}
                      onChange={(e) => setConsultant({ ...consultant, bank_iban: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_holder">Titular da Conta</Label>
                  <Input
                    id="bank_account_holder"
                    value={consultant.bank_account_holder}
                    onChange={(e) => setConsultant({ ...consultant, bank_account_holder: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Comissões</CardTitle>
                <CardDescription>Percentuais e metas de vendas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_percentage">Percentual de Comissão (%)</Label>
                    <Input
                      id="commission_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={consultant.commission_percentage}
                      onChange={(e) => setConsultant({ ...consultant, commission_percentage: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_target">Meta Mensal (€)</Label>
                    <Input
                      id="monthly_target"
                      type="number"
                      min="0"
                      step="0.01"
                      value={consultant.monthly_target}
                      onChange={(e) => setConsultant({ ...consultant, monthly_target: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission_period_days">Período de Comissão (dias)</Label>
                    <Input
                      id="commission_period_days"
                      type="number"
                      min="1"
                      value={consultant.commission_period_days}
                      onChange={(e) => setConsultant({ ...consultant, commission_period_days: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    As comissões são calculadas e pagas a cada {consultant.commission_period_days} dias.
                    A consultora recebe {consultant.commission_percentage}% sobre as vendas realizadas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStatusChange(consultant.status === 'active' ? 'inactive' : 'active')}
            >
              {consultant.status === 'active' ? 'Desativar' : 'Ativar'} Consultora
            </Button>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/consultants/${consultant.id}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}