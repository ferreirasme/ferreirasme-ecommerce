"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Consultant {
  id: string
  code: string
  full_name: string
}

export default function ImportClientsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [file, setFile] = useState<File | null>(null)
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [selectedConsultant, setSelectedConsultant] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])

  // Fetch consultants on mount
  useState(() => {
    fetchConsultants()
  })

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, code, full_name')
        .eq('status', 'active')
        .order('full_name')

      if (error) throw error
      setConsultants(data || [])
    } catch (error) {
      console.error('Error fetching consultants:', error)
      toast.error('Erro ao carregar consultoras')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Parse CSV for preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        const data = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim())
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index]
            return obj
          }, {} as any)
        }).filter(row => Object.values(row).some(v => v))
        
        setPreview(data)
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file || !selectedConsultant) {
      toast.error('Por favor, selecione um arquivo e uma consultora')
      return
    }

    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('consultantId', selectedConsultant)

      const response = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar clientes')
      }

      toast.success(`${result.imported} clientes importados com sucesso!`)
      router.push('/admin/clients')
    } catch (error: any) {
      console.error('Error importing clients:', error)
      toast.error(error.message || 'Erro ao importar clientes')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `nome,email,telefone,whatsapp,endereco_rua,endereco_numero,endereco_complemento,endereco_bairro,endereco_cidade,endereco_estado,endereco_cep,data_nascimento
João Silva,joao@example.com,+351912345678,+351912345678,Rua das Flores,123,Apt 4B,Centro,Lisboa,Lisboa,1200-001,01/01/1990
Maria Santos,maria@example.com,+351923456789,,Av. da Liberdade,456,,Marquês de Pombal,Lisboa,Lisboa,1250-096,15/05/1985`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_clientes.csv'
    link.click()
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Importar Clientes</h1>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
            <CardDescription>
              Como importar clientes em massa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Formato aceito:</strong> Arquivo CSV com encoding UTF-8
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                1. Baixe o template CSV clicando no botão abaixo
              </p>
              <p className="text-sm text-gray-600">
                2. Preencha os dados dos clientes seguindo o formato do template
              </p>
              <p className="text-sm text-gray-600">
                3. Campos obrigatórios: nome e email
              </p>
              <p className="text-sm text-gray-600">
                4. O sistema verificará duplicatas pelo email
              </p>
            </div>

            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload do Arquivo</CardTitle>
            <CardDescription>
              Selecione o arquivo CSV e a consultora responsável
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consultant">Consultora Responsável *</Label>
              <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma consultora" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.full_name} ({consultant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo CSV *</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {preview.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Preview (primeiras 5 linhas):</h4>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0]).map((header) => (
                          <th key={header} className="px-4 py-2 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className="border-t">
                          {Object.values(row).map((value: any, i) => (
                            <td key={i} className="px-4 py-2">
                              {value || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/clients">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button 
                onClick={handleImport} 
                disabled={loading || !file || !selectedConsultant}
              >
                {loading ? (
                  <>Importando...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Clientes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}