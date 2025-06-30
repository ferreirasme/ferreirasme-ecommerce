"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Truck, Package, Clock, MapPin } from "lucide-react"

interface ShippingOption {
  id: string
  name: string
  price: number
  price_formatted: string
  delivery_time: string
  tracking_available: boolean
  description: string
}

interface ShippingCalculatorProps {
  items: Array<{
    product_id: string
    quantity: number
  }>
  onSelectShipping: (option: ShippingOption) => void
}

export function ShippingCalculator({ items, onSelectShipping }: ShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [shippingInfo, setShippingInfo] = useState<{
    city?: string
    region?: string
  }>({})

  const formatPostalCode = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")
    
    // Formata como XXXX-XXX
    if (numbers.length <= 4) {
      return numbers
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}`
    }
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setPostalCode(formatted)
  }

  const calculateShipping = async () => {
    if (postalCode.length !== 8) {
      toast.error("Digite um código postal válido (XXXX-XXX)")
      return
    }

    setLoading(true)
    setShippingOptions([])
    setSelectedOption("")

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postal_code: postalCode,
          items
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao calcular frete")
      }

      const data = await response.json()
      setShippingOptions(data.shipping_options)
      setShippingInfo({
        city: data.city,
        region: data.region
      })

      if (data.shipping_options.length > 0) {
        // Selecionar primeira opção por padrão
        const firstOption = data.shipping_options[0]
        setSelectedOption(firstOption.id)
        onSelectShipping(firstOption)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao calcular frete")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId)
    const option = shippingOptions.find(o => o.id === optionId)
    if (option) {
      onSelectShipping(option)
    }
  }

  const getIconForService = (serviceId: string) => {
    switch (serviceId) {
      case 'expresso':
        return <Truck className="h-5 w-5 text-primary" />
      case 'economico':
        return <Package className="h-5 w-5 text-muted-foreground" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calcular Frete</CardTitle>
        <CardDescription>
          Digite seu código postal para calcular as opções de entrega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="postal-code">Código Postal</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="postal-code"
                  type="text"
                  placeholder="XXXX-XXX"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  maxLength={8}
                  className="pl-10"
                />
              </div>
              <Button onClick={calculateShipping} disabled={loading}>
                {loading ? "Calculando..." : "Calcular"}
              </Button>
            </div>
          </div>
        </div>

        {shippingInfo.city && (
          <p className="text-sm text-muted-foreground">
            Entrega para: {shippingInfo.city}
            {shippingInfo.region && `, ${shippingInfo.region}`}
          </p>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {shippingOptions.length > 0 && !loading && (
          <RadioGroup value={selectedOption} onValueChange={handleSelectOption}>
            <div className="space-y-3">
              {shippingOptions.map((option) => (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className="flex cursor-pointer rounded-lg border p-4 hover:bg-accent"
                >
                  <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getIconForService(option.id)}
                      <span className="font-medium">{option.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {option.delivery_time}
                      </span>
                      {option.tracking_available && (
                        <span>Com rastreamento</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{option.price_formatted}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  )
}