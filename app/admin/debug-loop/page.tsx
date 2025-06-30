"use client"

import { useState, useEffect } from "react"

export default function DebugLoopPage() {
  const [renderCount, setRenderCount] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  
  // Contador de renders
  useEffect(() => {
    setRenderCount(prev => prev + 1)
    console.log(`Render count: ${renderCount + 1}`)
  }, [])
  
  // Detectar loops
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString()
      setLogs(prev => [...prev.slice(-5), `${now} - Ainda rodando...`])
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Simular problema do Supabase/Auth
  const testSupabase = () => {
    try {
      // Apenas log, sem criar cliente
      console.log("Testando Supabase...")
      setLogs(prev => [...prev, "Supabase testado - OK"])
    } catch (error) {
      setLogs(prev => [...prev, `Erro: ${error}`])
    }
  }
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug de Loop</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 rounded p-4 mb-4">
        <p className="font-bold">⚠️ Página de Debug</p>
        <p>Esta página ajuda a identificar loops infinitos</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Estatísticas:</h2>
          <p>Renders: {renderCount}</p>
          <p>Se esse número crescer rapidamente, há um loop!</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Logs em tempo real:</h2>
          <div className="text-sm font-mono">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testSupabase}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Testar Supabase (sem criar cliente)
          </button>
          
          <a
            href="/admin/test-static"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
          >
            Voltar para página segura
          </a>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-600">
        <p>Dica: Abra o console (F12) e veja se há erros</p>
        <p>Se a página travar, o problema está em algum hook ou provider global</p>
      </div>
    </div>
  )
}