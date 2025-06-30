"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AdminCleanLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus("Fazendo login...")

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setStatus(`Erro: ${error.message}`)
        return
      }

      setStatus("Login OK! Redirecionando em 3 segundos...")
      
      // Esperar 3 segundos antes de redirecionar
      setTimeout(() => {
        window.location.href = "/admin/dashboard"
      }, 3000)
      
    } catch (err) {
      setStatus(`Erro: ${err}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Admin Login (Sem AuthProvider)
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Entrar
          </button>
        </form>
        
        {status && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            {status}
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Esta página não usa AuthProvider para evitar loops</p>
        </div>
      </div>
    </div>
  )
}