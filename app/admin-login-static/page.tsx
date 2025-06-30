"use client"

import { useState } from "react"

export default function StaticLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    
    // Simulação sem usar Supabase
    if (email === "admin@ferreirasme.com" && password === "admin123") {
      setMessage("Login simulado com sucesso!")
      // Não redirecionar para evitar loops
    } else {
      setMessage("Email ou senha incorretos (use admin@ferreirasme.com / admin123)")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Login Admin (Estático)</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Versão sem Supabase para debug
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
            Entrar
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded ${message.includes("incorretos") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}