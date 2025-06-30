'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'sonner'
import { Lock, AlertCircle, Check, X, Loader2 } from 'lucide-react'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'Pelo menos 8 caracteres', test: (pwd) => pwd.length >= 8 },
  { label: 'Uma letra maiúscula', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Uma letra minúscula', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Um número', test: (pwd) => /[0-9]/.test(pwd) },
  { label: 'Um caractere especial', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
]

export default function FirstAccessPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showRequirements, setShowRequirements] = useState(false)

  const passwordStrength = passwordRequirements.filter(req => 
    req.test(passwords.newPassword)
  ).length

  const passwordsMatch = passwords.newPassword === passwords.confirmPassword && 
    passwords.newPassword.length > 0

  const allRequirementsMet = passwordStrength === passwordRequirements.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allRequirementsMet) {
      toast.error('A senha não atende todos os requisitos')
      return
    }

    if (!passwordsMatch) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.newPassword
      })

      if (updateError) throw updateError

      // Atualizar metadata para indicar que não é mais primeiro login
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            metadata: {
              first_login: false,
              password_changed_at: new Date().toISOString()
            }
          })
          .eq('id', user.id)

        // Se for consultora, atualizar também na tabela de consultoras
        if (user.role === 'consultant' && user.metadata?.consultant_id) {
          await supabase
            .from('consultants')
            .update({
              metadata: {
                requires_password_change: false,
                password_changed_at: new Date().toISOString()
              }
            })
            .eq('id', user.metadata.consultant_id)
        }
      }

      toast.success('Senha alterada com sucesso!')
      
      // Redirecionar para o dashboard apropriado
      if (user?.role === 'consultant') {
        router.push('/consultant/dashboard')
      } else if (user?.role === 'admin' || user?.role === 'manager') {
        router.push('/admin')
      } else {
        router.push('/conta')
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return 'Muito fraca'
    if (passwordStrength <= 2) return 'Fraca'
    if (passwordStrength <= 3) return 'Média'
    if (passwordStrength <= 4) return 'Forte'
    return 'Muito forte'
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-red-500'
    if (passwordStrength <= 2) return 'bg-orange-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    if (passwordStrength <= 4) return 'bg-green-500'
    return 'bg-green-600'
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Primeiro Acesso
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Por segurança, você precisa criar uma nova senha
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Criar Nova Senha</CardTitle>
                <CardDescription>
                  Escolha uma senha forte para proteger sua conta
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sua nova senha deve ser diferente da senha temporária fornecida
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Digite sua nova senha"
                      value={passwords.newPassword}
                      onChange={(e) => {
                        setPasswords({ ...passwords, newPassword: e.target.value })
                        setShowRequirements(true)
                      }}
                      onFocus={() => setShowRequirements(true)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {showRequirements && passwords.newPassword && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Força da senha:</span>
                      <span className="font-medium">{getPasswordStrengthLabel()}</span>
                    </div>
                    <Progress 
                      value={(passwordStrength / passwordRequirements.length) * 100} 
                      className="h-2"
                    />
                    <div className="space-y-2">
                      {passwordRequirements.map((req, index) => {
                        const isMet = req.test(passwords.newPassword)
                        return (
                          <div 
                            key={index} 
                            className="flex items-center space-x-2 text-sm"
                          >
                            {isMet ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={isMet ? 'text-green-600' : 'text-muted-foreground'}>
                              {req.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme sua nova senha"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                  {passwords.confirmPassword && !passwordsMatch && (
                    <p className="text-sm text-red-500">As senhas não coincidem</p>
                  )}
                  {passwords.confirmPassword && passwordsMatch && (
                    <p className="text-sm text-green-600">As senhas coincidem</p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !allRequirementsMet || !passwordsMatch}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando senha...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Se você tiver problemas, entre em contato com o suporte em{' '}
            <a 
              href="mailto:suporte@ferreirasme.com" 
              className="text-primary hover:underline"
            >
              suporte@ferreirasme.com
            </a>
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}