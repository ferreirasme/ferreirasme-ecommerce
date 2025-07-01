import { getAdmin } from "@/lib/auth-admin"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TestAuthPage() {
  const supabase = await createClient()
  
  // Get user from auth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Get admin from database
  const admin = await getAdmin()
  
  // Test database access
  let consultantsTest = null
  let productsTest = null
  
  if (user) {
    const { data: consultants, error: consultantsError } = await supabase
      .from('consultants')
      .select('id')
      .limit(1)
    
    consultantsTest = { data: consultants, error: consultantsError }
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    productsTest = { data: products, error: productsError }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Teste de Autenticação Admin</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth User</CardTitle>
          </CardHeader>
          <CardContent>
            {userError ? (
              <div className="text-red-600">
                <p className="font-semibold">Erro:</p>
                <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(userError, null, 2)}
                </pre>
              </div>
            ) : user ? (
              <div>
                <p className="text-green-600 font-semibold mb-2">Usuário autenticado</p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                  }, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-orange-600">Nenhum usuário autenticado</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Admin Status</CardTitle>
          </CardHeader>
          <CardContent>
            {admin ? (
              <div>
                <p className="text-green-600 font-semibold mb-2">Admin válido</p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(admin, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-red-600">Não é um admin ou admin não encontrado</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Access - Consultants</CardTitle>
          </CardHeader>
          <CardContent>
            {consultantsTest?.error ? (
              <div className="text-red-600">
                <p className="font-semibold">Erro ao acessar consultants:</p>
                <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(consultantsTest.error, null, 2)}
                </pre>
              </div>
            ) : consultantsTest?.data ? (
              <p className="text-green-600">Acesso à tabela consultants OK</p>
            ) : (
              <p className="text-gray-600">Teste não executado</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Access - Products</CardTitle>
          </CardHeader>
          <CardContent>
            {productsTest?.error ? (
              <div className="text-red-600">
                <p className="font-semibold">Erro ao acessar products:</p>
                <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(productsTest.error, null, 2)}
                </pre>
              </div>
            ) : productsTest?.data ? (
              <p className="text-green-600">Acesso à tabela products OK</p>
            ) : (
              <p className="text-gray-600">Teste não executado</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify({
                NODE_ENV: process.env.NODE_ENV,
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}