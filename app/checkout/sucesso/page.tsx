"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, Home, Package } from "lucide-react"
import { toast } from "sonner"
import { ConsultantTrackingClient } from "@/lib/consultant-tracking"

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams?.get("orderId")
  const method = searchParams?.get("method")
  const sessionId = searchParams?.get("session_id")
  
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [consultantInfo, setConsultantInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Se tiver session_id do Stripe, verificar o pagamento
        if (sessionId) {
          // Aqui você verificaria o status do pagamento com o Stripe
          // e buscaria detalhes do pedido
        } else if (orderId) {
          // Buscar informações do pedido
          const response = await fetch(`/api/orders/${orderId}`)
          if (response.ok) {
            const data = await response.json()
            setOrderInfo(data)
            
            // Se houver consultora vinculada, buscar informações dela
            if (data.consultant_code) {
              const consultantResponse = await fetch(`/api/consultants/by-code/${data.consultant_code}`)
              if (consultantResponse.ok) {
                const consultantData = await consultantResponse.json()
                setConsultantInfo(consultantData)
              }
            }
          }
        }
        
        // Limpar código de consultora do localStorage após o sucesso
        ConsultantTrackingClient.remove()
        // Manter cookie para tracking futuro
      } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrderDetails()
  }, [sessionId, orderId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência!")
  }

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-muted-foreground">
            Obrigado pela sua compra. Você receberá um email de confirmação em breve.
          </p>
        </div>

        {orderId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detalhes do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Número do Pedido:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">#{orderId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(orderId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {method === 'mbway' && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Pagamento MB Way</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Foi enviado um pedido de pagamento para o seu telemóvel. 
                Por favor, confirme o pagamento na aplicação MB Way.
              </p>
              <p className="text-sm font-semibold">
                O pagamento expira em 5 minutos.
              </p>
            </CardContent>
          </Card>
        )}

        {method === 'transfer' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Dados para Transferência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <p className="text-sm text-muted-foreground">IBAN:</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono">PT50 0000 0000 0000 0000 0000 0</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard("PT50000000000000000000000")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referência:</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold">#{orderId}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(orderId || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Por favor, efetue a transferência em até 3 dias úteis. 
                  O seu pedido será processado após confirmação do pagamento.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {consultantInfo && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Consultora Vinculada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {consultantInfo.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{consultantInfo.full_name}</p>
                  <p className="text-sm text-muted-foreground">Código: {consultantInfo.code}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Esta compra foi vinculada à sua consultora. Ela receberá uma comissão sobre este pedido.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar à Loja
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/conta/pedidos">
              <Package className="mr-2 h-4 w-4" />
              Ver Meus Pedidos
            </Link>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Próximos Passos</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>• Você receberá um email de confirmação com os detalhes do pedido</li>
            <li>• Quando o pedido for enviado, receberá o código de rastreamento</li>
            <li>• Entrega estimada em 2-5 dias úteis</li>
            <li>• Em caso de dúvidas, entre em contato conosco</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}