"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import * as XLSX from 'xlsx'

interface BatchImportProps {
  file: File
  type: 'consultants' | 'products'
  onComplete: (results: any) => void
  testMode: boolean
}

export function BatchImport({ file, type, onComplete, testMode }: BatchImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')

  const BATCH_SIZE = 5 // Process 5 items at a time
  const DELAY_BETWEEN_BATCHES = 1000 // 1 second delay between batches

  const processBatch = async (items: any[], batchIndex: number, totalBatches: number) => {
    const results = {
      created: 0,
      errors: 0,
      alreadyExists: 0,
      errorDetails: [] as any[]
    }

    setStatus(`Processando lote ${batchIndex + 1} de ${totalBatches}...`)

    for (const item of items) {
      try {
        const endpoint = type === 'products' ? '/api/products/import-excel-v3' : '/api/consultants-fix'
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })

        const result = await response.json()

        if (response.ok) {
          results.created++
        } else {
          if (result.error && result.error.includes('já existe')) {
            results.alreadyExists++
          } else {
            results.errors++
            results.errorDetails.push({ 
              name: item.name || item.full_name, 
              error: result.error 
            })
          }
        }
      } catch (error: any) {
        results.errors++
        results.errorDetails.push({ 
          name: item.name || item.full_name, 
          error: error.message 
        })
      }
    }

    return results
  }

  const startImport = async () => {
    setIsProcessing(true)
    setProgress(0)
    setStatus('Lendo arquivo Excel...')

    try {
      // Read Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      // Prepare data based on type
      let itemsToProcess: any[] = []
      
      if (type === 'products') {
        itemsToProcess = jsonData.map(row => ({
          name: row['Nome'] || '',
          'Precos de venda': row['Preços de venda'] || row['Precos de venda'] || '0',
          'Custo': row['Custo'] || '0',
          'Quantidade em maos': row['Quantidade em mãos'] || row['Quantidade em maos'] || '0',
          'Quantidade prevista': row['Quantidade prevista'] || '0',
          'Favorito': row['Favorito'],
          'Referencia interna': row['Referência interna'] || row['Referencia interna'] || '',
          'Marcadores': row['Marcadores'] || '',
          'Decoracao de atividade excepcional': row['Decoração de atividade excepcional'] || row['Decoracao de atividade excepcional'] || ''
        })).filter(item => item.name)
      } else {
        itemsToProcess = jsonData.map(row => ({
          full_name: row['Nome completo'] || '',
          email: row['E-mail'] || '',
          phone: row['Telefone'] || 'A informar',
          address_city: row['Cidade'] || '',
          address_country: row['País'] === 'Portugal' ? 'PT' : row['País'] || 'PT',
          // Add other consultant fields as needed
          commission_percentage: 10,
          monthly_target: 1000,
          commission_period_days: 45
        })).filter(item => item.full_name && item.email)
      }

      // Apply test mode limit
      if (testMode) {
        itemsToProcess = itemsToProcess.slice(0, 10)
        toast.info(`Modo de teste: processando apenas ${itemsToProcess.length} itens`)
      }

      // Split into batches
      const batches: any[][] = []
      for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
        batches.push(itemsToProcess.slice(i, i + BATCH_SIZE))
      }

      // Process batches
      const totalResults = {
        created: 0,
        errors: 0,
        alreadyExists: 0,
        errorDetails: [] as any[]
      }

      for (let i = 0; i < batches.length; i++) {
        const batchResults = await processBatch(batches[i], i, batches.length)
        
        totalResults.created += batchResults.created
        totalResults.errors += batchResults.errors
        totalResults.alreadyExists += batchResults.alreadyExists
        totalResults.errorDetails.push(...batchResults.errorDetails)

        // Update progress
        const progressPercent = ((i + 1) / batches.length) * 100
        setProgress(progressPercent)

        // Delay between batches to avoid overwhelming the server
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }

      // Complete
      onComplete({
        type,
        total: itemsToProcess.length,
        ...totalResults,
        errorDetails: totalResults.errorDetails.slice(0, 5)
      })

      if (totalResults.created > 0) {
        toast.success(`${totalResults.created} ${type === 'products' ? 'produtos' : 'consultoras'} importados!`)
      }
      if (totalResults.alreadyExists > 0) {
        toast.info(`${totalResults.alreadyExists} já cadastrados`)
      }
      if (totalResults.errors > 0) {
        toast.error(`${totalResults.errors} erros`)
      }

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + error.message)
      setStatus('Erro: ' + error.message)
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setStatus('')
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={startImport}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Importando...' : `Importar ${type === 'products' ? 'Produtos' : 'Consultoras'} em Lotes`}
      </Button>

      {isProcessing && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{status}</p>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-gray-500">
            Processando em lotes de {BATCH_SIZE} itens para evitar timeout
          </p>
        </div>
      )}
    </div>
  )
}