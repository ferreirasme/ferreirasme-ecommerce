import axios from 'axios'

// API alternativa para buscar códigos postais com logradouros
// Usando o serviço codigo-postal.pt como exemplo

interface CEPResponse {
  CP: string
  CP4: string
  CP3: string
  Localidade: string
  Arteria?: string
  Troço?: string
  Designação?: string
  Concelho?: string
  Distrito?: string
}

export async function fetchAddressFromCEP(postalCode: string) {
  try {
    // Formatar código postal
    const [cp4, cp3] = postalCode.split('-')
    
    // Tentar buscar na API codigo-postal.pt
    const response = await axios.get(
      `https://codigo-postal.pt/api/cp/${cp4}-${cp3}`,
      {
        timeout: 3000,
        headers: {
          'Accept': 'application/json'
        }
      }
    ).catch(() => null)

    if (response?.data) {
      const data = response.data
      return {
        street: data.Arteria || data.Designação || null,
        locality: data.Localidade,
        municipality: data.Concelho,
        district: data.Distrito
      }
    }

    // Alternativa: tentar API dos CTT (quando disponível)
    // Esta URL é um exemplo - substituir pela API real quando disponível
    const cttResponse = await axios.get(
      `https://www.ctt.pt/feapl_2/app/open/postalCodeSearch/search.json?cp4=${cp4}&cp3=${cp3}`,
      {
        timeout: 3000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    ).catch(() => null)

    if (cttResponse?.data?.postalCodes?.[0]) {
      const pc = cttResponse.data.postalCodes[0]
      return {
        street: pc.street || pc.arteria || null,
        locality: pc.localidade,
        municipality: pc.concelho,
        district: pc.distrito
      }
    }

    return null
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}

// Base expandida de ruas por prefixo de código postal
export const streetPrefixes: Record<string, string[]> = {
  '1200': [
    'Rua Garrett',
    'Rua do Carmo',
    'Rua da Conceição',
    'Rua dos Douradores',
    'Largo do Chiado',
    'Rua Nova do Almada',
    'Rua António Maria Cardoso',
    'Rua Ivens',
    'Rua do Crucifixo',
    'Rua da Misericórdia'
  ],
  '1990': [
    'Avenida do Aeroporto',
    'Avenida Berlim',
    'Avenida Gago Coutinho',
    'Rua C',
    'Rua B'
  ],
  '4470': [
    'Rua Simão Bolívar',
    'Avenida do Mosteiro',
    'Rua Augusto Simões',
    'Rua de Santa Maria',
    'Praça do Município',
    'Rua Padre António',
    'Rua Engenheiro Duarte Pacheco',
    'Avenida Dom Manuel II',
    'Rua Dr. José Vieira de Carvalho',
    'Rua Dr. Carlos Pinhão',
    'Rua do Souto',
    'Avenida Visconde de Barreiros'
  ],
  '4000': [
    'Rua de Santa Catarina',
    'Avenida dos Aliados',
    'Rua de Cedofeita',
    'Rua Miguel Bombarda',
    'Rua do Almada',
    'Rua Sá da Bandeira',
    'Rua de Santo Ildefonso',
    'Praça da Liberdade'
  ]
}

// Função para sugerir rua baseada no prefixo quando não há dados específicos
export function suggestStreetByPrefix(postalCode: string): string | null {
  const prefix = postalCode.substring(0, 4)
  const streets = streetPrefixes[prefix]
  
  if (streets && streets.length > 0) {
    // Retornar a primeira rua da lista (em produção, pode ser mais sofisticado)
    return streets[0]
  }
  
  return null
}