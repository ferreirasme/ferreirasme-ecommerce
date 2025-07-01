"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Lock, Mail, User } from "lucide-react"

export default function ConsultantFirstAccess() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    code: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [consultantData, setConsultantData] = useState<any>(null)

  const handleVerifyCode = async () => {
    if (!formData.code) {
      toast.error("Digite seu código de consultora")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Buscar consultora pelo código
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('code', formData.code.toUpperCase())
        .single()

      if (error || !data) {
        toast.error("Código de consultora não encontrado")
        setLoading(false)
        return
      }

      // Verificar se já tem usuário criado
      const { data: authData } = await supabase.auth.getUser()
      if (authData.user && authData.user.email === data.email) {
        toast.info("Você já tem acesso configurado. Redirecionando...")
        router.push('/consultant/login')
        return
      }

      setConsultantData(data)
      setFormData(prev => ({ ...prev, email: data.email }))
      setStep(2)
    } catch (error) {
      toast.error("Erro ao verificar código")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Criar conta de usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: consultantData.email,
        password: formData.password,
        options: {
          data: {
            full_name: consultantData.full_name,
            role: 'consultant'
          }
        }
      })

      if (authError) {
        toast.error(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        toast.error("Erro ao criar conta")
        setLoading(false)
        return
      }

      // Atualizar consultora com o user_id correto
      const { error: updateError } = await supabase
        .from('consultants')
        .update({ 
          user_id: authData.user.id,
          status: 'active',
          activation_date: new Date().toISOString()
        })
        .eq('id', consultantData.id)

      if (updateError) {
        console.error('Erro ao atualizar consultora:', updateError)
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.")
      router.push('/consultant/login')
    } catch (error) {
      toast.error("Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Primeiro Acesso - Consultora</CardTitle>
          <CardDescription>
            {step === 1 
              ? "Digite seu código de consultora para começar"
              : "Crie sua senha de acesso"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Consultora</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    placeholder="CONS0000"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleVerifyCode} 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Verificar Código"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Consultora encontrada:</p>
                <p className="font-semibold">{consultantData?.full_name}</p>
                <p className="text-sm text-muted-foreground">{consultantData?.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateAccount} 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Já tem uma conta? <a href="/consultant/login" className="underline">Fazer login</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}