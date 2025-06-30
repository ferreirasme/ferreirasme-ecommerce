"use client"

import { useState } from "react"

export default function TestSupabaseInit() {
  const [status, setStatus] = useState("Não testado")
  const [error, setError] = useState("")

  async function testSupabase() {
    setStatus("Testando...")
    setError("")

    try {
      // Teste 1: Verificar variáveis de ambiente
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        throw new Error("Variáveis de ambiente não encontradas")
      }

      setStatus(`URL: ${url.substring(0, 30)}...`)

      // Teste 2: Importar módulo
      const { createClient } = await import("@/lib/supabase/client")
      
      // Teste 3: Criar cliente
      const supabase = createClient()
      
      // Teste 4: Fazer uma query simples
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      setStatus("Supabase funcionando! Sessão: " + (data.session ? "Ativa" : "Nenhuma"))
    } catch (err: any) {
      setError(err.message || "Erro desconhecido")
      setStatus("Erro")
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Inicialização Supabase</h1>
      
      <button
        onClick={testSupabase}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Testar Supabase
      </button>

      <div className="mt-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <p className="text-red-600"><strong>Erro:</strong> {error}</p>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Esta página testa:</p>
        <ul className="list-disc list-inside">
          <li>Variáveis de ambiente</li>
          <li>Importação do módulo Supabase</li>
          <li>Criação do cliente</li>
          <li>Query básica (getSession)</li>
        </ul>
      </div>
    </div>
  )
}