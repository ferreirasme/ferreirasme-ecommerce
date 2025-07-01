"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, Users, Package, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

interface ImportResult {
  success: boolean
  created?: number
  updated?: number
  errors?: number
  total?: number
  details?: any
  error?: string
}

export default function ImportOdooPage() {
  const [importingProducts, setImportingProducts] = useState(false)
  const [importingConsultants, setImportingConsultants] = useState(false)
  const [productResult, setProductResult] = useState<ImportResult | null>(null)
  const [consultantResult, setConsultantResult] = useState<ImportResult | null>(null)

  const handleImportProducts = async () => {
    setImportingProducts(true)
    setProductResult(null)
    
    try {
      const response = await fetch('/api/odoo/import-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar produtos')
      }
      
      setProductResult(data)
      toast.success(`Produtos importados: ${data.created} criados, ${data.updated} atualizados`)
    } catch (error: any) {
      console.error('Error importing products:', error)
      setProductResult({ success: false, error: error.message })
      toast.error('Erro ao importar produtos: ' + error.message)
    } finally {
      setImportingProducts(false)
    }
  }

  const handleImportConsultants = async () => {
    setImportingConsultants(true)
    setConsultantResult(null)
    
    try {
      const response = await fetch('/api/odoo/import-consultants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar consultoras')
      }
      
      setConsultantResult(data)
      toast.success(`Consultoras importadas: ${data.created} criadas, ${data.updated} atualizadas`)
    } catch (error: any) {
      console.error('Error importing consultants:', error)
      setConsultantResult({ success: false, error: error.message })
      toast.error('Erro ao importar consultoras: ' + error.message)
    } finally {
      setImportingConsultants(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Importar do Odoo</h1>
        <p className="text-gray-600 mt-2">
          Importe produtos e consultoras diretamente do sistema Odoo
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Products Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Importar Produtos
            </CardTitle>
            <CardDescription>
              Importa todos os produtos vendáveis do Odoo, incluindo imagens, categorias e estoque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleImportProducts}
              disabled={importingProducts}
              className="w-full"
            >
              {importingProducts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Produtos
                </>
              )}
            </Button>

            {productResult && (
              <Alert variant={productResult.success ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {productResult.success ? "Importação concluída" : "Erro na importação"}
                </AlertTitle>
                <AlertDescription>
                  {productResult.success ? (
                    <div className="space-y-1 mt-2">
                      <p>Total processado: {productResult.total}</p>
                      <p>Criados: {productResult.created}</p>
                      <p>Atualizados: {productResult.updated}</p>
                      {productResult.errors > 0 && (
                        <p className="text-red-600">Erros: {productResult.errors}</p>
                      )}
                    </div>
                  ) : (
                    <p>{productResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Import Consultants Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Importar Consultoras
            </CardTitle>
            <CardDescription>
              Importa todas as consultoras (parceiros) do Odoo com seus dados de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleImportConsultants}
              disabled={importingConsultants}
              className="w-full"
            >
              {importingConsultants ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Consultoras
                </>
              )}
            </Button>

            {consultantResult && (
              <Alert variant={consultantResult.success ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {consultantResult.success ? "Importação concluída" : "Erro na importação"}
                </AlertTitle>
                <AlertDescription>
                  {consultantResult.success ? (
                    <div className="space-y-1 mt-2">
                      <p>Total processado: {consultantResult.total}</p>
                      <p>Criados: {consultantResult.created}</p>
                      <p>Atualizados: {consultantResult.updated}</p>
                      {consultantResult.errors > 0 && (
                        <p className="text-red-600">Erros: {consultantResult.errors}</p>
                      )}
                    </div>
                  ) : (
                    <p>{consultantResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instruções de Importação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• A importação pode demorar alguns minutos dependendo da quantidade de dados</p>
          <p>• Produtos existentes serão atualizados com base no ID do Odoo</p>
          <p>• Imagens serão enviadas automaticamente para o armazenamento</p>
          <p>• Categorias serão criadas automaticamente se não existirem</p>
          <p>• O estoque será sincronizado com os valores atuais do Odoo</p>
        </CardContent>
      </Card>
    </div>
  )
}