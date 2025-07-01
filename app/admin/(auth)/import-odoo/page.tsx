"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Download, Users, Package, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ImportOdooPage() {
  const [importing, setImporting] = useState(false)
  const [importType, setImportType] = useState<"consultants" | "products" | null>(null)
  const [results, setResults] = useState<any>(null)

  const testConnection = async () => {
    try {
      const response = await fetch('/api/odoo/test-connection-simple')
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Conexão com Odoo estabelecida!')
        return true
      } else {
        toast.error(data.error || 'Erro ao conectar com Odoo')
        return false
      }
    } catch (error) {
      toast.error('Erro ao testar conexão')
      return false
    }
  }

  const importConsultants = async () => {
    setImporting(true)
    setImportType('consultants')
    setResults(null)

    try {
      const connected = await testConnection()
      if (!connected) {
        setImporting(false)
        return
      }

      const response = await fetch('/api/odoo/import-consultants', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        toast.success(`${data.created} consultoras importadas com sucesso!`)
      } else {
        toast.error(data.error || 'Erro ao importar consultoras')
      }
    } catch (error) {
      toast.error('Erro ao importar consultoras')
    } finally {
      setImporting(false)
    }
  }

  const importProducts = async () => {
    setImporting(true)
    setImportType('products')
    setResults(null)

    try {
      const connected = await testConnection()
      if (!connected) {
        setImporting(false)
        return
      }

      const response = await fetch('/api/odoo/sync-products', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        toast.success(`${data.created} produtos importados com sucesso!`)
      } else {
        toast.error(data.error || 'Erro ao importar produtos')
      }
    } catch (error) {
      toast.error('Erro ao importar produtos')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Importar da Odoo</h1>
        <p className="text-gray-600 mt-2">
          Importe consultoras e produtos do seu sistema Odoo
        </p>
      </div>

      <Alert>
        <AlertDescription>
          A importação irá buscar todos os dados da Odoo e criar registros no sistema.
          Consultoras e produtos existentes serão atualizados.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Consultants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Importar Consultoras
            </CardTitle>
            <CardDescription>
              Importa todos os contatos (parceiros) da Odoo como consultoras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Esta ação irá:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Buscar todos os contatos pessoas físicas</li>
                  <li>Criar contas de acesso para cada consultora</li>
                  <li>Importar dados de contato e NIF</li>
                  <li>Gerar códigos únicos automaticamente</li>
                </ul>
              </div>
              
              <Button 
                onClick={importConsultants}
                disabled={importing}
                className="w-full"
              >
                {importing && importType === 'consultants' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar Consultoras
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Importar Produtos
            </CardTitle>
            <CardDescription>
              Importa todos os produtos e variantes da Odoo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Esta ação irá:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Buscar todos os produtos ativos</li>
                  <li>Importar preços e estoque</li>
                  <li>Baixar imagens dos produtos</li>
                  <li>Criar categorias automaticamente</li>
                </ul>
              </div>
              
              <Button 
                onClick={importProducts}
                disabled={importing}
                className="w-full"
              >
                {importing && importType === 'products' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar Produtos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.created > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>{results.created} registros criados</span>
                </div>
              )}
              
              {results.updated > 0 && (
                <div className="flex items-center gap-2 text-blue-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>{results.updated} registros atualizados</span>
                </div>
              )}
              
              {results.errors > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>{results.errors} erros encontrados</span>
                </div>
              )}

              {results.details && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Detalhes:</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(results.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}