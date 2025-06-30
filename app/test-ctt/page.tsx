"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PostalCodeInput } from "@/components/forms/postal-code-input"
import { AddressForm, AddressFormData } from "@/components/forms/address-form"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestCTTPage() {
  const [postalCode, setPostalCode] = useState("")
  const [addressData, setAddressData] = useState<any>(null)
  const [shippingData, setShippingData] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  const handleAddressFound = (address: any) => {
    setAddressData(address)
    toast.success(`Endereço encontrado: ${address.locality}, ${address.municipality}`)
  }

  const handleAddressSubmit = async (data: AddressFormData) => {
    console.log("Endereço submetido:", data)
    toast.success("Endereço guardado com sucesso!")
  }

  const calculateShipping = async () => {
    if (postalCode.length !== 8) {
      toast.error("Digite um código postal válido")
      return
    }

    setCalculating(true)
    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postal_code: postalCode,
          items: [
            { product_id: "test-123", quantity: 1 }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      const data = await response.json()
      setShippingData(data)
      toast.success("Cálculo de frete realizado!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao calcular frete")
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Teste de Integração CTT</h1>

      <Tabs defaultValue="postal-code" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="postal-code">Validação Código Postal</TabsTrigger>
          <TabsTrigger value="address-form">Formulário Endereço</TabsTrigger>
          <TabsTrigger value="shipping">Cálculo de Frete</TabsTrigger>
        </TabsList>

        <TabsContent value="postal-code">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Validação de Código Postal</CardTitle>
              <CardDescription>
                Digite um código postal português para validar e obter informações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PostalCodeInput
                value={postalCode}
                onChange={setPostalCode}
                onAddressFound={handleAddressFound}
              />

              {addressData && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h3 className="font-medium">Dados do Endereço:</h3>
                  <p><strong>Localidade:</strong> {addressData.locality}</p>
                  <p><strong>Concelho:</strong> {addressData.municipality}</p>
                  <p><strong>Distrito:</strong> {addressData.district}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Exemplos de códigos postais para testar:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>1200-195 - Lisboa</li>
                  <li>4000-123 - Porto</li>
                  <li>3000-456 - Coimbra</li>
                  <li>9000-789 - Funchal</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address-form">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Formulário de Endereço</CardTitle>
              <CardDescription>
                Formulário completo com preenchimento automático via código postal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressForm onSubmit={handleAddressSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Cálculo de Frete</CardTitle>
              <CardDescription>
                Calcular opções de envio para um código postal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PostalCodeInput
                value={postalCode}
                onChange={setPostalCode}
                onAddressFound={handleAddressFound}
              />

              <Button 
                onClick={calculateShipping} 
                disabled={calculating || postalCode.length !== 8}
                className="w-full"
              >
                {calculating ? "Calculando..." : "Calcular Frete"}
              </Button>

              {shippingData && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Informações de Envio:</h3>
                    <p><strong>Destino:</strong> {shippingData.city}, {shippingData.region}</p>
                    <p><strong>Peso Total:</strong> {shippingData.total_weight}g</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Opções de Envio:</h3>
                    {shippingData.shipping_options.map((option: any) => (
                      <div key={option.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{option.name}</h4>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                            <p className="text-sm">Prazo: {option.delivery_time}</p>
                            {option.tracking_available && (
                              <p className="text-sm text-green-600">✓ Com rastreamento</p>
                            )}
                          </div>
                          <p className="text-lg font-bold">{option.price_formatted}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}