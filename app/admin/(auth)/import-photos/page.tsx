"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Camera, Users, Package, AlertCircle, CheckCircle } from "lucide-react"

export default function ImportPhotosPage() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [results, setResults] = useState<any>(null)

  const importPhotos = async (type: 'consultants' | 'products') => {
    setLoading(true)
    setProgress(0)
    setProgressMessage(`Importando fotos de ${type === 'consultants' ? 'consultoras' : 'produtos'}...`)
    setResults(null)

    try {
      const response = await fetch('/api/odoo/update-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const result = await response.json()

      if (response.ok) {
        setResults(result)
        toast.success(`${result.updated} fotos importadas com sucesso!`)
        if (result.errors > 0) {
          toast.error(`${result.errors} erros durante a importação`)
        }
      } else {
        throw new Error(result.error || 'Erro ao importar fotos')
      }
    } catch (error: any) {
      toast.error('Erro ao importar fotos: ' + error.message)
      setResults({
        error: error.message,
        updated: 0,
        errors: 1
      })
    } finally {
      setLoading(false)
      setProgress(100)
      setProgressMessage('')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Importar Fotos</h1>
        <p className="text-gray-600 mt-2">
          Importe fotos de consultoras e produtos da Odoo
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          As fotos serão importadas da Odoo para os registros que já possuem odoo_id.
          Certifique-se de ter importado consultoras e produtos antes de importar as fotos.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Consultant Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fotos de Consultoras
            </CardTitle>
            <CardDescription>
              Importa fotos das consultoras cadastradas na Odoo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Camera className="h-4 w-4" />
              <span>Fotos serão importadas do campo image_1920</span>
            </div>

            <Button
              onClick={() => importPhotos('consultants')}
              disabled={loading}
              className="w-full"
            >
              {loading && progressMessage.includes('consultoras') ? 'Importando...' : 'Importar Fotos de Consultoras'}
            </Button>

            {loading && progressMessage.includes('consultoras') && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{progressMessage}</p>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Product Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Fotos de Produtos
            </CardTitle>
            <CardDescription>
              Importa fotos dos produtos cadastrados na Odoo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Camera className="h-4 w-4" />
              <span>Fotos serão importadas do campo image_1920</span>
            </div>

            <Button
              onClick={() => importPhotos('products')}
              disabled={loading}
              className="w-full"
            >
              {loading && progressMessage.includes('produtos') ? 'Importando...' : 'Importar Fotos de Produtos'}
            </Button>

            {loading && progressMessage.includes('produtos') && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{progressMessage}</p>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultados da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            {results.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.updated}</p>
                    <p className="text-sm text-gray-600">Fotos Importadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{results.errors}</p>
                    <p className="text-sm text-gray-600">Erros</p>
                  </div>
                </div>

                {results.errorDetails && results.errorDetails.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Primeiros erros:</p>
                    <div className="space-y-1">
                      {results.errorDetails.map((e: any, i: number) => (
                        <p key={i} className="text-sm text-red-600">
                          {e.name}: {e.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {results.updated > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {results.updated} fotos foram importadas com sucesso!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}