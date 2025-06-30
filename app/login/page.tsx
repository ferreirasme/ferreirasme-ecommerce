'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { OTPInput } from '@/components/ui/otp-input'
import { toast } from 'sonner'
import { ArrowLeft, Mail, Lock, Loader2, UserCircle } from 'lucide-react'

type LoginMethod = 'password' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get('redirect') || '/conta'
  
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [loading, setLoading] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn(email, password, rememberMe)

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao enviar código')
      }

      if (data.development && data.message) {
        toast.info(data.message)
      } else {
        toast.success('Código enviado para seu email!')
      }
      setStep('otp')
    } catch (error) {
      toast.error('Erro ao enviar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      if (!response.ok) {
        throw new Error('Código inválido')
      }

      toast.success('Login realizado com sucesso!')
      router.push(redirect)
    } catch (error) {
      toast.error('Código inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-lg py-16">
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
          <CardTitle>Entrar na sua conta</CardTitle>
          <CardDescription>
            {loginMethod === 'password' 
              ? 'Digite seu email e senha para acessar sua conta'
              : step === 'credentials'
              ? 'Digite seu email para receber um código de acesso'
              : 'Digite o código enviado para seu email'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Login com senha */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setLoginMethod('otp')
                  setPassword('')
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Entrar com código por email
              </Button>
            </form>
          )}

          {/* Login com OTP */}
          {loginMethod === 'otp' && step === 'credentials' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-otp">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-otp"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setLoginMethod('password')
                  setOtp('')
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                Entrar com senha
              </Button>
            </form>
          )}

          {loginMethod === 'otp' && step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-4">
                <Label htmlFor="otp">Código de verificação</Label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={8}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Enviamos um código de 8 caracteres para {email}
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('credentials')
                  setOtp('')
                }}
              >
                Usar outro email
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          
          {/* Link para consultoras */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/consultant/login')}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            Sou consultora
          </Button>

          <div className="text-sm text-center space-y-2">
            <p className="text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="underline hover:text-primary">
                Criar conta
              </Link>
            </p>
            <p className="text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <Link href="/termos" className="underline hover:text-primary">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="underline hover:text-primary">
                Política de Privacidade
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}