"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewConsultantPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
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
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First create a user account for the consultant
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        options: {
          data: {
            full_name: formData.full_name,
            role: 'consultant'
          }
        }
      })

      if (authError) throw authError

      // Then create the consultant record
      const { error: consultantError } = await supabase
        .from('consultants')
        .insert({
          user_id: authData.user?.id,
          code: await generateConsultantCode(),
          ...formData,
          commission_percentage: parseFloat(formData.commission_percentage),
          monthly_target: parseFloat(formData.monthly_target),
          status: 'pending',
          consent_date: new Date().toISOString(),
          consent_version: '1.0.0'
        })

      if (consultantError) throw consultantError

      toast.success('Consultora criada com sucesso!')
      router.push('/admin/consultants')
    } catch (error: any) {
      console.error('Error creating consultant:', error)
      toast.error(error.message || 'Erro ao criar consultora')
    } finally {
      setLoading(false)
    }
  }

  const generateConsultantCode = async () => {
    // This is a simple implementation. In production, you might want to use a database function
    const randomNum = Math.floor(Math.random() * 10000)
    return `CONS${randomNum.toString().padStart(4, '0')}`
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

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Endereço da consultora</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={formData.address_street}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_number">Número</Label>
                  <Input
                    id="address_number"
                    name="address_number"
                    value={formData.address_number}
                    onChange={handleChange}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_neighborhood">Freguesia</Label>
                  <Input
                    id="address_neighborhood"
                    name="address_neighborhood"
                    value={formData.address_neighborhood}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">Distrito</Label>
                  <Input
                    id="address_state"
                    name="address_state"
                    value={formData.address_state}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_postal_code">Código Postal</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={formData.address_postal_code}
                    onChange={handleChange}
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

          {/* Commission Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Comissão</CardTitle>
              <CardDescription>Defina as regras de comissão</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="monthly_target">Meta Mensal (€)</Label>
                  <Input
                    id="monthly_target"
                    name="monthly_target"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthly_target}
                    onChange={handleChange}
                  />
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