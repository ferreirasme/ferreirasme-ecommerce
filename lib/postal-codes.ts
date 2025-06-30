// Base de dados de códigos postais portugueses
// Fonte: https://www.ctt.pt/feapl_2/app/open/postalCodeSearch/postalCodeSearch.jspx

interface PostalCodeData {
  localidade: string
  concelho: string
  distrito: string
}

// Mapeamento de códigos postais principais por região
const postalCodeDatabase: Record<string, PostalCodeData> = {
  // Lisboa
  '1000': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1100': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1200': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1300': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1400': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1500': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1600': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1700': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1800': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1900': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '1990': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  
  // Porto
  '4000': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4050': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4100': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4150': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4200': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4250': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4300': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4350': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '4400': { localidade: 'Gaia', concelho: 'Vila Nova de Gaia', distrito: 'Porto' },
  '4410': { localidade: 'São Félix da Marinha', concelho: 'Vila Nova de Gaia', distrito: 'Porto' },
  '4420': { localidade: 'Gondomar', concelho: 'Gondomar', distrito: 'Porto' },
  '4430': { localidade: 'Avintes', concelho: 'Vila Nova de Gaia', distrito: 'Porto' },
  '4440': { localidade: 'Valongo', concelho: 'Valongo', distrito: 'Porto' },
  '4445': { localidade: 'Ermesinde', concelho: 'Valongo', distrito: 'Porto' },
  '4450': { localidade: 'Matosinhos', concelho: 'Matosinhos', distrito: 'Porto' },
  '4460': { localidade: 'Senhora da Hora', concelho: 'Matosinhos', distrito: 'Porto' },
  '4470': { localidade: 'Maia', concelho: 'Maia', distrito: 'Porto' },
  '4480': { localidade: 'Árvore', concelho: 'Vila do Conde', distrito: 'Porto' },
  '4490': { localidade: 'Póvoa de Varzim', concelho: 'Póvoa de Varzim', distrito: 'Porto' },
  
  // Braga
  '4700': { localidade: 'Braga', concelho: 'Braga', distrito: 'Braga' },
  '4710': { localidade: 'Braga', concelho: 'Braga', distrito: 'Braga' },
  '4715': { localidade: 'Braga', concelho: 'Braga', distrito: 'Braga' },
  '4720': { localidade: 'Amares', concelho: 'Amares', distrito: 'Braga' },
  '4730': { localidade: 'Vila Verde', concelho: 'Vila Verde', distrito: 'Braga' },
  '4740': { localidade: 'Esposende', concelho: 'Esposende', distrito: 'Braga' },
  '4750': { localidade: 'Barcelos', concelho: 'Barcelos', distrito: 'Braga' },
  '4760': { localidade: 'Vila Nova de Famalicão', concelho: 'Vila Nova de Famalicão', distrito: 'Braga' },
  '4770': { localidade: 'Vila Nova de Famalicão', concelho: 'Vila Nova de Famalicão', distrito: 'Braga' },
  '4780': { localidade: 'Santo Tirso', concelho: 'Santo Tirso', distrito: 'Porto' },
  '4795': { localidade: 'Vila das Aves', concelho: 'Santo Tirso', distrito: 'Porto' },
  '4800': { localidade: 'Guimarães', concelho: 'Guimarães', distrito: 'Braga' },
  '4815': { localidade: 'Vizela', concelho: 'Vizela', distrito: 'Braga' },
  
  // Coimbra
  '3000': { localidade: 'Coimbra', concelho: 'Coimbra', distrito: 'Coimbra' },
  '3020': { localidade: 'Coimbra', concelho: 'Coimbra', distrito: 'Coimbra' },
  '3030': { localidade: 'Coimbra', concelho: 'Coimbra', distrito: 'Coimbra' },
  '3040': { localidade: 'Coimbra', concelho: 'Coimbra', distrito: 'Coimbra' },
  '3045': { localidade: 'Coimbra', concelho: 'Coimbra', distrito: 'Coimbra' },
  
  // Setúbal
  '2900': { localidade: 'Setúbal', concelho: 'Setúbal', distrito: 'Setúbal' },
  '2910': { localidade: 'Setúbal', concelho: 'Setúbal', distrito: 'Setúbal' },
  
  // Faro
  '8000': { localidade: 'Faro', concelho: 'Faro', distrito: 'Faro' },
  '8100': { localidade: 'Loulé', concelho: 'Loulé', distrito: 'Faro' },
  '8200': { localidade: 'Albufeira', concelho: 'Albufeira', distrito: 'Faro' },
  '8300': { localidade: 'Silves', concelho: 'Silves', distrito: 'Faro' },
  '8400': { localidade: 'Lagoa', concelho: 'Lagoa', distrito: 'Faro' },
  '8500': { localidade: 'Portimão', concelho: 'Portimão', distrito: 'Faro' },
  '8600': { localidade: 'Lagos', concelho: 'Lagos', distrito: 'Faro' },
  '8700': { localidade: 'Olhão', concelho: 'Olhão', distrito: 'Faro' },
  '8800': { localidade: 'Tavira', concelho: 'Tavira', distrito: 'Faro' },
  
  // Açores
  '9000': { localidade: 'Funchal', concelho: 'Funchal', distrito: 'Madeira' },
  '9500': { localidade: 'Ponta Delgada', concelho: 'Ponta Delgada', distrito: 'Açores' },
  '9700': { localidade: 'Angra do Heroísmo', concelho: 'Angra do Heroísmo', distrito: 'Açores' },
  '9900': { localidade: 'Horta', concelho: 'Horta', distrito: 'Açores' },
}

// Códigos postais específicos
const specificPostalCodes: Record<string, PostalCodeData> = {
  '1200-195': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
  '4000-123': { localidade: 'Porto', concelho: 'Porto', distrito: 'Porto' },
  '3000-456': { localidade: 'Coimbra', concelho: 'Coimbra', distrito: 'Coimbra' },
  '4470-296': { localidade: 'Maia', concelho: 'Maia', distrito: 'Porto' },
  '1990-239': { localidade: 'Lisboa', concelho: 'Lisboa', distrito: 'Lisboa' },
}

export function getPostalCodeData(postalCode: string): PostalCodeData | null {
  // Primeiro verificar códigos específicos
  if (specificPostalCodes[postalCode]) {
    return specificPostalCodes[postalCode]
  }

  // Depois verificar por prefixo de 4 dígitos
  const prefix = postalCode.substring(0, 4)
  if (postalCodeDatabase[prefix]) {
    return postalCodeDatabase[prefix]
  }

  // Se não encontrar, tentar com 3 dígitos para regiões menores
  const shortPrefix = postalCode.substring(0, 3) + '0'
  if (postalCodeDatabase[shortPrefix]) {
    return postalCodeDatabase[shortPrefix]
  }

  return null
}

// Função auxiliar para validar formato do código postal
export function isValidPostalCodeFormat(postalCode: string): boolean {
  return /^[0-9]{4}-[0-9]{3}$/.test(postalCode)
}