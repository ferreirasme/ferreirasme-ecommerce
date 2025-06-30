'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Lock, User } from 'lucide-react'

function ConsultantLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get('redirect') || '/consultant/dashboard'
  
  const { signInAsConsultant } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code || !formData.password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)

    try {
      const result = await signInAsConsultant(
        formData.code.toUpperCase(), 
        formData.password, 
        rememberMe
      )

      if (result.success) {
        toast.success('Login realizado com sucesso!')
        
        if (result.requiresPasswordChange) {
          router.push('/first-access')
        } else {
          router.push(redirect)
        }
      } else {
        toast.error(result.error || 'Erro ao fazer login')
      }
    } catch (error) {
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Portal da Consultora
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login com seu código de consultora
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>
                Digite seu código de consultora e senha para acessar sua conta
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código da Consultora</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="EX: CONS001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="pl-10 uppercase"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={loading}
                  />
                  <Label 
                    htmlFor="remember" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Lembrar de mim
                  </Label>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  É um cliente?{' '}
                </span>
                <Link
                  href="/login"
                  className="text-primary hover:underline"
                >
                  Fazer login como cliente
                </Link>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Primeira vez?{' '}
                </span>
                <Link
                  href="/consultant/first-time"
                  className="text-primary hover:underline"
                >
                  Ativar conta de consultora
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ao fazer login, você concorda com nossos{' '}
          <Link href="/termos" className="underline hover:text-primary">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="underline hover:text-primary">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ConsultantLoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConsultantLoginContent />
    </Suspense>
  )
}