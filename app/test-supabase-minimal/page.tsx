"use client"

import { useEffect, useState } from "react"

export default function TestSupabaseMinimal() {
  const [status, setStatus] = useState<string[]>([])
  
  const addStatus = (msg: string) => {
    console.log(msg)
    setStatus(prev => [...prev, `${new Date().toISOString()}: ${msg}`])
  }

  useEffect(() => {
    addStatus("Página carregada")
    
    // Verificar variáveis de ambiente
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url) {
      addStatus("❌ NEXT_PUBLIC_SUPABASE_URL não encontrada")
    } else {
      addStatus(`✅ URL: ${url.substring(0, 30)}...`)
    }
    
    if (!key) {
      addStatus("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada")
    } else {
      addStatus(`✅ KEY: ${key.substring(0, 20)}...`)
    }
  }, [])

  const testImport = async () => {
    try {
      addStatus("Testando import do módulo...")
      const module = await import("@/lib/supabase/client")
      addStatus("✅ Módulo importado com sucesso")
      
      addStatus("Criando cliente...")
      const client = module.createClient()
      addStatus("✅ Cliente criado")
      
      // Não fazer nenhuma query por enquanto
      addStatus("✅ Teste concluído sem erros!")
    } catch (error: any) {
      addStatus(`❌ Erro: ${error.message}`)
      console.error("Erro completo:", error)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste Minimal Supabase</h1>
      
      <button
        onClick={testImport}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Testar Import e Criação do Cliente
      </button>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Status:</h2>
        {status.map((s, i) => (
          <div key={i} className="text-sm font-mono mb-1">{s}</div>
        ))}
      </div>
      
      <div className="mt-8 text-sm text-gray-600">
        <p>Esta página:</p>
        <ul className="list-disc list-inside">
          <li>Verifica variáveis de ambiente no carregamento</li>
          <li>Testa import do módulo apenas quando botão é clicado</li>
          <li>Cria cliente mas não faz queries</li>
          <li>Registra todos os passos no console</li>
        </ul>
      </div>
    </div>
  )
}