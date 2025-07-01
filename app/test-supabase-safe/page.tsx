"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client-safe"

export default function TestSupabaseSafe() {
  const [status, setStatus] = useState("Não testado")
  const [error, setError] = useState("")
  const [details, setDetails] = useState<any>({})

  async function testSupabase() {
    setStatus("Testando...")
    setError("")
    setDetails({})

    try {
      // Passo 1: Criar cliente
      const supabase = createClient()
      setStatus("Cliente criado com sucesso!")
      
      // Passo 2: Tentar uma operação simples
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      setDetails({
        session: data.session ? "Sessão ativa" : "Sem sessão",
        timestamp: new Date().toISOString()
      })
      
      setStatus("✅ Supabase funcionando corretamente!")
    } catch (err: any) {
      setError(err.message || "Erro desconhecido")
      setStatus("❌ Erro ao testar Supabase")
      console.error("Erro completo:", err)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste Supabase Seguro</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <p className="text-sm">Esta página usa uma versão segura do cliente com:</p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>Singleton para evitar múltiplas instâncias</li>
          <li>Verificação de ambiente browser</li>
          <li>Configurações explícitas de auth</li>
          <li>Tratamento de erros melhorado</li>
        </ul>
      </div>
      
      <button
        onClick={testSupabase}
        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
      >
        Testar Cliente Seguro
      </button>

      <div className="mt-6 space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        {error && (
          <div className="bg-red-50 p-3 rounded">
            <strong className="text-red-600">Erro:</strong> {error}
          </div>
        )}
        
        {Object.keys(details).length > 0 && (
          <div className="bg-gray-50 p-3 rounded">
            <strong>Detalhes:</strong>
            <pre className="text-sm mt-2">{JSON.stringify(details, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}