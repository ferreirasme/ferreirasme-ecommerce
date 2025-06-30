import axios from 'axios'
import { getPostalCodeData } from './postal-codes'

interface PostalCodeApiResponse {
  CP: string
  CP4: string
  CP3: string
  Localidade: string
  Concelho: string
  Distrito: string
  [key: string]: any
}

// API alternativa para buscar códigos postais
// Fonte: https://www.ctt.pt/feapl_2/app/open/postalCodeSearch/postalCodeSearch.jspx
export async function fetchPostalCodeFromAPI(postalCode: string) {
  try {
    // Primeiro tentar a base local
    const localData = getPostalCodeData(postalCode)
    if (localData) {
      return {
        valido: true,
        localidade: localData.localidade,
        concelho: localData.concelho,
        distrito: localData.distrito
      }
    }

    // Se não encontrar localmente, tentar API pública
    // Nota: Esta é uma API de exemplo. Em produção, use a API oficial dos CTT
    const [cp4, cp3] = postalCode.split('-')
    
    // Simular busca em API (substituir por API real quando disponível)
    const response = await axios.get(`https://json.geoapi.pt/cp/${cp4}-${cp3}`, {
      timeout: 5000
    }).catch(() => null)

    if (response?.data) {
      return {
        valido: true,
        localidade: response.data.Localidade || response.data.localidade,
        concelho: response.data.Concelho || response.data.concelho,
        distrito: response.data.Distrito || response.data.distrito
      }
    }

    // Se todas as tentativas falharem, retornar inválido
    return { valido: false }
    
  } catch (error) {
    console.error('Erro ao buscar código postal:', error)
    
    // Em caso de erro, ainda tentar a base local
    const fallbackData = getPostalCodeData(postalCode)
    if (fallbackData) {
      return {
        valido: true,
        localidade: fallbackData.localidade,
        concelho: fallbackData.concelho,
        distrito: fallbackData.distrito
      }
    }
    
    return { valido: false }
  }
}

// Expandir a base de dados local com mais códigos postais
export const additionalPostalCodes: Record<string, any> = {
  // Adicionar códigos postais específicos conforme necessário
  '2700-001': { localidade: 'Amadora', concelho: 'Amadora', distrito: 'Lisboa' },
  '2795-001': { localidade: 'Linda-a-Velha', concelho: 'Oeiras', distrito: 'Lisboa' },
  '2805-001': { localidade: 'Almada', concelho: 'Almada', distrito: 'Setúbal' },
  '2810-001': { localidade: 'Almada', concelho: 'Almada', distrito: 'Setúbal' },
  '2825-001': { localidade: 'Costa da Caparica', concelho: 'Almada', distrito: 'Setúbal' },
  '2830-001': { localidade: 'Barreiro', concelho: 'Barreiro', distrito: 'Setúbal' },
  '2845-001': { localidade: 'Amora', concelho: 'Seixal', distrito: 'Setúbal' },
  '4100-001': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4150-001': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4200-001': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4250-001': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4300-001': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4350-001': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4400-001': { localidade: 'Vila Nova de Gaia', concelho: 'Vila Nova de Gaia', distrito: 'Porto' },
  '4410-001': { localidade: 'São Félix da Marinha', concelho: 'Vila Nova de Gaia', distrito: 'Porto' },
  '4420-001': { localidade: 'Gondomar', concelho: 'Gondomar', distrito: 'Porto' },
  '4430-001': { localidade: 'Vila Nova de Gaia', concelho: 'Vila Nova de Gaia', distrito: 'Porto' },
  '4435-001': { localidade: 'Rio Tinto', concelho: 'Gondomar', distrito: 'Porto' },
  '4440-001': { localidade: 'Valongo', concelho: 'Valongo', distrito: 'Porto' },
  '4445-001': { localidade: 'Ermesinde', concelho: 'Valongo', distrito: 'Porto' },
  '4450-001': { localidade: 'Matosinhos', concelho: 'Matosinhos', distrito: 'Porto' },
  '4460-001': { localidade: 'Senhora da Hora', concelho: 'Matosinhos', distrito: 'Porto' },
  '4465-001': { localidade: 'São Mamede de Infesta', concelho: 'Matosinhos', distrito: 'Porto' },
  '4470-001': { localidade: 'Maia', concelho: 'Maia', distrito: 'Porto' },
  '4475-001': { localidade: 'Maia', concelho: 'Maia', distrito: 'Porto' },
  '4480-001': { localidade: 'Vila do Conde', concelho: 'Vila do Conde', distrito: 'Porto' },
  '4485-001': { localidade: 'Vila do Conde', concelho: 'Vila do Conde', distrito: 'Porto' },
  '4490-001': { localidade: 'Póvoa de Varzim', concelho: 'Póvoa de Varzim', distrito: 'Porto' },
}