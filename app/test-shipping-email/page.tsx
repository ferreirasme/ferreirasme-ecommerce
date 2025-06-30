"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { sendShippingNotificationEmail } from "@/lib/resend"

export default function TestShippingEmailPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("teste@example.com")
  const [orderNumber, setOrderNumber] = useState("2024-001")
  const [trackingCode, setTrackingCode] = useState("RR123456789PT")
  const [customerName, setCustomerName] = useState("João Silva")

  const testEmail = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/test-shipping-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          orderNumber,
          trackingCode,
          customerName,
          shippingMethod: 'EXPRESSO'
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Erro na API: ${error}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Email de teste enviado com sucesso!")
      } else {
        throw new Error("Falha ao enviar email")
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
          <CardTitle>Teste de Email de Rastreamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do destinatário</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do cliente</Label>
            <Input 
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="João Silva"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Número do pedido</Label>
            <Input 
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="2024-001"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trackingCode">Código de rastreamento</Label>
            <Input 
              id="trackingCode"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="RR123456789PT"
            />
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={testEmail}
              disabled={loading || !email || !orderNumber || !trackingCode}
              className="w-full"
            >
              {loading ? 'Enviando...' : 'Enviar Email de Teste'}
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Informações do teste:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• O email será enviado para o endereço especificado</li>
              <li>• Incluirá o código de rastreamento e link para os CTT</li>
              <li>• Método de envio: CTT Expresso</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}