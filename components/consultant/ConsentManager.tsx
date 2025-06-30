'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Mail, Database, Bell, Check, X, Info } from 'lucide-react'
import { ConsentType, ConsentStatus, ConsentRecord } from '@/types/consultant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface ConsentManagerProps {
  consultantId: string
  consents: ConsentRecord[]
  onConsentUpdate: (type: ConsentType, status: ConsentStatus) => Promise<void>
  isLoading?: boolean
}

const consentConfig = {
  [ConsentType.MARKETING]: {
    title: 'Comunicações de Marketing',
    description: 'Receber promoções, novidades e ofertas especiais',
    icon: Mail,
    color: 'text-blue-600'
  },
  [ConsentType.DATA_PROCESSING]: {
    title: 'Processamento de Dados',
    description: 'Permitir o processamento dos seus dados para melhorar nossos serviços',
    icon: Database,
    color: 'text-green-600'
  },
  [ConsentType.COMMUNICATIONS]: {
    title: 'Comunicações Gerais',
    description: 'Receber avisos importantes sobre sua conta e pedidos',
    icon: Bell,
    color: 'text-orange-600'
  },
  [ConsentType.NEWSLETTER]: {
    title: 'Newsletter',
    description: 'Receber nossa newsletter mensal com dicas e tendências',
    icon: Mail,
    color: 'text-purple-600'
  }
}

export function ConsentManager({ consultantId, consents, onConsentUpdate, isLoading }: ConsentManagerProps) {
  const [consentStates, setConsentStates] = useState<Record<ConsentType, boolean>>({} as Record<ConsentType, boolean>)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedConsent, setSelectedConsent] = useState<ConsentType | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  // Initialize consent states
  useEffect(() => {
    const states: Record<ConsentType, boolean> = {} as Record<ConsentType, boolean>
    
    Object.values(ConsentType).forEach(type => {
      const consent = consents.find(c => c.type === type && c.status === ConsentStatus.GRANTED)
      states[type] = !!consent
    })
    
    setConsentStates(states)
  }, [consents])

  const handleConsentToggle = async (type: ConsentType, checked: boolean) => {
    setIsUpdating(true)
    try {
      const newStatus = checked ? ConsentStatus.GRANTED : ConsentStatus.REVOKED
      await onConsentUpdate(type, newStatus)
      
      setConsentStates(prev => ({ ...prev, [type]: checked }))
      
      toast({
        title: checked ? 'Consentimento concedido' : 'Consentimento revogado',
        description: `${consentConfig[type].title} foi ${checked ? 'ativado' : 'desativado'}.`
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o consentimento.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const showConsentDetails = (type: ConsentType) => {
    setSelectedConsent(type)
    setShowDetailsDialog(true)
  }

  const getConsentHistory = (type: ConsentType) => {
    return consents
      .filter(c => c.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestão de Consentimentos
          </CardTitle>
          <CardDescription>
            Gerencie suas preferências de comunicação e privacidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Consentimentos Ativos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4 mt-6">
              {Object.entries(consentConfig).map(([type, config]) => {
                const Icon = config.icon
                const isGranted = consentStates[type as ConsentType]
                
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg bg-gray-100 ${config.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{config.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showConsentDetails(type as ConsentType)}
                            disabled={isLoading || isUpdating}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                          <Switch
                            checked={isGranted}
                            onCheckedChange={(checked) => handleConsentToggle(type as ConsentType, checked)}
                            disabled={isLoading || isUpdating}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <div className="space-y-4">
                {Object.values(ConsentType).map(type => {
                  const history = getConsentHistory(type)
                  if (history.length === 0) return null
                  
                  return (
                    <Card key={type} className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        {consentConfig[type].icon && (() => {
                          const Icon = consentConfig[type].icon
                          return <Icon className="w-4 h-4" />
                        })()}
                        {consentConfig[type].title}
                      </h4>
                      <div className="space-y-2">
                        {history.slice(0, 3).map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {record.status === ConsentStatus.GRANTED ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                              <span>
                                {record.status === ConsentStatus.GRANTED ? 'Concedido' : 'Revogado'}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {format(new Date(record.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                locale: pt
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Consent Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedConsent && consentConfig[selectedConsent].title}
            </DialogTitle>
            <DialogDescription>
              Detalhes sobre este consentimento
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">O que significa este consentimento?</h4>
                <p className="text-sm text-muted-foreground">
                  {consentConfig[selectedConsent].description}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Como usamos seus dados?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedConsent === ConsentType.MARKETING && (
                    <>
                      <li>• Enviar ofertas personalizadas</li>
                      <li>• Informar sobre novos produtos</li>
                      <li>• Convidar para eventos exclusivos</li>
                    </>
                  )}
                  {selectedConsent === ConsentType.DATA_PROCESSING && (
                    <>
                      <li>• Analisar preferências de compra</li>
                      <li>• Melhorar recomendações de produtos</li>
                      <li>• Otimizar a experiência de compra</li>
                    </>
                  )}
                  {selectedConsent === ConsentType.COMMUNICATIONS && (
                    <>
                      <li>• Enviar confirmações de pedidos</li>
                      <li>• Atualizar sobre status de entregas</li>
                      <li>• Comunicar mudanças importantes</li>
                    </>
                  )}
                  {selectedConsent === ConsentType.NEWSLETTER && (
                    <>
                      <li>• Enviar dicas de moda e tendências</li>
                      <li>• Compartilhar conteúdo exclusivo</li>
                      <li>• Oferecer descontos para assinantes</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Status atual</h4>
                <Badge
                  variant={consentStates[selectedConsent] ? 'default' : 'secondary'}
                >
                  {consentStates[selectedConsent] ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}