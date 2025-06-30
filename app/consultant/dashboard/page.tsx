'use client'

import { ConsultantGuard } from '@/components/auth/ConsultantGuard'
import { StatsCards } from '@/components/consultant/StatsCards'
import { QuickActions } from '@/components/consultant/QuickActions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp,
  Calendar,
  Users,
  Euro,
  Package,
  Clock,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface RecentActivity {
  id: string
  type: 'order' | 'client' | 'commission'
  title: string
  description: string
  time: string
  icon: any
}

export default function ConsultantDashboardPage() {
  const [consultantCode, setConsultantCode] = useState<string>('')
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchConsultantData()
    fetchRecentActivities()
  }, [])

  const fetchConsultantData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('consultants')
        .select('code')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setConsultantCode(data.code)
      }
    }
  }

  const fetchRecentActivities = async () => {
    // Simular atividades recentes
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'order',
        title: 'Novo Pedido',
        description: 'Maria Silva fez um pedido de €125,00',
        time: '2 horas atrás',
        icon: Package
      },
      {
        id: '2',
        type: 'client',
        title: 'Novo Cliente',
        description: 'Ana Costa foi adicionada à sua carteira',
        time: '5 horas atrás',
        icon: Users
      },
      {
        id: '3',
        type: 'commission',
        title: 'Comissão Aprovada',
        description: 'Comissão de €45,00 foi aprovada',
        time: '1 dia atrás',
        icon: Euro
      }
    ]
    
    setRecentActivities(activities)
  }

  const getActivityIcon = (activity: RecentActivity) => {
    const Icon = activity.icon
    const colors = {
      order: 'text-blue-600 bg-blue-50',
      client: 'text-green-600 bg-green-50',
      commission: 'text-purple-600 bg-purple-50'
    }
    
    return (
      <div className={`rounded-lg p-2 ${colors[activity.type]}`}>
        <Icon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <ConsultantGuard>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho e gerencie suas vendas
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Quick Actions */}
        <QuickActions consultantCode={consultantCode} />

        {/* Recent Activity & Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Atividade Recente</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/consultant/activities">
                    Ver Todas
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Desempenho do Mês</CardTitle>
                <Badge variant="secondary">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date().toLocaleDateString('pt-PT', { month: 'long' })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Meta de Vendas</span>
                  <span className="font-medium">€2.500,00</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: '65%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  65% da meta alcançada (€1.625,00)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Novos Clientes</p>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15% vs mês anterior
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">24%</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +3% vs mês anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Dica do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <strong>Aumente suas vendas:</strong> Entre em contato com clientes que não compram há mais de 30 dias. 
              Ofereça novidades ou promoções exclusivas para reativar o interesse!
            </p>
            <Button variant="link" className="mt-2 p-0 h-auto" asChild>
              <Link href="/consultant/tools">
                Ver mais dicas de vendas →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConsultantGuard>
  )
}