'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Share2,
  Link,
  Image,
  FileText,
  MessageSquare,
  Copy,
  Download,
  CheckCircle,
  Instagram,
  Facebook,
  Mail,
  Smartphone,
  QrCode,
  Calculator,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface SalesToolProps {
  consultantCode: string
}

export default function ToolsPage() {
  const consultantCode = 'CONS001' // Em produção, buscar do contexto
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  
  const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ferreirasme.com'}?ref=${consultantCode}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopiedLink(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(id)
      toast.success('Texto copiado!')
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar texto')
    }
  }

  const handleDownloadQR = () => {
    toast.info('Download do QR Code em desenvolvimento')
  }

  const messageTemplates = [
    {
      id: 'welcome',
      title: 'Mensagem de Boas-vindas',
      text: `Olá! 😊 Sou consultora Ferreiras ME e adoraria te apresentar nossa linda coleção de semijoias! Temos peças exclusivas com garantia e ótimos preços. Confira nosso catálogo: ${shareLink}`,
      icon: MessageSquare
    },
    {
      id: 'promo',
      title: 'Promoção Especial',
      text: `🎉 PROMOÇÃO IMPERDÍVEL! Compre 2 peças e ganhe 10% de desconto! Válido até o final do mês. Veja todas as opções: ${shareLink}`,
      icon: FileText
    },
    {
      id: 'new',
      title: 'Novidades',
      text: `✨ Chegaram as NOVIDADES! Confira nossa nova coleção de semijoias que acabou de chegar. Peças lindas e exclusivas esperando por você: ${shareLink}`,
      icon: Image
    },
    {
      id: 'follow',
      title: 'Acompanhamento',
      text: `Oi! Tudo bem? Vi que você demonstrou interesse em nossas semijoias. Posso te ajudar com alguma dúvida ou te mostrar mais opções? 💎`,
      icon: Mail
    }
  ]

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'text-green-600 bg-green-50',
      action: () => {
        const text = encodeURIComponent(`Confira as lindas semijoias da Ferreiras ME! ${shareLink}`)
        window.open(`https://wa.me/?text=${text}`, '_blank')
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600 bg-pink-50',
      action: () => toast.info('Copie o link e cole no seu story ou bio!')
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600 bg-blue-50',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-purple-600 bg-purple-50',
      action: () => {
        const subject = encodeURIComponent('Conheça as Semijoias Ferreiras ME')
        const body = encodeURIComponent(`Olá!\n\nGostaria de compartilhar com você o catálogo de semijoias da Ferreiras ME.\n\nAcesse: ${shareLink}\n\nAbraços!`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ferramentas de Venda</h1>
        <p className="text-muted-foreground">
          Recursos para impulsionar suas vendas
        </p>
      </div>

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="calculator">Calculadora</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-6">
          {/* Link personalizado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Seu Link Personalizado
              </CardTitle>
              <CardDescription>
                Compartilhe este link com seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  {copiedLink ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon
                  
                  return (
                    <Button
                      key={platform.name}
                      variant="outline"
                      className="justify-start"
                      onClick={platform.action}
                    >
                      <div className={`mr-2 rounded-lg p-1.5 ${platform.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {platform.name}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code da Loja
              </CardTitle>
              <CardDescription>
                Use em materiais impressos ou digitais
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="rounded-lg border-4 border-muted p-4">
                <div className="h-48 w-48 bg-muted flex items-center justify-center">
                  <QrCode className="h-32 w-32 text-muted-foreground" />
                </div>
              </div>
              <Button onClick={handleDownloadQR}>
                <Download className="mr-2 h-4 w-4" />
                Baixar QR Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {messageTemplates.map((template) => {
            const Icon = template.icon
            
            return (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" />
                    {template.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {template.text}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyText(template.text, template.id)}
                  >
                    {copiedText === template.id ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Mensagem
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Catálogo Digital
                </CardTitle>
                <CardDescription>
                  PDF com todos os produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Catálogo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tabela de Preços
                </CardTitle>
                <CardDescription>
                  Lista atualizada de preços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Tabela
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Guia de Vendas
                </CardTitle>
                <CardDescription>
                  Dicas e estratégias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Guia
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Stories Prontos
                </CardTitle>
                <CardDescription>
                  Templates para Instagram
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Comissões
              </CardTitle>
              <CardDescription>
                Calcule seus ganhos em cada venda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Venda (€)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  step="0.01"
                  className="text-lg"
                />
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Comissão (10%)</span>
                  <span className="font-medium">€0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto Cliente</span>
                  <span className="font-medium">-€0.00</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-medium">Ganho Total</span>
                  <span className="text-lg font-bold text-primary">€0.00</span>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Ofereça descontos estratégicos para aumentar o ticket médio. 
                  Por exemplo, 5% de desconto em compras acima de €100.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Import necessário que estava faltando
import { Separator } from '@/components/ui/separator'