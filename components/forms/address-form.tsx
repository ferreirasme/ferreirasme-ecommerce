"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PostalCodeInput } from "./postal-code-input"
import { MapPin, Home, Phone, User } from "lucide-react"

const addressSchema = z.object({
  type: z.enum(["shipping", "billing", "both"]).optional().default("both"),
  name: z.string().min(3, "Nome é obrigatório"),
  street_address: z.string().min(5, "Morada é obrigatória"),
  street_number: z.string().optional(),
  floor: z.string().optional(),
  postal_code: z.string().regex(/^[0-9]{4}-[0-9]{3}$/, "Código postal inválido"),
  city: z.string().min(2, "Localidade é obrigatória"),
  region: z.string().optional(),
  country: z.string().optional().default("PT"),
  phone: z.string().regex(/^(\+351)?[0-9]{9}$/, "Número de telefone inválido"),
  is_default: z.boolean().optional().default(false)
})

export interface AddressFormData {
  type?: "shipping" | "billing" | "both"
  name: string
  street_address: string
  street_number?: string
  floor?: string
  postal_code: string
  city: string
  region?: string
  country?: string
  phone: string
  is_default?: boolean
}

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => Promise<void>
  defaultValues?: Partial<AddressFormData>
  submitLabel?: string
  loading?: boolean
}

export function AddressForm({
  onSubmit,
  defaultValues,
  submitLabel = "Guardar Endereço",
  loading = false
}: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: "both",
      country: "PT",
      is_default: false,
      ...defaultValues
    }
  })

  const handleAddressFound = (address: {
    locality: string
    municipality: string
    district: string
  }) => {
    // Atualizar cidade e região automaticamente
    form.setValue("city", address.locality)
    form.setValue("region", `${address.municipality}, ${address.district}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Endereço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="shipping">Apenas Entrega</SelectItem>
                  <SelectItem value="billing">Apenas Faturação</SelectItem>
                  <SelectItem value="both">Entrega e Faturação</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
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

          <div className="grid grid-cols-2 gap-2">
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
                  <FormLabel>Andar</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2º Dto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localidade</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Lisboa" />
                </FormControl>
                <FormDescription>Preenchido automaticamente pelo código postal</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Região</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Lisboa, Lisboa" />
                </FormControl>
                <FormDescription>Concelho e Distrito</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          name="is_default"
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
                  Definir como endereço padrão
                </FormLabel>
                <FormDescription>
                  Este endereço será usado automaticamente em futuras compras
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}