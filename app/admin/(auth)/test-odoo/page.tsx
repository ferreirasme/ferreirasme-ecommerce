"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function TestOdooPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Check auth first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError("Não autenticado. Faça login primeiro.")
        setLoading(false)
        return
      }

      // Test simple connection
      const response = await fetch('/api/odoo/test-connection-simple', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || `Erro HTTP: ${response.status}`)
      } else {
        setResults(data)
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const testFullConnection = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Check auth first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError("Não autenticado. Faça login primeiro.")
        setLoading(false)
        return
      }

      // Test full connection
      const response = await fetch('/api/odoo/test-connection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || `Erro HTTP: ${response.status}`)
      } else {
        setResults(data)
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Teste de Conexão Odoo</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Autenticação</CardTitle>
            <CardDescription>Verificando status da sessão</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser()
              setResults({ auth: user })
            }}>
              Verificar Autenticação
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste de Conexão</CardTitle>
            <CardDescription>Testar diferentes tipos de conexão com a Odoo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testConnection}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  "Teste Simples"
                )}
              </Button>

              <Button 
                onClick={testFullConnection}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  "Teste Completo"
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {results && (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variáveis de Ambiente</CardTitle>
            <CardDescription>Verificar se as variáveis estão configuradas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={async () => {
              const response = await fetch('/api/test')
              const data = await response.json()
              setResults({ env: data })
            }}>
              Verificar Variáveis
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}