// Mapeamento de códigos postais para freguesias específicas
// Quando a base de dados do CTT não tem a freguesia correta

export const freguesiasEspeciais: Record<string, string> = {
  // Parque das Nações - Lisboa (códigos 1990-xxx)
  '1990': 'Parque das Nações',
  
  // Outros casos especiais podem ser adicionados aqui
  // Formato: 'XXXX': 'Nome da Freguesia'
}

// Função para obter a freguesia correta baseada no código postal
export function getFreguesia(codigoPostal: string, freguesiaOriginal?: string): string {
  // Extrair os primeiros 4 dígitos do código postal
  const prefixo = codigoPostal.substring(0, 4)
  
  // Verificar se há uma freguesia especial para este prefixo
  const freguesiaEspecial = freguesiasEspeciais[prefixo]
  
  if (freguesiaEspecial) {
    return freguesiaEspecial
  }
  
  // Retornar a freguesia original se não houver mapeamento especial
  return freguesiaOriginal || ''
}