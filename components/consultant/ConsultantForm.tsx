'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, CreditCard, MapPin, Building } from 'lucide-react'
import { ConsultantFormData } from '@/types/consultant'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { formatPhone, formatNIF, formatIBAN, formatPostalCode } from '@/lib/formatters'

const consultantSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Apelido deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone inválido'),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18
  }, 'Deve ter pelo menos 18 anos'),
  nif: z.string().length(9, 'NIF deve ter 9 dígitos'),
  iban: z.string().min(25, 'IBAN inválido'),
  bankName: z.string().optional(),
  address: z.object({
    street: z.string().min(3, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Distrito é obrigatório'),
    postalCode: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal inválido'),
    country: z.string().min(2, 'País é obrigatório')
  }),
  commissionRate: z.number().min(0).max(100).default(10)
})

type ConsultantFormValues = z.infer<typeof consultantSchema>

interface ConsultantFormProps {
  onSubmit: (data: ConsultantFormData) => Promise<void>
  initialData?: Partial<ConsultantFormData>
  isLoading?: boolean
}

export function ConsultantForm({ onSubmit, initialData, isLoading }: ConsultantFormProps) {
  const [step, setStep] = useState(1)
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<ConsultantFormValues>({
    // resolver: zodResolver(consultantSchema),
    defaultValues: {
      ...initialData,
      address: {
        street: initialData?.address?.street || '',
        number: initialData?.address?.number || '',
        complement: initialData?.address?.complement || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        postalCode: initialData?.address?.postalCode || '',
        country: initialData?.address?.country || 'Portugal'
      },
      commissionRate: initialData?.commissionRate || 10
    }
  })

  const handleNextStep = async () => {
    const fields = step === 1 
      ? ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'nif']
      : ['address.street', 'address.number', 'address.city', 'address.state', 'address.postalCode']
    
    const isValid = await trigger(fields as any)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const handlePreviousStep = () => {
    setStep(step - 1)
  }

  const onFormSubmit = async (data: ConsultantFormValues) => {
    try {
      await onSubmit(data)
      toast({
        title: 'Sucesso',
        description: 'Consultora cadastrada com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar consultora. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  // Formatters
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const handleNIFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNIF(e.target.value)
    setValue('nif', formatted)
  }

  const handleIBANChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIBAN(e.target.value)
    setValue('iban', formatted)
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setValue('address.postalCode', formatted)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="João"
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
                  placeholder="Silva"
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
                placeholder="joao.silva@email.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="birthDate">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                  disabled={isLoading}
                />
                {errors.birthDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.birthDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="nif">
                <CreditCard className="w-4 h-4 inline mr-1" />
                NIF
              </Label>
              <Input
                id="nif"
                {...register('nif')}
                onChange={handleNIFChange}
                placeholder="123456789"
                maxLength={9}
                disabled={isLoading}
              />
              {errors.nif && (
                <p className="text-sm text-red-500 mt-1">{errors.nif.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Endereço</h3>
            
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
                {errors.address?.street && (
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
                {errors.address?.number && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.number.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="complement">Complemento (opcional)</Label>
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
                {errors.address?.city && (
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
                {errors.address?.state && (
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
                {errors.address?.postalCode && (
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Dados Bancários</h3>
            
            <div>
              <Label htmlFor="iban">
                <CreditCard className="w-4 h-4 inline mr-1" />
                IBAN
              </Label>
              <Input
                id="iban"
                {...register('iban')}
                onChange={handleIBANChange}
                placeholder="PT50 0000 0000 0000 0000 0000 0"
                disabled={isLoading}
              />
              {errors.iban && (
                <p className="text-sm text-red-500 mt-1">{errors.iban.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bankName">
                <Building className="w-4 h-4 inline mr-1" />
                Nome do Banco (opcional)
              </Label>
              <Input
                id="bankName"
                {...register('bankName')}
                placeholder="Banco Exemplo"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="commissionRate">
                Taxa de Comissão (%)
              </Label>
              <Input
                id="commissionRate"
                type="number"
                {...register('commissionRate', { valueAsNumber: true })}
                placeholder="10"
                min="0"
                max="100"
                step="0.1"
                disabled={isLoading}
              />
              {errors.commissionRate && (
                <p className="text-sm text-red-500 mt-1">{errors.commissionRate.message}</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousStep}
            disabled={isLoading}
          >
            Anterior
          </Button>
        )}
        
        <div className="ml-auto">
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Salvando...' : 'Cadastrar'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}