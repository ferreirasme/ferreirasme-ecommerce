"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, Download, Users, Package, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import * as XLSX from 'xlsx'

export default function ImportExcelPage() {
  const [loading, setLoading] = useState(false)
  const [consultantsFile, setConsultantsFile] = useState<File | null>(null)
  const [productsFile, setProductsFile] = useState<File | null>(null)
  const [results, setResults] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'consultants' | 'products') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'consultants') {
        setConsultantsFile(file)
      } else {
        setProductsFile(file)
      }
    }
  }

  const processConsultantsFile = async () => {
    if (!consultantsFile) {
      toast.error('Selecione um arquivo de consultoras')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      // Read file
      const data = await consultantsFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('Consultants data:', jsonData)

      let created = 0
      let errors = 0
      const errorDetails: any[] = []

      for (const row of jsonData) {
        try {
          const name = row['Nome completo'] || ''
          const email = row['E-mail'] || ''
          const phone = row['Telefone'] || ''
          const city = row['Cidade'] || ''
          const country = row['País'] || 'Portugal'

          if (!name || !email) {
            continue
          }

          const response = await fetch('/api/consultants-simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: name,
              email: email.toLowerCase().trim(),
              phone: phone,
              whatsapp: phone,
              address: {
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: city,
                state: '',
                postalCode: '',
                country: country === 'Portugal' ? 'PT' : country
              },
              bank: {
                name: '',
                iban: '',
                accountHolder: name
              },
              commission: {
                percentage: 10,
                monthlyTarget: 1000,
                periodDays: 45
              },
              notes: `Importado do Excel em ${new Date().toLocaleDateString('pt-BR')}`
            })
          })

          const result = await response.json()

          if (response.ok) {
            created++
          } else {
            errors++
            errorDetails.push({ name, error: result.error })
          }
        } catch (error: any) {
          errors++
          errorDetails.push({ name: row['Nome completo'], error: error.message })
        }
      }

      setResults({
        type: 'consultants',
        total: jsonData.length,
        created,
        errors,
        errorDetails: errorDetails.slice(0, 5)
      })

      if (created > 0) {
        toast.success(`${created} consultoras importadas com sucesso!`)
      }
      if (errors > 0) {
        toast.error(`${errors} erros ao importar consultoras`)
      }

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const processProductsFile = async () => {
    if (!productsFile) {
      toast.error('Selecione um arquivo de produtos')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      // Read file
      const data = await productsFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('Products data:', jsonData)

      // For now, just show a summary
      const productsData = jsonData.map((row: any) => ({
        name: row['Nome'] || '',
        price: parseFloat(row['Preços de venda'] || '0'),
        cost: parseFloat(row['Custo'] || '0'),
        stockOnHand: parseInt(row['Quantidade em mãos'] || '0'),
        stockForecast: parseInt(row['Quantidade prevista'] || '0'),
        isFavorite: row['Favorito'] === true
      }))

      setResults({
        type: 'products',
        total: productsData.length,
        data: productsData.slice(0, 10),
        message: 'Produtos processados. Use a importação da Odoo para adicionar ao sistema.'
      })

      toast.success(`${productsData.length} produtos processados`)

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Importar do Excel</h1>
        <p className="text-gray-600 mt-2">
          Importe consultoras e produtos de arquivos Excel
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Use os arquivos Excel exportados da Odoo. Para consultoras, use "Contato (res.partner).xlsx".
          Para produtos, use "Produto (product.template).xlsx".
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
              Importa consultoras de arquivo Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="consultants-file">Arquivo Excel de Consultoras</Label>
              <Input
                id="consultants-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileChange(e, 'consultants')}
                disabled={loading}
              />
            </div>
            
            {consultantsFile && (
              <p className="text-sm text-gray-600">
                Arquivo selecionado: {consultantsFile.name}
              </p>
            )}

            <Button
              onClick={processConsultantsFile}
              disabled={!consultantsFile || loading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Consultoras
            </Button>
          </CardContent>
        </Card>

        {/* Import Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Processar Produtos
            </CardTitle>
            <CardDescription>
              Processa produtos de arquivo Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="products-file">Arquivo Excel de Produtos</Label>
              <Input
                id="products-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileChange(e, 'products')}
                disabled={loading}
              />
            </div>
            
            {productsFile && (
              <p className="text-sm text-gray-600">
                Arquivo selecionado: {productsFile.name}
              </p>
            )}

            <Button
              onClick={processProductsFile}
              disabled={!productsFile || loading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Processar Produtos
            </Button>
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
            {results.type === 'consultants' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{results.total}</p>
                    <p className="text-sm text-gray-600">Total de registros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.created}</p>
                    <p className="text-sm text-gray-600">Importados</p>
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
              </div>
            ) : (
              <div className="space-y-4">
                <p>{results.message}</p>
                <p className="text-lg">Total de produtos: <strong>{results.total}</strong></p>
                
                {results.data && (
                  <div>
                    <p className="font-medium mb-2">Amostra dos produtos:</p>
                    <div className="space-y-1">
                      {results.data.slice(0, 5).map((p: any, i: number) => (
                        <p key={i} className="text-sm">
                          {p.name} - R$ {p.price.toFixed(2)} (Estoque: {p.stockForecast || p.stockOnHand || 0})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}