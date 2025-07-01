'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Save,
  Camera,
  Copy,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone inválido'),
  address: z.string().optional(),
  bio: z.string().max(500, 'Biografia muito longa').optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ConsultantProfile {
  id: string
  name: string
  email: string
  phone: string
  code: string
  avatar_url?: string
  address?: string
  bio?: string
  created_at: string
  status: string
  total_sales: number
  total_commissions: number
  total_clients: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ConsultantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClientComponentClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Buscar dados do consultor
      const { data: consultant, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Buscar estatísticas
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('consultant_id', user.id)

      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount')
        .eq('consultant_id', user.id)

      const totalCommissions = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0

      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('consultant_id', user.id)

      const totalSales = orders?.reduce((sum, o) => sum + o.total, 0) || 0

      const profileData: ConsultantProfile = {
        ...consultant,
        total_clients: clientsCount || 0,
        total_commissions: totalCommissions,
        total_sales: totalSales
      }

      setProfile(profileData)
      reset({
        name: consultant.name,
        email: consultant.email,
        phone: consultant.phone,
        address: consultant.address || '',
        bio: consultant.bio || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('consultants')
        .update({
          name: data.name,
          phone: data.phone,
          address: data.address,
          bio: data.bio
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyCode = async () => {
    if (!profile) return

    try {
      await navigator.clipboard.writeText(profile.code)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar código')
    }
  }

  const handleAvatarUpload = () => {
    toast.info('Upload de avatar em desenvolvimento')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Perfil não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar com informações */}
        <div className="space-y-6">
          {/* Card de perfil */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={handleAvatarUpload}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <h3 className="mt-4 text-lg font-semibold">{profile.name}</h3>
                <Badge variant="default" className="mt-2">
                  <Award className="mr-1 h-3 w-3" />
                  Consultora Ativa
                </Badge>
                
                <div className="mt-4 w-full rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Código de Consultora</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-lg font-semibold">{profile.code}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Consultora desde {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Vendas</span>
                <span className="font-semibold">{formatCurrency(profile.total_sales)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Comissões Ganhas</span>
                <span className="font-semibold">{formatCurrency(profile.total_commissions)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Clientes</span>
                <span className="font-semibold">{profile.total_clients}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de edição */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações de contato e perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      {...register('name')}
                      className="pl-10"
                      placeholder="Seu nome"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="pl-10"
                      placeholder="seu@email.com"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      {...register('phone')}
                      className="pl-10"
                      placeholder="912345678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      {...register('address')}
                      className="pl-10"
                      placeholder="Sua morada"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  placeholder="Conte um pouco sobre você e sua experiência como consultora..."
                  className="resize-none"
                />
                {errors.bio && (
                  <p className="text-xs text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}