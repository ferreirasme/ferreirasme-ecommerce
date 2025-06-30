"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        
        // Verificar usuário
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setError(`Erro ao buscar usuário: ${userError.message}`)
          setLoading(false)
          return
        }
        
        setUser(user)
        
        if (user) {
          // Verificar admin
          const { data: adminData, error: adminError } = await supabase
            .from("admins")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()
          
          if (adminError) {
            setError(`Erro ao buscar admin: ${adminError.message}`)
          } else {
            setAdmin(adminData)
          }
        }
      } catch (err) {
        setError(`Erro geral: ${err}`)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação Admin</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Usuário Autenticado:</h2>
          {user ? (
            <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
          ) : (
            <p>Nenhum usuário autenticado</p>
          )}
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Admin:</h2>
          {admin ? (
            <pre className="text-sm">{JSON.stringify(admin, null, 2)}</pre>
          ) : (
            <p>Não é um admin ou admin não encontrado</p>
          )}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = "/admin/login"}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Ir para Login
          </button>
          
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = "/admin/login"
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    </div>
  )
}