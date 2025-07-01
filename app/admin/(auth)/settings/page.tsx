"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  Settings, 
  Store, 
  Mail, 
  CreditCard, 
  Truck,
  Globe,
  Bell,
  Shield,
  Database,
  Save,
  RefreshCw
} from "lucide-react"

interface SystemSettings {
  // Store Settings
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  store_postal_code: string
  store_city: string
  store_country: string
  store_vat: string
  
  // Email Settings
  email_from_name: string
  email_from_address: string
  email_reply_to: string
  email_notifications_enabled: boolean
  
  // Payment Settings
  payment_methods_enabled: string[]
  stripe_enabled: boolean
  mbway_enabled: boolean
  bank_transfer_enabled: boolean
  bank_transfer_details: string
  
  // Shipping Settings
  shipping_enabled: boolean
  free_shipping_threshold: number
  default_shipping_cost: number
  shipping_zones: any[]
  
  // Commission Settings
  default_commission_percentage: number
  commission_period_days: number
  minimum_payout_amount: number
  
  // Features
  features_consultant_registration: boolean
  features_product_reviews: boolean
  features_wishlist: boolean
  features_compare: boolean
  
  // SEO
  seo_title: string
  seo_description: string
  seo_keywords: string
  
  // Maintenance
  maintenance_mode: boolean
  maintenance_message: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    store_name: 'Ferreira\'s Me',
    store_email: 'contato@ferreirasme.pt',
    store_phone: '+351 123 456 789',
    store_address: 'Rua Principal, 123',
    store_postal_code: '1000-001',
    store_city: 'Lisboa',
    store_country: 'PT',
    store_vat: 'PT123456789',
    
    email_from_name: 'Ferreira\'s Me',
    email_from_address: 'noreply@ferreirasme.pt',
    email_reply_to: 'contato@ferreirasme.pt',
    email_notifications_enabled: true,
    
    payment_methods_enabled: ['stripe', 'mbway', 'bank_transfer'],
    stripe_enabled: true,
    mbway_enabled: true,
    bank_transfer_enabled: true,
    bank_transfer_details: '',
    
    shipping_enabled: true,
    free_shipping_threshold: 50,
    default_shipping_cost: 5,
    shipping_zones: [],
    
    default_commission_percentage: 10,
    commission_period_days: 45,
    minimum_payout_amount: 50,
    
    features_consultant_registration: true,
    features_product_reviews: true,
    features_wishlist: true,
    features_compare: false,
    
    seo_title: 'Ferreira\'s Me - Semijoias de Qualidade',
    seo_description: 'Descubra nossa coleção exclusiva de semijoias',
    seo_keywords: 'semijoias, joias, acessórios, moda',
    
    maintenance_mode: false,
    maintenance_message: 'Site em manutenção. Voltamos em breve!'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("store")

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error: any) {
      console.error('Error loading settings:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'default',
          settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof SystemSettings] as any || {}),
        [field]: value
      }
    }))
  }

  const clearCache = async () => {
    try {
      // In a real app, this would clear Redis or other cache
      toast.success('Cache limpo com sucesso!')
    } catch (error) {
      toast.error('Erro ao limpar cache')
    }
  }

  const testEmailSettings = async () => {
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.store_email,
          from_name: settings.email_from_name,
          from_address: settings.email_from_address
        })
      })

      if (!response.ok) throw new Error('Failed to send test email')

      toast.success('Email de teste enviado!')
    } catch (error) {
      toast.error('Erro ao enviar email de teste')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as configurações gerais do sistema
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="store">
            <Store className="h-4 w-4 mr-2" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="h-4 w-4 mr-2" />
            Envio
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <Globe className="h-4 w-4 mr-2" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4 mr-2" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>
                Dados principais da sua loja online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="store_name">Nome da Loja</Label>
                  <Input
                    id="store_name"
                    value={settings.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store_vat">NIF</Label>
                  <Input
                    id="store_vat"
                    value={settings.store_vat}
                    onChange={(e) => handleChange('store_vat', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="store_email">Email</Label>
                  <Input
                    id="store_email"
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => handleChange('store_email', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store_phone">Telefone</Label>
                  <Input
                    id="store_phone"
                    value={settings.store_phone}
                    onChange={(e) => handleChange('store_phone', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="store_address">Endereço</Label>
                <Input
                  id="store_address"
                  value={settings.store_address}
                  onChange={(e) => handleChange('store_address', e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="store_postal_code">Código Postal</Label>
                  <Input
                    id="store_postal_code"
                    value={settings.store_postal_code}
                    onChange={(e) => handleChange('store_postal_code', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store_city">Cidade</Label>
                  <Input
                    id="store_city"
                    value={settings.store_city}
                    onChange={(e) => handleChange('store_city', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store_country">País</Label>
                  <Input
                    id="store_country"
                    value={settings.store_country}
                    onChange={(e) => handleChange('store_country', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>
                Otimização para motores de busca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="seo_title">Título SEO</Label>
                <Input
                  id="seo_title"
                  value={settings.seo_title}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seo_description">Descrição SEO</Label>
                <Textarea
                  id="seo_description"
                  value={settings.seo_description}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seo_keywords">Palavras-chave</Label>
                <Input
                  id="seo_keywords"
                  value={settings.seo_keywords}
                  onChange={(e) => handleChange('seo_keywords', e.target.value)}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure o envio de emails do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email_from_name">Nome do Remetente</Label>
                  <Input
                    id="email_from_name"
                    value={settings.email_from_name}
                    onChange={(e) => handleChange('email_from_name', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email_from_address">Email do Remetente</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    value={settings.email_from_address}
                    onChange={(e) => handleChange('email_from_address', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email_reply_to">Email para Respostas</Label>
                <Input
                  id="email_reply_to"
                  type="email"
                  value={settings.email_reply_to}
                  onChange={(e) => handleChange('email_reply_to', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar envio de emails de notificação
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications_enabled}
                  onCheckedChange={(checked) => handleChange('email_notifications_enabled', checked)}
                />
              </div>

              <Separator />

              <Button onClick={testEmailSettings} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email de Teste
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Configure os métodos de pagamento aceitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stripe</Label>
                    <p className="text-sm text-muted-foreground">
                      Cartões de crédito e débito
                    </p>
                  </div>
                  <Switch
                    checked={settings.stripe_enabled}
                    onCheckedChange={(checked) => handleChange('stripe_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>MB Way</Label>
                    <p className="text-sm text-muted-foreground">
                      Pagamento via telemóvel
                    </p>
                  </div>
                  <Switch
                    checked={settings.mbway_enabled}
                    onCheckedChange={(checked) => handleChange('mbway_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transferência Bancária</Label>
                    <p className="text-sm text-muted-foreground">
                      Pagamento por transferência
                    </p>
                  </div>
                  <Switch
                    checked={settings.bank_transfer_enabled}
                    onCheckedChange={(checked) => handleChange('bank_transfer_enabled', checked)}
                  />
                </div>
              </div>

              {settings.bank_transfer_enabled && (
                <>
                  <Separator />
                  <div className="grid gap-2">
                    <Label htmlFor="bank_transfer_details">
                      Dados para Transferência
                    </Label>
                    <Textarea
                      id="bank_transfer_details"
                      value={settings.bank_transfer_details}
                      onChange={(e) => handleChange('bank_transfer_details', e.target.value)}
                      rows={4}
                      placeholder="IBAN: PT50 0000 0000 0000 0000 0000 0
Nome: Ferreira's Me Lda
Banco: ..."
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Envio</CardTitle>
              <CardDescription>
                Configure as opções de envio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sistema de Envio</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar cálculo de frete
                  </p>
                </div>
                <Switch
                  checked={settings.shipping_enabled}
                  onCheckedChange={(checked) => handleChange('shipping_enabled', checked)}
                />
              </div>

              {settings.shipping_enabled && (
                <>
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="free_shipping_threshold">
                        Valor para Frete Grátis (€)
                      </Label>
                      <Input
                        id="free_shipping_threshold"
                        type="number"
                        step="0.01"
                        value={settings.free_shipping_threshold}
                        onChange={(e) => handleChange('free_shipping_threshold', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="default_shipping_cost">
                        Custo Padrão de Envio (€)
                      </Label>
                      <Input
                        id="default_shipping_cost"
                        type="number"
                        step="0.01"
                        value={settings.default_shipping_cost}
                        onChange={(e) => handleChange('default_shipping_cost', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings */}
        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Comissões</CardTitle>
              <CardDescription>
                Configure as regras de comissão para consultoras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="default_commission_percentage">
                    Comissão Padrão (%)
                  </Label>
                  <Input
                    id="default_commission_percentage"
                    type="number"
                    step="0.1"
                    value={settings.default_commission_percentage}
                    onChange={(e) => handleChange('default_commission_percentage', parseFloat(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="commission_period_days">
                    Período de Retenção (dias)
                  </Label>
                  <Input
                    id="commission_period_days"
                    type="number"
                    value={settings.commission_period_days}
                    onChange={(e) => handleChange('commission_period_days', parseInt(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minimum_payout_amount">
                    Valor Mínimo para Saque (€)
                  </Label>
                  <Input
                    id="minimum_payout_amount"
                    type="number"
                    step="0.01"
                    value={settings.minimum_payout_amount}
                    onChange={(e) => handleChange('minimum_payout_amount', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
              <CardDescription>
                Ative ou desative funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cadastro de Consultoras</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que novas consultoras se cadastrem
                  </p>
                </div>
                <Switch
                  checked={settings.features_consultant_registration}
                  onCheckedChange={(checked) => handleChange('features_consultant_registration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Avaliações de Produtos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que clientes avaliem produtos
                  </p>
                </div>
                <Switch
                  checked={settings.features_product_reviews}
                  onCheckedChange={(checked) => handleChange('features_product_reviews', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lista de Desejos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que clientes salvem produtos favoritos
                  </p>
                </div>
                <Switch
                  checked={settings.features_wishlist}
                  onCheckedChange={(checked) => handleChange('features_wishlist', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Comparação de Produtos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir comparação entre produtos
                  </p>
                </div>
                <Switch
                  checked={settings.features_compare}
                  onCheckedChange={(checked) => handleChange('features_compare', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modo de Manutenção</CardTitle>
              <CardDescription>
                Coloque o site em manutenção temporariamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitantes verão uma mensagem de manutenção
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
                />
              </div>

              {settings.maintenance_mode && (
                <>
                  <Separator />
                  <div className="grid gap-2">
                    <Label htmlFor="maintenance_message">
                      Mensagem de Manutenção
                    </Label>
                    <Textarea
                      id="maintenance_message"
                      value={settings.maintenance_message}
                      onChange={(e) => handleChange('maintenance_message', e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sistema</CardTitle>
              <CardDescription>
                Ações de manutenção do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearCache}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Backup do Banco
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}