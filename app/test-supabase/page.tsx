"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()
        
        // Testar conexão listando produtos
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(5)

        if (error) {
          throw error
        }

        setProducts(data || [])
        setStatus("success")
        setMessage("Conexão com Supabase estabelecida com sucesso!")
      } catch (error: any) {
        setStatus("error")
        setMessage(`Erro: ${error.message}`)
        console.error("Erro ao conectar com Supabase:", error)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Conexão Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Status:</p>
              <p className={`text-lg ${
                status === "success" ? "text-green-600" : 
                status === "error" ? "text-red-600" : 
                "text-yellow-600"
              }`}>
                {status === "loading" ? "Testando conexão..." : message}
              </p>
            </div>

            {products.length > 0 && (
              <div>
                <p className="font-semibold mb-2">Produtos encontrados:</p>
                <ul className="space-y-1">
                  {products.map((product) => (
                    <li key={product.id} className="text-sm">
                      • {product.name} - R$ {product.price}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}