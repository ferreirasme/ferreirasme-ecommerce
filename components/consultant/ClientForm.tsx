'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin } from 'lucide-react'
import { ClientFormData } from '@/types/consultant'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { formatPhone, formatPostalCode } from '@/lib/formatters'
import { useState } from 'react'

const clientSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Apelido deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone inválido'),
  address: z.object({
    street: z.string().min(3, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Distrito é obrigatório'),
    postalCode: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal inválido'),
    country: z.string().optional().default('Portugal')
  }).optional()
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>
  consultantId: string
  initialData?: Partial<ClientFormData>
  isLoading?: boolean
}

export function ClientForm({ onSubmit, consultantId, initialData, isLoading }: ClientFormProps) {
  const [includeAddress, setIncludeAddress] = useState(!!initialData?.address)
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...initialData,
      address: initialData?.address || {
        street: '',
        number: '',
        complement: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Portugal'
      }
    }
  })

  const onFormSubmit = async (data: ClientFormValues) => {
    try {
      const submitData: ClientFormData = {
        ...data,
        address: includeAddress ? data.address : undefined
      }
      await onSubmit(submitData)
      toast({
        title: 'Sucesso',
        description: 'Cliente cadastrado com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar cliente. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  // Formatters
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setValue('address.postalCode', formatted)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Dados do Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                <User className="w-4 h-4 inline mr-1" />
                Nome
              </Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Maria"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">
                <User className="w-4 h-4 inline mr-1" />
                Apelido
              </Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Santos"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="maria.santos@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefone
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              onChange={handlePhoneChange}
              placeholder="912 345 678"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Address section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Endereço (opcional)</h4>
              <Switch
                checked={includeAddress}
                onCheckedChange={setIncludeAddress}
                disabled={isLoading}
              />
            </div>

            {includeAddress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Rua
                    </Label>
                    <Input
                      id="street"
                      {...register('address.street')}
                      placeholder="Rua das Flores"
                      disabled={isLoading}
                    />
                    {includeAddress && errors.address?.street && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.street.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      {...register('address.number')}
                      placeholder="123"
                      disabled={isLoading}
                    />
                    {includeAddress && errors.address?.number && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.number.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    {...register('address.complement')}
                    placeholder="Apartamento 2B"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...register('address.city')}
                      placeholder="Lisboa"
                      disabled={isLoading}
                    />
                    {includeAddress && errors.address?.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">Distrito</Label>
                    <Input
                      id="state"
                      {...register('address.state')}
                      placeholder="Lisboa"
                      disabled={isLoading}
                    />
                    {includeAddress && errors.address?.state && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.state.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      {...register('address.postalCode')}
                      onChange={handlePostalCodeChange}
                      placeholder="1234-567"
                      maxLength={8}
                      disabled={isLoading}
                    />
                    {includeAddress && errors.address?.postalCode && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.postalCode.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      {...register('address.country')}
                      placeholder="Portugal"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? 'Salvando...' : 'Cadastrar Cliente'}
        </Button>
      </div>
    </form>
  )
}