"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Calendar, User, Mail, Phone, CreditCard, MapPin, Home } from "lucide-react"
import { PostalCodeInput } from "@/components/forms/postal-code-input"

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  full_name: z.string().min(3, "Nome completo é obrigatório"),
  phone: z.string().regex(/^(\+351)?[0-9]{9}$/, "Número de telefone inválido"),
  nif: z.string().regex(/^[0-9]{9}$/, "NIF deve ter 9 dígitos").optional().or(z.literal("")),
  birth_date: z.string().optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  // Campos de endereço
  postal_code: z.string().regex(/^[0-9]{4}-[0-9]{3}$/, "Código postal inválido"),
  street_address: z.string().min(5, "Morada é obrigatória"),
  street_number: z.string().min(1, "Número é obrigatório"),
  floor: z.string().optional(),
  city: z.string().min(2, "Localidade é obrigatória"),
  parish: z.string().min(2, "Freguesia é obrigatória"),
  municipality: z.string().min(2, "Concelho é obrigatório"),
  district: z.string().min(2, "Distrito é obrigatório"),
  newsletter: z.boolean().optional().default(false),
  marketing_consent: z.boolean().optional().default(false),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos e condições"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone: string
  nif?: string
  birth_date?: string
  gender?: "M" | "F" | "O"
  postal_code: string
  street_address: string
  street_number: string
  floor?: string
  city: string
  parish: string
  municipality: string
  district: string
  newsletter?: boolean
  marketing_consent?: boolean
  terms_accepted: boolean
}

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      full_name: "",
      phone: "",
      nif: "",
      birth_date: "",
      postal_code: "",
      street_address: "",
      street_number: "",
      floor: "",
      city: "",
      parish: "",
      municipality: "",
      district: "",
      newsletter: false,
      marketing_consent: false,
      terms_accepted: false
    }
  })

  const handleAddressFound = (address: {
    locality: string
    municipality: string
    district: string
    parish?: string
    street?: string
  }) => {
    form.setValue("city", address.locality)
    form.setValue("parish", address.parish || address.locality)
    form.setValue("municipality", address.municipality)
    form.setValue("district", address.district)
    
    if (address.street) {
      form.setValue("street_address", address.street)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          profile: {
            full_name: data.full_name,
            phone: data.phone,
            nif: data.nif || null,
            birth_date: data.birth_date || null,
            gender: data.gender || null,
            newsletter: data.newsletter,
            marketing_consent: data.marketing_consent
          },
          address: {
            street_address: data.street_address,
            street_number: data.street_number,
            floor: data.floor || null,
            postal_code: data.postal_code,
            city: data.city,
            region: `${data.parish}, ${data.municipality}, ${data.district}`,
            country: "PT"
          }
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Falha ao criar conta")
      }

      toast.success("Conta criada com sucesso!")
      router.push("/login")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-16">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Criar nova conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados de acesso</h3>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="email" placeholder="seu@email.com" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados pessoais</h3>
                
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="João Silva" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="912345678" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormDescription>Número português (9 dígitos)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIF (opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="123456789" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormDescription>Para faturação</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de nascimento (opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="date" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género (opcional)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="M" />
                              </FormControl>
                              <FormLabel className="font-normal">Masculino</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="F" />
                              </FormControl>
                              <FormLabel className="font-normal">Feminino</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="O" />
                              </FormControl>
                              <FormLabel className="font-normal">Outro</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Endereço</h3>
                
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PostalCodeInput
                          value={field.value}
                          onChange={field.onChange}
                          onAddressFound={handleAddressFound}
                          label="Código Postal"
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Morada</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Rua das Flores" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apto</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2º Dto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="parish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freguesia</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Parque das Nações" readOnly className="bg-muted" />
                      </FormControl>
                      <FormDescription>Preenchido automaticamente</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="municipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concelho</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Lisboa" readOnly className="bg-muted" />
                        </FormControl>
                        <FormDescription>Preenchido automaticamente</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distrito</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Lisboa" readOnly className="bg-muted" />
                        </FormControl>
                        <FormDescription>Preenchido automaticamente</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Comunicações</h3>
                
                <FormField
                  control={form.control}
                  name="newsletter"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Receber newsletter
                        </FormLabel>
                        <FormDescription>
                          Novidades, promoções e lançamentos exclusivos
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketing_consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Consentimento de marketing
                        </FormLabel>
                        <FormDescription>
                          Autorizo o uso dos meus dados para fins de marketing
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="terms_accepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Li e aceito os{" "}
                        <Link href="/termos" className="underline hover:text-primary">
                          Termos de Uso
                        </Link>{" "}
                        e a{" "}
                        <Link href="/privacidade" className="underline hover:text-primary">
                          Política de Privacidade
                        </Link>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="underline hover:text-primary">
                  Fazer login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}