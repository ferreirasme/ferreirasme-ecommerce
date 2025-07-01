"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Upload, Download, Users, Package, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import * as XLSX from 'xlsx'

export default function ImportExcelPage() {
  const [loading, setLoading] = useState(false)
  const [consultantsFile, setConsultantsFile] = useState<File | null>(null)
  const [productsFile, setProductsFile] = useState<File | null>(null)
  const [results, setResults] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [testMode, setTestMode] = useState(true) // Modo de teste ativado por padrão

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
    setProgress(0)
    setProgressMessage('Lendo arquivo Excel...')

    try {
      // Read file
      const data = await consultantsFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      console.log('Consultants data:', jsonData)

      let created = 0
      let errors = 0
      let alreadyExists = 0
      const errorDetails: any[] = []
      const itemsToProcess = testMode ? jsonData.slice(0, 10) : jsonData
      const totalItems = itemsToProcess.length

      if (testMode) {
        toast.info(`Modo de teste: processando apenas ${itemsToProcess.length} primeiras consultoras`)
      }

      for (let i = 0; i < itemsToProcess.length; i++) {
        const row = itemsToProcess[i]
        try {
          const name = row['Nome completo'] || ''
          const email = row['E-mail'] || ''
          const phone = row['Telefone'] || 'A informar' // Valor padrão se não tiver telefone
          const city = row['Cidade'] || ''
          const country = row['País'] || 'Portugal'

          if (!name || !email) {
            console.log(`Pulando registro sem nome ou email: ${row['Nome completo']}`)
            continue
          }

          // Update progress
          const currentProgress = Math.round(((i + 1) / totalItems) * 100)
          setProgress(currentProgress)
          setProgressMessage(`Processando ${i + 1} de ${totalItems} consultoras...`)

          const response = await fetch('/api/consultants-fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: name,
              email: email.toLowerCase().trim(),
              phone: phone,
              whatsapp: phone,
              address_street: '',
              address_number: '',
              address_complement: '',
              address_neighborhood: '',
              address_city: city,
              address_state: '',
              address_postal_code: '',
              address_country: country === 'Portugal' ? 'PT' : country,
              bank_name: '',
              bank_iban: '',
              bank_account_holder: name,
              commission_percentage: 10,
              monthly_target: 1000,
              commission_period_days: 45,
              notes: `Importado do Excel em ${new Date().toLocaleDateString('pt-BR')}`
            })
          })

          const result = await response.json()

          if (response.ok) {
            created++
          } else {
            if (result.error && result.error.includes('já está cadastrada')) {
              alreadyExists++
            } else {
              errors++
              errorDetails.push({ name, error: result.error })
            }
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
        alreadyExists,
        errorDetails: errorDetails.slice(0, 5)
      })

      if (created > 0) {
        toast.success(`${created} consultoras importadas com sucesso!`)
      }
      if (alreadyExists > 0) {
        toast.info(`${alreadyExists} consultoras já estavam cadastradas`)
      }
      if (errors > 0) {
        toast.error(`${errors} erros ao importar consultoras`)
      }

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + error.message)
    } finally {
      setLoading(false)
      setProgress(0)
      setProgressMessage('')
    }
  }

  const processProductsFile = async () => {
    if (!productsFile) {
      toast.error('Selecione um arquivo de produtos')
      return
    }

    setLoading(true)
    setResults(null)
    setProgress(0)
    setProgressMessage('Lendo arquivo Excel...')

    try {
      // Read file
      const data = await productsFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      console.log('Products data:', jsonData)

      let created = 0
      let errors = 0
      let alreadyExists = 0
      const errorDetails: any[] = []
      const itemsToProcess = testMode ? jsonData.slice(0, 10) : jsonData
      const totalItems = itemsToProcess.length

      if (testMode) {
        toast.info(`Modo de teste: processando apenas ${itemsToProcess.length} primeiros produtos`)
      }

      for (let i = 0; i < itemsToProcess.length; i++) {
        const row = itemsToProcess[i]
        
        try {
          const name = row['Nome'] || ''
          const price = parseFloat(row['Preços de venda'] || row['Preço de venda'] || '0')
          const cost = parseFloat(row['Custo'] || '0')
          const stockOnHand = parseInt(row['Quantidade em mãos'] || '0')
          const stockForecast = parseInt(row['Quantidade prevista'] || '0')
          const isFavorite = row['Favorito'] === true || row['Favorito'] === 'true'
          
          if (!name) {
            console.log(`Pulando produto sem nome`)
            continue
          }

          // Update progress
          const currentProgress = Math.round(((i + 1) / totalItems) * 100)
          setProgress(currentProgress)
          setProgressMessage(`Processando ${i + 1} de ${totalItems} produtos...`)

          const response = await fetch('/api/products/import-excel-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              price,
              cost,
              stockOnHand,
              stockForecast,
              stock: stockForecast || stockOnHand,
              isFavorite
            })
          })

          const result = await response.json()

          if (response.ok) {
            created++
          } else {
            if (result.error && result.error.includes('já existe')) {
              alreadyExists++
            } else {
              errors++
              errorDetails.push({ name, error: result.error })
            }
          }
          
        } catch (error: any) {
          errors++
          errorDetails.push({ name: row['Nome'], error: error.message })
        }
      }

      setResults({
        type: 'products',
        total: jsonData.length,
        created,
        errors,
        alreadyExists,
        errorDetails: errorDetails.slice(0, 5)
      })

      if (created > 0) {
        toast.success(`${created} produtos importados com sucesso!`)
      }
      if (alreadyExists > 0) {
        toast.info(`${alreadyExists} produtos já estavam cadastrados`)
      }
      if (errors > 0) {
        toast.error(`${errors} erros ao importar produtos`)
      }

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + error.message)
    } finally {
      setLoading(false)
      setProgress(0)
      setProgressMessage('')
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

      {/* Modo de Teste */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="test-mode">Modo de Teste</Label>
              <p className="text-sm text-gray-600">
                Processa apenas 10 primeiros registros para teste rápido
              </p>
            </div>
            <Switch 
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>
        </CardContent>
      </Card>

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
              {loading ? 'Importando...' : 'Importar Consultoras'}
            </Button>

            {loading && progressMessage && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{progressMessage}</p>
                <Progress value={progress} className="w-full" />
              </div>
            )}
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
              {loading ? 'Importando...' : 'Importar Produtos'}
            </Button>

            {loading && progressMessage && (
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
            {results.type === 'consultants' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{results.total}</p>
                    <p className="text-sm text-gray-600">Total de registros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.created}</p>
                    <p className="text-sm text-gray-600">Importados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{results.alreadyExists || 0}</p>
                    <p className="text-sm text-gray-600">Já cadastrados</p>
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{results.total}</p>
                    <p className="text-sm text-gray-600">Total de produtos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.created}</p>
                    <p className="text-sm text-gray-600">Importados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{results.alreadyExists || 0}</p>
                    <p className="text-sm text-gray-600">Já cadastrados</p>
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}