"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCartStore } from "@/store/cart"
import { useAuthStore } from "@/store/auth"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { PostalCodeInput } from "@/components/forms/postal-code-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CreditCard, Truck, ShieldCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { stripePromise } from "@/lib/stripe/client"
import { MBWayDialog } from "@/components/checkout/mbway-dialog"
import { PaymentMethodsInfo } from "@/components/payment/payment-methods-info"
import { ConsultantInfo } from "@/components/checkout/ConsultantInfo"
import { ConsultantTrackingClient } from "@/lib/consultant-tracking"

interface CheckoutForm {
  // Dados pessoais
  email: string
  firstName: string
  lastName: string
  phone: string
  nif: string
  
  // Endereço de entrega
  address: string
  addressNumber: string
  addressComplement: string
  city: string
  postalCode: string
  
  // Método de pagamento
  paymentMethod: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const user = useAuthStore((state) => state.user)
  
  const [loading, setLoading] = useState(false)
  const [mbwayDialogOpen, setMbwayDialogOpen] = useState(false)
  const [consultantCode, setConsultantCode] = useState<string | null>(null)
  
  // Carregar dados salvos do localStorage
  const [formData, setFormData] = useState<CheckoutForm>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('checkoutFormData')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            ...parsed,
            email: user?.email || parsed.email || "",
          }
        } catch (e) {
          console.error('Erro ao carregar dados salvos:', e)
        }
      }
    }
    
    return {
      email: user?.email || "",
      firstName: "",
      lastName: "",
      phone: "",
      nif: "",
      address: "",
      addressNumber: "",
      addressComplement: "",
      city: "",
      postalCode: "",
      paymentMethod: "card"
    }
  })

  const subtotal = getTotalPrice()
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + shipping

  useEffect(() => {
    if (items.length === 0) {
      router.push("/carrinho")
    }
  }, [items.length, router])

  // Detectar código de consultora na URL
  useEffect(() => {
    const refCode = searchParams?.get('ref')
    if (refCode) {
      console.log('Código de consultora detectado:', refCode)
      setConsultantCode(refCode.toUpperCase())
      
      // Salvar usando o sistema de tracking
      ConsultantTrackingClient.set(refCode, 'checkout_url')
      
      // Também salvar em cookie para tracking
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      document.cookie = `consultant_ref=${refCode.toUpperCase()}; expires=${expires.toUTCString()}; path=/`
    } else {
      // Verificar se já existe código salvo
      const tracking = ConsultantTrackingClient.get()
      if (tracking) {
        setConsultantCode(tracking.code)
        console.log('Código de consultora recuperado:', tracking.code, 'Source:', tracking.source)
      }
    }
  }, [searchParams])
  
  // Salvar dados do formulário no localStorage quando mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('checkoutFormData', JSON.stringify(formData))
    }
  }, [formData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRemoveConsultant = () => {
    setConsultantCode(null)
    ConsultantTrackingClient.remove()
    // Remover cookie
    document.cookie = 'consultant_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  }

  const handleMBWayConfirm = async (phoneNumber: string) => {
    setMbwayDialogOpen(false)
    setLoading(true)

    try {
      const response = await fetch('/api/payment/create-mbway-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image_url,
          })),
          customerInfo: formData,
          phoneNumber: phoneNumber,
          consultantCode: consultantCode,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento MB Way')
      }

      const data = await response.json()
      
      // Limpar carrinho
      clearCart()
      
      // Redirecionar para página de sucesso com informações do MB Way
      toast.success(data.mbway.message)
      router.push(`/checkout/sucesso?orderId=${data.orderId}&method=mbway`)
    } catch (error) {
      console.error('Erro no MB Way:', error)
      toast.error("Erro ao processar pagamento MB Way. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.paymentMethod === 'card') {
        // Processar pagamento com Stripe
        const response = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image_url: item.image_url,
            })),
            customerInfo: formData,
            consultantCode: consultantCode,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Erro na resposta:', errorData)
          throw new Error(errorData.error || 'Erro ao criar sessão de pagamento')
        }

        const { sessionId } = await response.json()
        
        // Tentar carregar o Stripe
        try {
          const stripe = await stripePromise
          if (stripe) {
            const { error } = await stripe.redirectToCheckout({ sessionId })
            if (error) throw error
          } else {
            throw new Error('Stripe não carregado')
          }
        } catch (stripeError) {
          // Se falhar, usar redirecionamento alternativo
          console.error('Erro ao carregar Stripe, usando redirecionamento alternativo:', stripeError)
          router.push(`/stripe-redirect?session_id=${sessionId}`)
        }
      } else if (formData.paymentMethod === 'mbway') {
        // Abrir diálogo do MB Way
        setMbwayDialogOpen(true)
        setLoading(false)
        return
      } else if (formData.paymentMethod === 'transfer') {
        // Para transferência bancária, apenas criar o pedido
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items,
            customerInfo: formData,
            paymentMethod: 'transfer',
            consultantCode: consultantCode,
          }),
        })

        if (!response.ok) {
          throw new Error('Erro ao criar pedido')
        }

        const { orderId } = await response.json()
        
        // Limpar carrinho
        clearCart()
        
        // Redirecionar para página com instruções de transferência
        router.push(`/checkout/sucesso?orderId=${orderId}&method=transfer`)
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error)
      const errorMessage = error.message || "Erro ao processar pagamento. Tente novamente."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/carrinho">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Carrinho
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações da Consultora */}
              <ConsultantInfo 
                consultantCode={consultantCode} 
                onRemove={handleRemoveConsultant}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apelido</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+351"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nif">NIF (opcional)</Label>
                      <Input
                        id="nif"
                        name="nif"
                        value={formData.nif}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <PostalCodeInput
                      value={formData.postalCode}
                      onChange={(value) => setFormData(prev => ({ ...prev, postalCode: value }))}
                      onAddressFound={(address) => {
                        setFormData(prev => ({
                          ...prev,
                          city: address.municipality || address.locality || prev.city,
                          // Preencher com a rua encontrada apenas se estiver vazio
                          address: prev.address || (address.street ? `${address.street}, ` : '')
                        }))
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Morada</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Nome da rua"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressNumber">Número</Label>
                      <Input
                        id="addressNumber"
                        name="addressNumber"
                        placeholder="123"
                        value={formData.addressNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressComplement">Complemento (opcional)</Label>
                      <Input
                        id="addressComplement"
                        name="addressComplement"
                        placeholder="Apto, andar, etc."
                        value={formData.addressComplement}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                <span>Cartão / Klarna</span>
                              </div>
                              <span className="text-sm text-muted-foreground">Stripe Checkout</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Pague com cartão ou parcele sua compra com Klarna
                            </p>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                        <RadioGroupItem value="mbway" id="mbway" />
                        <Label htmlFor="mbway" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 bg-primary rounded flex items-center justify-center text-xs font-bold text-primary-foreground">
                              MB
                            </div>
                            <span>MB Way</span>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                        <RadioGroupItem value="transfer" id="transfer" />
                        <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>Transferência Bancária</span>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </form>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                          {item.image_url && (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Envio</span>
                      <span>
                        {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
                      </span>
                    </div>
                    {shipping === 0 && (
                      <p className="text-xs text-green-600">
                        ✓ Envio grátis em compras acima de 50€
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                    onClick={handleSubmit}
                  >
                    {loading ? "A processar..." : "Confirmar Pagamento"}
                  </Button>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Pagamento 100% seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>Entrega em 2-5 dias úteis</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <PaymentMethodsInfo />
          </div>
        </div>
      </div>
      
      <MBWayDialog
        open={mbwayDialogOpen}
        onOpenChange={setMbwayDialogOpen}
        onConfirm={handleMBWayConfirm}
        loading={loading}
      />
    </div>
  )
}