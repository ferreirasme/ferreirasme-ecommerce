"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { stripePromise } from "@/lib/stripe/client"
import { toast } from "sonner"

export default function TestStripePage() {
  const [loading, setLoading] = useState(false)

  const testStripeConnection = async () => {
    setLoading(true)
    
    try {
      // Testar se o Stripe carrega corretamente
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error("Stripe não foi carregado. Verifique a chave pública.")
      }
      
      toast.success("Stripe carregado com sucesso! A chave pública está configurada corretamente.")
      
      // Testar criação de sessão de checkout
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: 'test-1',
            name: 'Produto de Teste',
            price: 10.00,
            quantity: 1,
            image_url: '/images/placeholder.svg'
          }],
          customerInfo: {
            email: 'teste@example.com',
            firstName: 'Teste',
            lastName: 'Cliente',
            phone: '+351912345678',
            address: 'Rua Teste, 123',
            city: 'Lisboa',
            postalCode: '1000-000'
          }
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Erro na API: ${error}`)
      }
      
      const data = await response.json()
      
      if (data.sessionId) {
        toast.success("Sessão de checkout criada com sucesso!")
        
        // Opcionalmente, redirecionar para o checkout
        const confirmRedirect = confirm("Deseja ser redirecionado para o checkout de teste?")
        if (confirmRedirect) {
          const { error } = await stripe.redirectToCheckout({ 
            sessionId: data.sessionId 
          })
          
          if (error) {
            throw error
          }
        }
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Teste de Integração Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Status da Configuração:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Chave Pública: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ Não configurada'}</li>
              <li>URL do Site: {process.env.NEXT_PUBLIC_URL ? '✅ Configurada' : '❌ Não configurada'}</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={testStripeConnection}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testando...' : 'Testar Conexão com Stripe'}
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Cartões de Teste:</h4>
            <ul className="text-sm space-y-1">
              <li>✅ Sucesso: 4242 4242 4242 4242</li>
              <li>❌ Falha: 4000 0000 0000 0002</li>
              <li>🔐 3D Secure: 4000 0025 0000 3155</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Use qualquer data futura para validade e qualquer CVC de 3 dígitos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}