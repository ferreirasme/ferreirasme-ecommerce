'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Bell, Mail, Smartphone, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useConsultantStore } from '@/store/consultant-store'

interface NotificationPreferences {
  email_new_commission: boolean
  email_payment_approved: boolean
  email_new_client: boolean
  email_monthly_report: boolean
  email_marketing: boolean
  sms_new_commission: boolean
  sms_payment_approved: boolean
  push_notifications: boolean
}

export default function PreferencesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { currentConsultant } = useConsultantStore()
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_new_commission: true,
    email_payment_approved: true,
    email_new_client: true,
    email_monthly_report: true,
    email_marketing: false,
    sms_new_commission: false,
    sms_payment_approved: false,
    push_notifications: true,
  })

  useEffect(() => {
    if (currentConsultant) {
      loadPreferences()
    }
  }, [currentConsultant])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('consultant_preferences')
        .select('*')
        .eq('consultant_id', currentConsultant?.id)
        .single()

      if (data) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    if (!currentConsultant) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('consultant_preferences')
        .upsert({
          consultant_id: currentConsultant.id,
          preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Preferências salvas com sucesso!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Erro ao salvar preferências')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!confirm('Tem certeza que deseja cancelar todas as notificações por email?')) {
      return
    }

    setLoading(true)
    try {
      const newPreferences = {
        ...preferences,
        email_new_commission: false,
        email_payment_approved: false,
        email_new_client: false,
        email_monthly_report: false,
        email_marketing: false,
      }

      const { error } = await supabase
        .from('consultant_preferences')
        .upsert({
          consultant_id: currentConsultant?.id,
          preferences: newPreferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setPreferences(newPreferences)
      toast.success('Notificações por email desativadas')
    } catch (error) {
      console.error('Error unsubscribing:', error)
      toast.error('Erro ao desativar notificações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Preferências de Notificação</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie como você recebe atualizações sobre suas vendas e comissões
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificações por Email
            </CardTitle>
            <CardDescription>
              Escolha quais emails você deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_new_commission" className="flex-1">
                <div className="font-medium">Nova Comissão</div>
                <div className="text-sm text-muted-foreground">
                  Receba um email quando uma nova comissão for registrada
                </div>
              </Label>
              <Switch
                id="email_new_commission"
                checked={preferences.email_new_commission}
                onCheckedChange={() => handleToggle('email_new_commission')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="email_payment_approved" className="flex-1">
                <div className="font-medium">Pagamento Aprovado</div>
                <div className="text-sm text-muted-foreground">
                  Notificação quando seu pagamento for aprovado
                </div>
              </Label>
              <Switch
                id="email_payment_approved"
                checked={preferences.email_payment_approved}
                onCheckedChange={() => handleToggle('email_payment_approved')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="email_new_client" className="flex-1">
                <div className="font-medium">Nova Cliente</div>
                <div className="text-sm text-muted-foreground">
                  Seja notificada quando uma nova cliente for vinculada
                </div>
              </Label>
              <Switch
                id="email_new_client"
                checked={preferences.email_new_client}
                onCheckedChange={() => handleToggle('email_new_client')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="email_monthly_report" className="flex-1">
                <div className="font-medium">Relatório Mensal</div>
                <div className="text-sm text-muted-foreground">
                  Receba um resumo mensal de suas vendas e comissões
                </div>
              </Label>
              <Switch
                id="email_monthly_report"
                checked={preferences.email_monthly_report}
                onCheckedChange={() => handleToggle('email_monthly_report')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="email_marketing" className="flex-1">
                <div className="font-medium">Comunicações de Marketing</div>
                <div className="text-sm text-muted-foreground">
                  Novidades, promoções e dicas para aumentar suas vendas
                </div>
              </Label>
              <Switch
                id="email_marketing"
                checked={preferences.email_marketing}
                onCheckedChange={() => handleToggle('email_marketing')}
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Notificações por SMS
            </CardTitle>
            <CardDescription>
              Receba alertas importantes por mensagem de texto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms_new_commission" className="flex-1">
                <div className="font-medium">Nova Comissão</div>
                <div className="text-sm text-muted-foreground">
                  SMS quando uma nova comissão for registrada
                </div>
              </Label>
              <Switch
                id="sms_new_commission"
                checked={preferences.sms_new_commission}
                onCheckedChange={() => handleToggle('sms_new_commission')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="sms_payment_approved" className="flex-1">
                <div className="font-medium">Pagamento Aprovado</div>
                <div className="text-sm text-muted-foreground">
                  SMS quando seu pagamento for aprovado
                </div>
              </Label>
              <Switch
                id="sms_payment_approved"
                checked={preferences.sms_payment_approved}
                onCheckedChange={() => handleToggle('sms_payment_approved')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações no App
            </CardTitle>
            <CardDescription>
              Receba notificações em tempo real no aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="push_notifications" className="flex-1">
                <div className="font-medium">Notificações Push</div>
                <div className="text-sm text-muted-foreground">
                  Alertas instantâneos sobre suas vendas e comissões
                </div>
              </Label>
              <Switch
                id="push_notifications"
                checked={preferences.push_notifications}
                onCheckedChange={() => handleToggle('push_notifications')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="ghost"
            onClick={handleUnsubscribe}
            disabled={loading}
          >
            Cancelar todos os emails
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Preferências
          </Button>
        </div>
      </div>

      {/* LGPD Notice */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Aviso de Privacidade:</strong> Respeitamos sua privacidade e 
          cumprimos com a LGPD. Você pode alterar suas preferências de comunicação 
          a qualquer momento. Seus dados são usados apenas para os fins consentidos.
        </p>
      </div>
    </div>
  )
}