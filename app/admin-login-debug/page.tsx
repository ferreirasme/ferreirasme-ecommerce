"use client"

import { useState, useEffect } from "react"

export default function DebugLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const [supabaseLoaded, setSupabaseLoaded] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    addLog("Página carregada")
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    addLog("Iniciando login...")

    try {
      // Importar Supabase dinamicamente para evitar problemas na inicialização
      addLog("Importando módulo Supabase...")
      const { createClient } = await import("@/lib/supabase/client")
      addLog("Módulo importado com sucesso")

      addLog("Criando cliente Supabase...")
      const supabase = createClient()
      addLog("Cliente criado")

      addLog("Chamando signInWithPassword...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addLog(`Erro: ${error.message}`)
      } else {
        addLog(`Sucesso! User ID: ${data.user?.id}`)
      }
    } catch (err) {
      addLog(`Erro crítico: ${err}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Login Debug</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Versão com logs detalhados
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Testar Login
          </button>
        </form>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 max-w-4xl w-full p-4 bg-black text-green-400 rounded-lg font-mono text-xs overflow-auto">
          <h3 className="text-sm font-bold mb-2">Logs:</h3>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  )
}