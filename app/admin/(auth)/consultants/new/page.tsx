"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PostalCodeInput } from "@/components/forms/postal-code-input"
import { toast } from "sonner"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

export default function NewConsultantPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    nif: "",
    birth_date: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_postal_code: "",
    address_country: "PT",
    bank_name: "",
    bank_iban: "",
    bank_account_holder: "",
    commission_percentage: "10",
    monthly_target: "0",
    commission_period_days: "45", // Novo campo para período de 45 dias
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/consultants-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          commission_percentage: parseFloat(formData.commission_percentage),
          monthly_target: parseFloat(formData.monthly_target),
          commission_period_days: parseInt(formData.commission_period_days)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar consultora')
      }

      if (data.message) {
        toast.success(data.message)
      } else {
        toast.success('Consultora criada com sucesso!')
      }
      
      // Mostrar o código da consultora
      if (data.consultant?.code) {
        toast.info(`Código da consultora: ${data.consultant.code}`, {
          duration: 10000 // Mostrar por 10 segundos
        })
      }
      
      setTimeout(() => {
        router.push('/admin/consultants')
      }, 2000)
    } catch (error: any) {
      console.error('Error creating consultant:', error)
      toast.error(error.message || 'Erro ao criar consultora')
    } finally {
      setLoading(false)
    }
  }

  const handlePostalCodeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address_postal_code: value
    }))
  }

  const handleAddressFound = (address: {
    locality: string
    municipality: string
    district: string
    parish?: string
    street?: string
  }) => {
    setFormData(prev => ({
      ...prev,
      address_city: address.municipality || address.locality,
      address_state: address.district,
      address_neighborhood: address.parish || prev.address_neighborhood,
      address_street: address.street || prev.address_street
    }))
    
    toast.success('Endereço preenchido automaticamente!')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/consultants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nova Consultora</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Dados pessoais da consultora</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+351 XXX XXX XXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="+351 XXX XXX XXX"
                    value={formData.whatsapp}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    name="nif"
                    value={formData.nif}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address - Com preenchimento automático */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Digite o código postal para preencher automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* Código Postal com preenchimento automático */}
              <div className="grid grid-cols-2 gap-4">
                <PostalCodeInput
                  value={formData.address_postal_code}
                  onChange={handlePostalCodeChange}
                  onAddressFound={handleAddressFound}
                  label="Código Postal"
                  required
                />
                <div className="col-span-1 pt-6">
                  <p className="text-sm text-muted-foreground">
                    Digite o código postal e o endereço será preenchido automaticamente
                  </p>
                </div>
              </div>

              {/* Campos preenchidos automaticamente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={formData.address_street}
                    onChange={handleChange}
                    placeholder="Preenchido automaticamente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_number">Número *</Label>
                  <Input
                    id="address_number"
                    name="address_number"
                    value={formData.address_number}
                    onChange={handleChange}
                    placeholder="Nº da porta"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    name="address_complement"
                    value={formData.address_complement}
                    onChange={handleChange}
                    placeholder="Apartamento, andar, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_neighborhood">Freguesia</Label>
                  <Input
                    id="address_neighborhood"
                    name="address_neighborhood"
                    value={formData.address_neighborhood}
                    onChange={handleChange}
                    placeholder="Preenchido automaticamente"
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleChange}
                    placeholder="Preenchido automaticamente"
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">Distrito</Label>
                  <Input
                    id="address_state"
                    name="address_state"
                    value={formData.address_state}
                    onChange={handleChange}
                    placeholder="Preenchido automaticamente"
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Bancários</CardTitle>
              <CardDescription>Informações para pagamento de comissões</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">IBAN</Label>
                  <Input
                    id="bank_iban"
                    name="bank_iban"
                    value={formData.bank_iban}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_holder">Titular da Conta</Label>
                <Input
                  id="bank_account_holder"
                  name="bank_account_holder"
                  value={formData.bank_account_holder}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Commission Settings - Atualizado para 45 dias */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Comissão</CardTitle>
              <CardDescription>Ciclo de comissão de 45 em 45 dias</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">Percentual de Comissão (%)</Label>
                  <Input
                    id="commission_percentage"
                    name="commission_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission_percentage}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_period_days">Período de Comissão</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="commission_period_days"
                      name="commission_period_days"
                      type="number"
                      value={formData.commission_period_days}
                      onChange={handleChange}
                      className="bg-muted"
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_target">Meta por Período (€)</Label>
                  <Input
                    id="monthly_target"
                    name="monthly_target"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Meta para 45 dias"
                    value={formData.monthly_target}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Ciclo de Comissões</p>
                    <p className="text-blue-700">
                      As comissões são calculadas e pagas a cada 45 dias, conforme padrão do mercado de semijoias.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Informações adicionais sobre a consultora..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/consultants">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Consultora"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}