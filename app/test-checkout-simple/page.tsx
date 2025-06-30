"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { stripePromise } from "@/lib/stripe/client"
import { toast } from "sonner"

export default function TestCheckoutSimplePage() {
  const [loading, setLoading] = useState(false)

  const testCheckout = async () => {
    setLoading(true)
    
    try {
      // Criar sessão de checkout mínima
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
            image_url: null
          }],
          customerInfo: {
            email: 'teste@example.com',
            firstName: 'Teste',
            lastName: 'Cliente',
            phone: '+351912345678',
            address: 'Rua Teste, 123',
            addressComplement: '',
            city: 'Lisboa',
            postalCode: '1000-000',
            paymentMethod: 'card'
          }
        }),
      })
      
      const responseText = await response.text()
      console.log('Response:', responseText)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText }
        }
        throw new Error(errorData.error || `Erro HTTP ${response.status}`)
      }
      
      const data = JSON.parse(responseText)
      
      if (data.sessionId) {
        toast.success("Sessão criada! Redirecionando...")
        
        const stripe = await stripePromise
        if (!stripe) {
          throw new Error('Stripe não carregado')
        }
        
        const { error } = await stripe.redirectToCheckout({ 
          sessionId: data.sessionId 
        })
        
        if (error) {
          throw error
        }
      }
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Teste de Checkout Simples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Informações do teste:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Produto: Produto de Teste (€10.00)</li>
              <li>Cliente: teste@example.com</li>
              <li>Endereço: Lisboa, Portugal</li>
            </ul>
          </div>
          
          <Button 
            onClick={testCheckout}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processando...' : 'Testar Checkout Stripe'}
          </Button>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Este teste criará uma sessão de checkout mínima para identificar problemas.
              Verifique o console do navegador (F12) para ver detalhes do erro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}