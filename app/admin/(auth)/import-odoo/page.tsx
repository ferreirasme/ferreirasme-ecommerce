"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Download, Users, Package, CheckCircle, XCircle, AlertCircle, FileImage } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

export default function ImportOdooPage() {
  const [importing, setImporting] = useState(false)
  const [importType, setImportType] = useState<"consultants" | "products" | null>(null)
  const [results, setResults] = useState<any>(null)
  const [progress, setProgress] = useState<string>("")
  const [sampleProducts, setSampleProducts] = useState<any[]>([])
  const [loadingSamples, setLoadingSamples] = useState(false)

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

  const fetchSampleProducts = async () => {
    setLoadingSamples(true)
    try {
      const response = await fetch('/api/products?limit=4&sort=created_at&order=desc')
      const data = await response.json()
      
      if (response.ok && data.products) {
        setSampleProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching sample products:', error)
    } finally {
      setLoadingSamples(false)
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
    setSampleProducts([]) // Clear previous samples
    setProgress("Conectando com Odoo...")

    try {
      const connected = await testConnection()
      if (!connected) {
        setImporting(false)
        setProgress("")
        return
      }

      setProgress("Buscando produtos no Odoo...")
      const response = await fetch('/api/odoo/import-products', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        const totalProcessed = data.created + data.updated
        
        if (totalProcessed > 0) {
          toast.success(`Importação concluída! ${totalProcessed} produtos processados`)
          // Fetch sample products after successful import
          setTimeout(() => {
            fetchSampleProducts()
          }, 1000)
        } else if (data.errors > 0) {
          toast.error(`Importação falhou com ${data.errors} erros`)
        } else {
          toast.warning('Nenhum produto foi importado')
        }
      } else {
        toast.error(data.error || 'Erro ao importar produtos')
      }
    } catch (error) {
      toast.error('Erro ao importar produtos')
    } finally {
      setImporting(false)
      setProgress("")
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
              
              {importing && importType === 'products' && progress && (
                <div className="space-y-2">
                  <Progress className="h-2" />
                  <p className="text-sm text-gray-600 text-center">{progress}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Importação</CardTitle>
              <CardDescription>
                Total de {results.total || 0} produtos encontrados no Odoo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.created > 0 && (
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">{results.created}</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">Produtos criados</p>
                    </div>
                  )}
                  
                  {results.updated > 0 && (
                    <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                      <div className="flex items-center gap-2 text-blue-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">{results.updated}</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">Produtos atualizados</p>
                    </div>
                  )}
                  
                  {results.errors > 0 && (
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">{results.errors}</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">Erros encontrados</p>
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {results.details && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Detalhes da Importação
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Produtos processados:</span>
                          <span className="font-medium">{results.details.processed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Produtos ignorados:</span>
                          <span className="font-medium">{results.details.skipped || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Categorias mapeadas:</span>
                          <span className="font-medium">{results.details.categoriesMapped || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Error Sample */}
                    {results.details.errorSample && results.details.errorSample.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3 text-red-600">Amostra de Erros</h4>
                        <div className="space-y-2">
                          {results.details.errorSample.map((error: any, index: number) => (
                            <div key={index} className="p-3 bg-red-50 rounded-lg text-sm">
                              <p className="font-medium text-red-800">{error.product}</p>
                              <p className="text-red-600 mt-1">{error.error}</p>
                              <p className="text-xs text-red-500 mt-1">Odoo ID: {error.odoo_id}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Actions */}
          {(results.created > 0 || results.updated > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Próximos Passos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/admin/products'}
                    className="w-full"
                  >
                    Ver Produtos Importados
                  </Button>
                  <p className="text-sm text-gray-600 text-center">
                    {results.created > 0 && `${results.created} novos produtos foram adicionados ao catálogo.`}
                    {results.updated > 0 && ` ${results.updated} produtos foram atualizados.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Products */}
          {sampleProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Produtos Importados Recentemente</CardTitle>
                <CardDescription>
                  Amostra dos produtos que foram importados do Odoo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSamples ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sampleProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {product.main_image_url ? (
                          <div className="relative h-32 mb-3 rounded overflow-hidden bg-gray-100">
                            <Image
                              src={product.main_image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-32 mb-3 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                        <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                        {product.stock_quantity !== undefined && (
                          <p className="text-xs text-gray-500">Estoque: {product.stock_quantity}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}