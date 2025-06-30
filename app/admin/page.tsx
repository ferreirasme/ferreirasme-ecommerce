import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, DollarSign, TrendingUp } from "lucide-react"

export default async function AdminDashboard() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Get statistics
  const [consultantsResult, clientsResult, commissionsResult, ordersResult] = await Promise.all([
    supabase.from('consultants').select('count', { count: 'exact' }),
    supabase.from('clients').select('count', { count: 'exact' }),
    supabase.from('consultant_commissions').select('commission_amount').eq('status', 'pending'),
    supabase.from('orders').select('total').gte('created_at', new Date(new Date().setDate(1)).toISOString())
  ])

  const totalConsultants = consultantsResult.count || 0
  const totalClients = clientsResult.count || 0
  const pendingCommissions = commissionsResult.data?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0
  const monthlyRevenue = ordersResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

  const stats = [
    {
      title: 'Total de Consultoras',
      value: totalConsultants.toString(),
      description: 'Consultoras ativas',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Clientes',
      value: totalClients.toString(),
      description: 'Clientes cadastrados',
      icon: UserPlus,
      color: 'text-green-600'
    },
    {
      title: 'Comissões Pendentes',
      value: `€${pendingCommissions.toFixed(2)}`,
      description: 'Aguardando aprovação',
      icon: DollarSign,
      color: 'text-yellow-600'
    },
    {
      title: 'Vendas do Mês',
      value: `€${monthlyRevenue.toFixed(2)}`,
      description: 'Total de vendas',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Em desenvolvimento...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comissões a Aprovar</CardTitle>
            <CardDescription>Comissões pendentes de aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}