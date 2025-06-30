import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, ShieldCheck, Truck } from "lucide-react"
import Link from "next/link"

export function PaymentMethodsInfo() {
  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <h4 className="font-semibold mb-4">Métodos de Pagamento Disponíveis</h4>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Cartão de Crédito/Débito</p>
              <p className="text-sm text-muted-foreground">
                Visa, Mastercard, American Express
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-pink-500 rounded flex items-center justify-center text-[10px] font-bold text-white mt-0.5">
              K
            </div>
            <div className="flex-1">
              <p className="font-medium">Klarna</p>
              <p className="text-sm text-muted-foreground">
                Parcele sua compra em até 3x sem juros ou pague em 30 dias
              </p>
              <Link href="/klarna-info" className="text-xs text-primary hover:underline">
                Saiba mais sobre o Klarna →
              </Link>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Pagamento 100% seguro processado pelo Stripe
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Ao selecionar "Cartão / Klarna", você será redirecionado para uma página segura 
            onde poderá escolher entre pagar com cartão ou usar o Klarna para parcelar.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}