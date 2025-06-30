import fs from 'fs'
import path from 'path'
import { getFreguesia } from './postal-codes-freguesias'

interface PostalCodeData {
  codigo_postal: string
  designacao_postal: string
  rua: string
  localidade: string
  freguesia: string
  concelho: string
  distrito: string
  cod_distrito: string
  cod_concelho: string
}

class PostalCodesDatabase {
  private static instance: PostalCodesDatabase
  private data: Record<string, PostalCodeData> = {}
  private loaded: boolean = false

  private constructor() {}

  static getInstance(): PostalCodesDatabase {
    if (!PostalCodesDatabase.instance) {
      PostalCodesDatabase.instance = new PostalCodesDatabase()
    }
    return PostalCodesDatabase.instance
  }

  private loadData() {
    if (this.loaded) return

    try {
      const dataPath = path.join(process.cwd(), 'data', 'postal-codes-portugal.json')
      const fileContent = fs.readFileSync(dataPath, 'utf8')
      this.data = JSON.parse(fileContent)
      this.loaded = true
      console.log(`✅ Base de dados de códigos postais carregada: ${Object.keys(this.data).length} registros`)
    } catch (error) {
      console.error('❌ Erro ao carregar base de dados de códigos postais:', error)
      this.data = {}
    }
  }

  getByPostalCode(postalCode: string): PostalCodeData | null {
    this.loadData()
    return this.data[postalCode] || null
  }

  search(query: string): PostalCodeData[] {
    this.loadData()
    const lowerQuery = query.toLowerCase()
    
    return Object.values(this.data)
      .filter(cp => 
        cp.codigo_postal.includes(query) ||
        cp.rua.toLowerCase().includes(lowerQuery) ||
        cp.localidade.toLowerCase().includes(lowerQuery) ||
        cp.freguesia.toLowerCase().includes(lowerQuery) ||
        cp.concelho.toLowerCase().includes(lowerQuery) ||
        cp.distrito.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20) // Limitar resultados
  }

  validatePostalCode(postalCode: string): {
    valido: boolean
    localidade?: string
    concelho?: string
    distrito?: string
    freguesia?: string
    rua?: string
  } {
    this.loadData()
    const data = this.data[postalCode]
    
    if (!data) {
      return { valido: false }
    }

    return {
      valido: true,
      localidade: data.localidade,
      concelho: data.concelho,
      distrito: data.distrito,
      freguesia: getFreguesia(postalCode, data.freguesia),
      rua: data.rua
    }
  }
}

// Exportar singleton
export const postalCodesDB = PostalCodesDatabase.getInstance()

// Função helper para validar código postal
export function validatePortuguesePostalCode(postalCode: string) {
  const data = postalCodesDB.getByPostalCode(postalCode)
  
  if (!data) {
    return {
      valid: false,
      message: 'Código postal não encontrado'
    }
  }

  return {
    valid: true,
    postal_code: data.codigo_postal,
    street: data.rua,
    locality: data.localidade,
    parish: getFreguesia(postalCode, data.freguesia),
    municipality: data.concelho,
    district: data.distrito
  }
}