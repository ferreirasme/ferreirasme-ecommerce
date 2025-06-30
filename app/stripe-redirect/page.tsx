"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function StripeRedirectPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // Redirecionar diretamente para o Stripe Checkout
      window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`
    }
  }, [sessionId])

  return (
    <div className="container py-8 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Redirecionando para pagamento...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground text-center">
            Você está sendo redirecionado para a página segura de pagamento.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground text-center">
              Se não for redirecionado automaticamente,{' '}
              <a 
                href={`https://checkout.stripe.com/c/pay/${sessionId}`}
                className="text-primary underline"
              >
                clique aqui
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}