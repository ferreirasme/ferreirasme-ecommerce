"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConsultantsDebugPage() {
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [consultants, setConsultants] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // 1. Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      setAuthStatus({
        authenticated: !!user,
        user: user,
        error: authError?.message
      })

      if (!user) {
        setError("Não autenticado. Faça login primeiro.")
        setLoading(false)
        return
      }

      // 2. Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single()

      setAuthStatus((prev: any) => ({
        ...prev,
        isAdmin: !!adminData,
        adminData: adminData,
        adminError: adminError?.message
      }))

      if (!adminData) {
        setError("Usuário não é administrador")
        setLoading(false)
        return
      }

      // 3. Load consultants
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (consultantsError) {
        setError(`Erro ao carregar consultoras: ${consultantsError.message}`)
      } else {
        setConsultants(consultantsData || [])
      }

    } catch (err: any) {
      setError(err.message || "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const testDirectQuery = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('count')
        .single()

      if (error) {
        alert(`Erro: ${error.message}`)
      } else {
        alert(`Total de consultoras: ${data?.count || 0}`)
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug - Consultoras</h1>

      <div className="grid gap-6">
        {/* Auth Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Autenticação</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={checkAuthAndLoadData}>
                Recarregar Dados
              </Button>
              <Button onClick={testDirectQuery} variant="outline">
                Testar Query Direta
              </Button>
              <Link href="/admin/login">
                <Button variant="outline">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Consultants List */}
        {consultants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Consultoras ({consultants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {consultants.map((consultant) => (
                  <div key={consultant.id} className="p-3 border rounded">
                    <p className="font-medium">{consultant.full_name}</p>
                    <p className="text-sm text-gray-600">{consultant.email}</p>
                    <p className="text-sm text-gray-500">Código: {consultant.code}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Brutos</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
              {JSON.stringify({ consultants, error }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}