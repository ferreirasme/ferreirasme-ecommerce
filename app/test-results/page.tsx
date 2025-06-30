"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TestResult {
  name: string
  status: "success" | "error" | "pending" | "loading"
  message: string
  details?: any
}

export default function TestResultsPage() {
  const [results, setResults] = useState<TestResult[]>([
    { name: "Resend (Email)", status: "pending", message: "Aguardando teste..." },
    { name: "CTT - Validação Código Postal", status: "pending", message: "Aguardando teste..." },
    { name: "CTT - Cálculo de Frete", status: "pending", message: "Aguardando teste..." },
    { name: "Login OTP", status: "pending", message: "Aguardando teste..." }
  ])

  const runTests = async () => {
    // Teste 1: Resend
    updateTest(0, { status: "loading", message: "Testando..." })
    try {
      const res1 = await fetch("/api/test-email")
      const data1 = await res1.json()
      updateTest(0, {
        status: data1.success ? "success" : "error",
        message: data1.success ? "Email enviado com sucesso!" : data1.error,
        details: data1
      })
    } catch (error) {
      updateTest(0, { status: "error", message: "Erro ao testar Resend" })
    }

    // Teste 2: CTT Validação
    updateTest(1, { status: "loading", message: "Testando..." })
    try {
      const res2 = await fetch("/api/postal-code/validate?code=1200-195")
      const data2 = await res2.json()
      updateTest(1, {
        status: data2.valid ? "success" : "error",
        message: data2.valid ? `Validado: ${data2.locality}, ${data2.municipality}` : data2.message,
        details: data2
      })
    } catch (error) {
      updateTest(1, { status: "error", message: "Erro ao validar código postal" })
    }

    // Teste 3: CTT Cálculo
    updateTest(2, { status: "loading", message: "Testando..." })
    try {
      const res3 = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postal_code: "1200-195",
          items: [{ product_id: "test", quantity: 1 }]
        })
      })
      const data3 = await res3.json()
      updateTest(2, {
        status: res3.ok ? "success" : "error",
        message: res3.ok ? `${data3.shipping_options?.length || 0} opções de envio encontradas` : data3.message,
        details: data3
      })
    } catch (error) {
      updateTest(2, { status: "error", message: "Erro ao calcular frete" })
    }

    // Teste 4: Login OTP
    updateTest(3, { status: "loading", message: "Testando..." })
    try {
      const res4 = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "teste@example.com" })
      })
      const data4 = await res4.json()
      updateTest(3, {
        status: res4.ok ? "success" : "error",
        message: res4.ok ? 
          (data4.development ? `Modo dev: ${data4.message}` : "OTP enviado!") : 
          data4.error,
        details: data4
      })
    } catch (error) {
      updateTest(3, { status: "error", message: "Erro ao enviar OTP" })
    }
  }

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev]
      newResults[index] = { ...newResults[index], ...update }
      return newResults
    })
  }

  useEffect(() => {
    runTests()
  }, [])

  const getIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const allSuccess = results.every(r => r.status === "success")

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Resultados dos Testes</h1>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getIcon(result.status)}
                  {result.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${
                result.status === "success" ? "text-green-600" :
                result.status === "error" ? "text-red-600" :
                "text-gray-600"
              }`}>
                {result.message}
              </p>
              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Ver detalhes</summary>
                  <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={`mt-6 ${allSuccess ? "border-green-500" : "border-yellow-500"}`}>
        <CardHeader>
          <CardTitle className={allSuccess ? "text-green-600" : "text-yellow-600"}>
            {allSuccess ? "✅ Todos os testes passaram!" : "⚠️ Alguns testes falharam"}
          </CardTitle>
          <CardDescription>
            {allSuccess 
              ? "O sistema está funcionando corretamente. Os dados mock estão sendo usados onde a API real não está disponível."
              : "Verifique os erros acima. Certifique-se de que as credenciais estão corretas no .env.local"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} className="w-full">
            Executar Testes Novamente
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 text-sm text-gray-600">
        <h2 className="font-semibold mb-2">Notas:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>CTT está usando dados mock para validação e cálculo de frete</li>
          <li>Resend está configurado e funcionando</li>
          <li>Login OTP pode mostrar o código no modo desenvolvimento</li>
          <li>Verifique o console do navegador para logs detalhados</li>
        </ul>
      </div>
    </div>
  )
}