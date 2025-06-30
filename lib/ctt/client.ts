import axios from 'axios'
import crypto from 'crypto'
import { getPostalCodeData, isValidPostalCodeFormat } from '@/lib/postal-codes'

// CTT E-commerce API Configuration
const CTT_API_BASE_URL = process.env.CTT_API_URL || 'https://api.cttexpresso.pt/services/rest'
const CTT_PUBLIC_KEY = process.env.CTT_PUBLIC_KEY
const CTT_SECRET_KEY = process.env.CTT_SECRET_KEY

// Validate CTT credentials
if (!CTT_PUBLIC_KEY || !CTT_SECRET_KEY) {
  console.warn('CTT API credentials not configured. Using mock data mode.')
}

interface CTTShippingRate {
  codigo_servico: string
  designacao_servico: string
  preco_total: number
  prazo_entrega: number
  tracking_disponivel: boolean
}

interface CTTAddress {
  nome: string
  morada: string
  localidade: string
  codigo_postal: string
  telefone?: string
  email?: string
}

interface CTTPackage {
  peso: number // em kg
  comprimento?: number // em cm
  largura?: number // em cm
  altura?: number // em cm
  valor_declarado?: number
  conteudo?: string
}

interface CTTShipmentResponse {
  numero_envio: string
  etiqueta_url: string
  guia_transporte_url: string
  tracking_code: string
}

export class CTTClient {
  private generateAuthHeaders(method: string, endpoint: string, body: any = {}): Record<string, string> {
    const timestamp = new Date().toISOString()
    const nonce = crypto.randomBytes(16).toString('hex')
    
    // Criar string para assinatura
    const dataToSign = `${method}${endpoint}${JSON.stringify(body)}${timestamp}${nonce}`
    
    // Gerar assinatura HMAC SHA256
    const signature = crypto
      .createHmac('sha256', CTT_SECRET_KEY || '')
      .update(dataToSign)
      .digest('base64')

    return {
      'Content-Type': 'application/json',
      'Authorization': `CTT ${CTT_PUBLIC_KEY}:${signature}`,
      'X-CTT-Timestamp': timestamp,
      'X-CTT-Nonce': nonce
    }
  }

  async calculateShipping(
    origem_cp: string,
    destino_cp: string,
    peso: number,
    servico?: string
  ): Promise<CTTShippingRate[]> {
    const endpoint = '/calcular-portes'
    const body = {
      origem: {
        codigo_postal: origem_cp
      },
      destino: {
        codigo_postal: destino_cp
      },
      encomenda: {
        peso: peso,
        formato: peso <= 2 ? 'ENVELOPE' : 'CAIXA'
      },
      servicos: servico ? [servico] : ['EXPRESSO10', 'EXPRESSO', 'ECONOMICO']
    }

    try {
      console.log('Calculando frete CTT:', { origem_cp, destino_cp, peso })
      
      const response = await axios.post(
        `${CTT_API_BASE_URL}${endpoint}`,
        body,
        {
          headers: this.generateAuthHeaders('POST', endpoint, body)
        }
      )

      // Mapear resposta para nosso formato
      return response.data.servicos.map((servico: any) => ({
        codigo_servico: servico.codigo,
        designacao_servico: servico.designacao,
        preco_total: servico.preco_total,
        prazo_entrega: servico.prazo_entrega,
        tracking_disponivel: servico.tracking || true
      }))
    } catch (error: any) {
      console.error('Erro ao calcular portes CTT:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      
      // Mock data para testes
      console.log('Usando dados mock para cálculo de frete')
      
      // Calcular preços baseados na distância simulada
      const basePrice = peso <= 2 ? 3.50 : 5.00
      
      return [
        {
          codigo_servico: 'EXPRESSO10',
          designacao_servico: 'Expresso 10:30',
          preco_total: basePrice + 4.50,
          prazo_entrega: 1,
          tracking_disponivel: true
        },
        {
          codigo_servico: 'EXPRESSO',
          designacao_servico: 'Expresso',
          preco_total: basePrice + 2.00,
          prazo_entrega: 1,
          tracking_disponivel: true
        },
        {
          codigo_servico: 'ECONOMICO',
          designacao_servico: 'Económico',
          preco_total: basePrice,
          prazo_entrega: 3,
          tracking_disponivel: true
        }
      ]
    }
  }

  async createShipment(
    remetente: CTTAddress,
    destinatario: CTTAddress,
    encomenda: CTTPackage,
    servico: string,
    referencia?: string
  ): Promise<CTTShipmentResponse> {
    const endpoint = '/criar-envio'
    const body = {
      remetente: {
        nome: remetente.nome,
        morada: remetente.morada,
        localidade: remetente.localidade,
        codigo_postal: remetente.codigo_postal,
        telefone: remetente.telefone,
        email: remetente.email
      },
      destinatario: {
        nome: destinatario.nome,
        morada: destinatario.morada,
        localidade: destinatario.localidade,
        codigo_postal: destinatario.codigo_postal,
        telefone: destinatario.telefone,
        email: destinatario.email
      },
      encomenda: {
        peso: encomenda.peso,
        comprimento: encomenda.comprimento,
        largura: encomenda.largura,
        altura: encomenda.altura,
        valor_declarado: encomenda.valor_declarado,
        conteudo: encomenda.conteudo || 'Semijoias',
        formato: encomenda.peso <= 2 ? 'ENVELOPE' : 'CAIXA'
      },
      servico: servico,
      referencia: referencia,
      etiqueta: {
        formato: 'PDF',
        impressao: 'A4'
      }
    }

    try {
      const response = await axios.post(
        `${CTT_API_BASE_URL}${endpoint}`,
        body,
        {
          headers: this.generateAuthHeaders('POST', endpoint, body)
        }
      )

      return {
        numero_envio: response.data.numero_envio,
        etiqueta_url: response.data.etiqueta_url,
        guia_transporte_url: response.data.guia_transporte_url,
        tracking_code: response.data.tracking_code
      }
    } catch (error: any) {
      console.error('Erro ao criar envio CTT:', error.response?.data || error)
      throw new Error('Falha ao criar envio')
    }
  }

  async trackShipment(trackingCode: string): Promise<any> {
    const endpoint = `/tracking/${trackingCode}`
    
    try {
      const response = await axios.get(
        `${CTT_API_BASE_URL}${endpoint}`,
        {
          headers: this.generateAuthHeaders('GET', endpoint)
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Erro ao rastrear envio CTT:', error.response?.data || error)
      throw new Error('Falha ao rastrear envio')
    }
  }

  async cancelShipment(numeroEnvio: string): Promise<boolean> {
    const endpoint = `/cancelar-envio/${numeroEnvio}`
    
    try {
      const response = await axios.delete(
        `${CTT_API_BASE_URL}${endpoint}`,
        {
          headers: this.generateAuthHeaders('DELETE', endpoint)
        }
      )

      return response.status === 200
    } catch (error: any) {
      console.error('Erro ao cancelar envio CTT:', error.response?.data || error)
      throw new Error('Falha ao cancelar envio')
    }
  }

  async validatePostalCode(codigoPostal: string): Promise<{
    valido: boolean
    localidade?: string
    concelho?: string
    distrito?: string
  }> {
    const endpoint = `/validar-codigo-postal/${codigoPostal}`
    
    try {
      console.log('Validando código postal:', codigoPostal)
      console.log('URL:', `${CTT_API_BASE_URL}${endpoint}`)
      
      const response = await axios.get(
        `${CTT_API_BASE_URL}${endpoint}`,
        {
          headers: this.generateAuthHeaders('GET', endpoint)
        }
      )

      console.log('Resposta CTT:', response.data)
      
      return {
        valido: response.data.valido,
        localidade: response.data.localidade,
        concelho: response.data.concelho,
        distrito: response.data.distrito
      }
    } catch (error: any) {
      console.error('Erro ao validar código postal:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      
      // Usar base de dados local de códigos postais
      if (isValidPostalCodeFormat(codigoPostal)) {
        const localData = getPostalCodeData(codigoPostal)
        if (localData) {
          console.log('Usando base de dados local de códigos postais')
          return {
            valido: true,
            localidade: localData.localidade,
            concelho: localData.concelho,
            distrito: localData.distrito
          }
        }
      }
      
      return { valido: false }
    }
  }

  // Método auxiliar para obter serviços disponíveis
  getAvailableServices() {
    return [
      {
        codigo: 'EXPRESSO10',
        nome: 'Expresso 10:30',
        descricao: 'Entrega até às 10:30 do dia seguinte'
      },
      {
        codigo: 'EXPRESSO',
        nome: 'Expresso',
        descricao: 'Entrega no dia seguinte'
      },
      {
        codigo: 'ECONOMICO',
        nome: 'Económico',
        descricao: 'Entrega em 3-5 dias úteis'
      },
      {
        codigo: 'CORREIO_VERDE',
        nome: 'Correio Verde',
        descricao: 'Entrega em 2 dias úteis'
      }
    ]
  }
}

// Singleton instance
export const cttClient = new CTTClient()