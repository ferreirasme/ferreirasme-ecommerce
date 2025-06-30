"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function DevLoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState<any>(null)

  const devLogin = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLoginData(data)
        toast.success("Login de desenvolvimento criado!")
        
        // Redirecionar automaticamente após 2 segundos
        if (data.magiclink) {
          setTimeout(() => {
            window.location.href = data.magiclink
          }, 2000)
        }
      } else {
        toast.error(data.error || "Erro ao fazer login")
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Esta página não está disponível em produção.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login de Desenvolvimento</CardTitle>
          <p className="text-sm text-muted-foreground">
            ⚠️ Apenas para desenvolvimento - Não usar em produção
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teste@example.com"
            />
          </div>
          
          <Button 
            onClick={devLogin}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Criando login...' : 'Login Rápido (Dev)'}
          </Button>
          
          {loginData && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Login criado com sucesso!</p>
              <p className="text-xs text-muted-foreground">
                Redirecionando em 2 segundos...
              </p>
              {loginData.magiclink && (
                <a 
                  href={loginData.magiclink}
                  className="text-xs text-blue-600 hover:underline block mt-2"
                >
                  Clique aqui se não for redirecionado
                </a>
              )}
            </div>
          )}
          
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Como usar:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Digite qualquer email (não precisa ser real)</li>
              <li>Clique em "Login Rápido"</li>
              <li>Você será automaticamente logado</li>
              <li>Use este login para testar compras e envios</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}