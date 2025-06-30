import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Check, Clock, CreditCard, Shield } from "lucide-react"

export default function KlarnaInfoPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/checkout">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Checkout
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Pague com Klarna</h1>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 bg-pink-500 rounded flex items-center justify-center text-white font-bold">
                  K
                </div>
                O que é Klarna?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Klarna é um método de pagamento que permite parcelar suas compras 
                ou pagar mais tarde, com total segurança e flexibilidade.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Aprovação instantânea</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Sem cartão de crédito necessário</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Proteção ao comprador</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Opções de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Pague em 3x</h4>
                  <p className="text-sm text-muted-foreground">
                    Divida o valor em 3 parcelas mensais sem juros
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Pague em 30 dias</h4>
                  <p className="text-sm text-muted-foreground">
                    Experimente primeiro, pague depois de 30 dias
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Financiamento</h4>
                  <p className="text-sm text-muted-foreground">
                    Para valores maiores, parcele em até 24 meses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Escolha Klarna no checkout</h4>
                  <p className="text-sm text-muted-foreground">
                    Selecione "Cartão / Klarna" como método de pagamento
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Faça login ou cadastre-se</h4>
                  <p className="text-sm text-muted-foreground">
                    Entre na sua conta Klarna ou crie uma nova em segundos
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Escolha como pagar</h4>
                  <p className="text-sm text-muted-foreground">
                    Selecione entre pagar parcelado ou em 30 dias
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Confirmação instantânea</h4>
                  <p className="text-sm text-muted-foreground">
                    Receba aprovação imediata e finalize sua compra
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-semibold mb-1">100% Seguro</h4>
              <p className="text-sm text-muted-foreground">
                Proteção total dos seus dados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-semibold mb-1">Aprovação Rápida</h4>
              <p className="text-sm text-muted-foreground">
                Resposta em segundos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CreditCard className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-semibold mb-1">Sem Taxas Ocultas</h4>
              <p className="text-sm text-muted-foreground">
                Transparência total nos valores
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" asChild>
            <Link href="/checkout">Voltar ao Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}