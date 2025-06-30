"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SimpleLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const supabase = createClient()
      
      // 1. Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`Erro de login: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data.user) {
        setMessage("Usuário não encontrado")
        setLoading(false)
        return
      }

      setMessage(`Login OK! User ID: ${data.user.id}`)

      // 2. Verificar se é admin (sem query complexa)
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("id, email, full_name")
          .eq("id", data.user.id)
          .single()

        if (adminError) {
          setMessage(`Não é admin: ${adminError.message}`)
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        setMessage(`Admin encontrado: ${adminData.full_name}`)
        
        // 3. Redirecionar manualmente após 2 segundos
        setTimeout(() => {
          window.location.href = "/admin/dashboard"
        }, 2000)
        
      } catch (err) {
        setMessage(`Erro ao verificar admin: ${err}`)
        setLoading(false)
      }

    } catch (err) {
      setMessage(`Erro geral: ${err}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Login Admin (Simples)</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Versão simplificada para debug
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Processando..." : "Entrar"}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded ${message.includes("Erro") || message.includes("Não") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            <pre className="whitespace-pre-wrap text-sm">{message}</pre>
          </div>
        )}

        <div className="mt-4 text-center">
          <a href="/admin/test-auth" className="text-sm text-indigo-600 hover:text-indigo-500">
            Ir para página de teste
          </a>
        </div>
      </div>
    </div>
  )
}