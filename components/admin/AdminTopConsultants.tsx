"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"
import { TrendingUp } from "lucide-react"

interface TopConsultant {
  id: string
  full_name: string
  code: string
  total_sales: number
  total_commissions: number
  client_count: number
}

export function AdminTopConsultants() {
  const [consultants, setConsultants] = useState<TopConsultant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopConsultants()
  }, [])

  async function loadTopConsultants() {
    try {
      const supabase = createClient()
      
      // Buscar top 5 consultoras por vendas do mês atual
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { data: consultantsData } = await supabase
        .from('consultants')
        .select('*')
        .eq('active', true)
      
      const topConsultants: TopConsultant[] = []
      
      for (const consultant of consultantsData || []) {
        // Buscar vendas do mês
        const { data: commissions } = await supabase
          .from('consultant_commissions')
          .select('order_total, amount')
          .eq('consultant_id', consultant.id)
          .gte('created_at', startOfMonth.toISOString())
          .eq('status', 'approved')
        
        const totalSales = commissions?.reduce((sum, c) => sum + c.order_total, 0) || 0
        const totalCommissions = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0
        
        // Contar clientes
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('consultant_id', consultant.id)
        
        topConsultants.push({
          id: consultant.id,
          full_name: consultant.full_name,
          code: consultant.code,
          total_sales: totalSales,
          total_commissions: totalCommissions,
          client_count: clientCount || 0
        })
      }
      
      // Ordenar por vendas totais
      topConsultants.sort((a, b) => b.total_sales - a.total_sales)
      
      setConsultants(topConsultants.slice(0, 5))
    } catch (error) {
      console.error('Erro ao carregar top consultoras:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Consultoras
        </CardTitle>
        <CardDescription>
          Melhores performances do mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : consultants.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma consultora encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {consultants.map((consultant, index) => (
              <div key={consultant.id} className="flex items-center gap-4">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(consultant.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">1</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{consultant.full_name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {consultant.code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{consultant.client_count} clientes</span>
                    <span>{formatCurrency(consultant.total_sales)} em vendas</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(consultant.total_commissions)}</p>
                  <p className="text-xs text-muted-foreground">em comissões</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}