import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const orderNumber = `#${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-lg text-muted-foreground">
            Obrigado pela sua compra. O seu pedido foi recebido com sucesso.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
                <p className="text-2xl font-bold">{orderNumber}</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium">Email de Confirmação</p>
                    <p className="text-sm text-muted-foreground">
                      Enviámos os detalhes do pedido para o seu email
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium">Prazo de Entrega</p>
                    <p className="text-sm text-muted-foreground">
                      2-5 dias úteis para Portugal Continental
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="bg-muted rounded-lg p-6">
            <h3 className="font-semibold mb-3">O que acontece a seguir?</h3>
            <ol className="space-y-2 text-sm text-left">
              <li className="flex items-start gap-2">
                <span className="font-semibold">1.</span>
                <span>Receberá um email com a confirmação e os detalhes do pedido</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">2.</span>
                <span>Vamos preparar cuidadosamente o seu pedido</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">3.</span>
                <span>Receberá um código de rastreamento quando o pedido for enviado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">4.</span>
                <span>A encomenda será entregue no endereço indicado</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/produtos">
                Continuar a Comprar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/conta/pedidos">
                Ver Meus Pedidos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}