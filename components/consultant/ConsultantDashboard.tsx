'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  Plus,
  Settings,
  FileText,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsultantForm } from './ConsultantForm'
import { ClientForm } from './ClientForm'
import { ConsentManager } from './ConsentManager'
import { CommissionList } from './CommissionList'
import { useConsultant } from '@/hooks/useConsultant'
import { useCommissions } from '@/hooks/useCommissions'
import { useConsent } from '@/hooks/useConsent'
import { useConsultantStore } from '@/store/consultant-store'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ConsultantDashboard() {
  const [showClientForm, setShowClientForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { consultant, dashboard, isLoading: consultantLoading } = useConsultant()
  const { commissions, isLoading: commissionsLoading, exportCommissions } = useCommissions()
  const { consents, updateConsent, isLoading: consentsLoading } = useConsent()
  const { clients, addClient } = useConsultantStore()
  
  // Load initial data
  useEffect(() => {
    if (consultant?.id) {
      // In a real app, these would fetch data from the API
      console.log('Loading consultant data...')
    }
  }, [consultant?.id])
  
  const handleClientSubmit = async (data: any) => {
    // Create new client
    const newClient = {
      id: Date.now().toString(),
      consultantId: consultant?.id || '1',
      status: 'ACTIVE' as const,
      ...data,
      registrationDate: new Date().toISOString(),
      totalPurchases: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    addClient(newClient)
    setShowClientForm(false)
  }
  
  const handleConsentUpdate = async (type: any, status: any) => {
    if (!consultant?.id) return
    
    await updateConsent({
      consultantId: consultant.id,
      type,
      status,
      ipAddress: '0.0.0.0',
      userAgent: navigator.userAgent
    })
  }
  
  const isLoading = consultantLoading || commissionsLoading || consentsLoading
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Painel da Consultora</h1>
          <p className="text-muted-foreground">
            Bem-vinda, {consultant?.firstName || 'Consultora'}!
          </p>
        </div>
        <Button onClick={() => setShowClientForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalClients || 0}</div>
            <p className="text-sm text-muted-foreground">
              {dashboard?.activeClients || 0} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Comissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalCommissions || 0}</div>
            <p className="text-sm text-muted-foreground">
              {dashboard?.pendingCommissions || 0} pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ganhos Totais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard?.totalEarnings || 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(dashboard?.monthlyEarnings || 0)} este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Comissão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultant?.commissionRate || 10}%</div>
            <p className="text-sm text-muted-foreground">
              Sobre vendas realizadas
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Atividades</CardTitle>
              <CardDescription>
                Suas atividades recentes e próximas ações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Novo pedido realizado</p>
                      <p className="text-sm text-muted-foreground">Cliente: Ana Santos - Valor: €150</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Há 2 horas</span>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Comissão aprovada</p>
                      <p className="text-sm text-muted-foreground">Valor: €25,00</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Ontem</span>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Novo cliente cadastrado</p>
                      <p className="text-sm text-muted-foreground">Maria Oliveira</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Há 3 dias</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="commissions">
          <CommissionList 
            commissions={commissions}
            onExport={exportCommissions}
            isLoading={commissionsLoading}
          />
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Clientes</CardTitle>
              <CardDescription>
                Gerencie sua carteira de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Você ainda não tem clientes cadastrados
                    </p>
                    <Button onClick={() => setShowClientForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Primeiro Cliente
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {client.firstName} {client.lastName}
                            </CardTitle>
                            <CardDescription>{client.email}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Telefone:</span>
                                <span>{client.phone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total gasto:</span>
                                <span className="font-medium">
                                  {formatCurrency(client.totalSpent)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pedidos:</span>
                                <span>{client.totalPurchases}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacidade e Consentimentos
              </CardTitle>
              <CardDescription>
                Gerencie suas preferências de comunicação e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsentManager
                consultantId={consultant?.id || '1'}
                consents={consents}
                onConsentUpdate={handleConsentUpdate}
                isLoading={consentsLoading}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e bancárias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Editar Informações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Client Form Dialog */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            <DialogDescription>
              Adicione um novo cliente à sua carteira
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            consultantId={consultant?.id || '1'}
            onSubmit={handleClientSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}