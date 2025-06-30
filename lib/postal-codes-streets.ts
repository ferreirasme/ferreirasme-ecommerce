// Base de dados de ruas por código postal
// Esta é uma base de exemplo - em produção, usar API dos CTT ou outra fonte oficial

interface StreetData {
  logradouro: string
  tipo?: string // Rua, Avenida, Praça, etc.
}

// Mapeamento de códigos postais para informações de rua
export const streetDatabase: Record<string, StreetData> = {
  // Lisboa - Centro
  '1200-195': { logradouro: 'Rua Garrett', tipo: 'Rua' },
  '1200-109': { logradouro: 'Rua do Carmo', tipo: 'Rua' },
  '1200-161': { logradouro: 'Rua da Conceição', tipo: 'Rua' },
  '1200-176': { logradouro: 'Rua dos Douradores', tipo: 'Rua' },
  '1200-259': { logradouro: 'Largo do Chiado', tipo: 'Largo' },
  '1200-444': { logradouro: 'Rua Nova do Almada', tipo: 'Rua' },
  '1250-096': { logradouro: 'Avenida da Liberdade', tipo: 'Avenida' },
  '1150-144': { logradouro: 'Praça do Comércio', tipo: 'Praça' },
  '1100-148': { logradouro: 'Rua Augusta', tipo: 'Rua' },
  '1990-239': { logradouro: 'Avenida do Aeroporto', tipo: 'Avenida' },
  
  // Porto - Centro
  '4000-123': { logradouro: 'Rua de Santa Catarina', tipo: 'Rua' },
  '4000-322': { logradouro: 'Avenida dos Aliados', tipo: 'Avenida' },
  '4050-313': { logradouro: 'Rua Miguel Bombarda', tipo: 'Rua' },
  '4050-253': { logradouro: 'Rua do Almada', tipo: 'Rua' },
  '4100-130': { logradouro: 'Rua Formosa', tipo: 'Rua' },
  '4150-196': { logradouro: 'Rua da Boavista', tipo: 'Rua' },
  
  // Maia
  '4470-296': { logradouro: 'Rua Simão Bolívar', tipo: 'Rua' },
  '4470-147': { logradouro: 'Avenida do Mosteiro', tipo: 'Avenida' },
  '4470-136': { logradouro: 'Rua Augusto Simões', tipo: 'Rua' },
  '4470-208': { logradouro: 'Rua de Santa Maria', tipo: 'Rua' },
  '4470-162': { logradouro: 'Praça do Município', tipo: 'Praça' },
  '4470-528': { logradouro: 'Rua Padre António', tipo: 'Rua' },
  '4470-445': { logradouro: 'Rua Engenheiro Duarte Pacheco', tipo: 'Rua' },
  '4470-384': { logradouro: 'Avenida Dom Manuel II', tipo: 'Avenida' },
  '4470-001': { logradouro: 'Rua Álvaro Castelões', tipo: 'Rua' },
  '4470-002': { logradouro: 'Rua Padre Luís Campos', tipo: 'Rua' },
  '4470-003': { logradouro: 'Rua Carlos Pinhão', tipo: 'Rua' },
  '4470-004': { logradouro: 'Travessa da Bouça', tipo: 'Travessa' },
  '4470-005': { logradouro: 'Rua do Padrão', tipo: 'Rua' },
  
  // Coimbra
  '3000-456': { logradouro: 'Rua da Sofia', tipo: 'Rua' },
  '3000-210': { logradouro: 'Rua Ferreira Borges', tipo: 'Rua' },
  '3000-180': { logradouro: 'Praça 8 de Maio', tipo: 'Praça' },
  '3000-370': { logradouro: 'Rua Visconde da Luz', tipo: 'Rua' },
  '3000-395': { logradouro: 'Avenida Sá da Bandeira', tipo: 'Avenida' },
  
  // Braga
  '4700-313': { logradouro: 'Avenida da Liberdade', tipo: 'Avenida' },
  '4700-320': { logradouro: 'Rua do Souto', tipo: 'Rua' },
  '4700-206': { logradouro: 'Praça da República', tipo: 'Praça' },
  '4710-301': { logradouro: 'Rua Dom Afonso Henriques', tipo: 'Rua' },
  '4710-229': { logradouro: 'Avenida Central', tipo: 'Avenida' },
  
  // Setúbal
  '2900-025': { logradouro: 'Avenida Luísa Todi', tipo: 'Avenida' },
  '2900-208': { logradouro: 'Praça de Bocage', tipo: 'Praça' },
  '2910-394': { logradouro: 'Rua Álvaro Castelões', tipo: 'Rua' },
  '2910-504': { logradouro: 'Avenida 5 de Outubro', tipo: 'Avenida' },
  
  // Faro
  '8000-125': { logradouro: 'Rua de Santo António', tipo: 'Rua' },
  '8000-138': { logradouro: 'Rua Conselheiro Bívar', tipo: 'Rua' },
  '8000-255': { logradouro: 'Praça Ferreira de Almeida', tipo: 'Praça' },
  '8000-295': { logradouro: 'Avenida da República', tipo: 'Avenida' },
  
  // Funchal
  '9000-039': { logradouro: 'Avenida Arriaga', tipo: 'Avenida' },
  '9000-024': { logradouro: 'Rua João Tavira', tipo: 'Rua' },
  '9000-064': { logradouro: 'Praça do Município', tipo: 'Praça' },
  '9000-100': { logradouro: 'Rua da Carreira', tipo: 'Rua' },
}

// Função para buscar informações de rua
export function getStreetByPostalCode(postalCode: string): StreetData | null {
  return streetDatabase[postalCode] || null
}

// Função para gerar sugestão de rua baseada na localidade (quando não temos dados específicos)
export function generateStreetSuggestion(locality: string): StreetData {
  // Lista de nomes comuns de ruas em Portugal
  const commonStreets = [
    { tipo: 'Rua', nome: '25 de Abril' },
    { tipo: 'Rua', nome: '1º de Maio' },
    { tipo: 'Rua', nome: '5 de Outubro' },
    { tipo: 'Avenida', nome: 'da República' },
    { tipo: 'Rua', nome: 'da Igreja' },
    { tipo: 'Rua', nome: 'do Comércio' },
    { tipo: 'Rua', nome: 'da Escola' },
    { tipo: 'Rua', nome: 'Principal' },
    { tipo: 'Rua', nome: 'Nova' },
    { tipo: 'Rua', nome: 'Direita' },
    { tipo: 'Praça', nome: 'da República' },
    { tipo: 'Largo', nome: 'da Igreja' },
  ]
  
  // Selecionar uma rua aleatória (em produção, pode ser mais sofisticado)
  const selected = commonStreets[0]
  
  return {
    logradouro: `${selected.tipo} ${selected.nome}`,
    tipo: selected.tipo
  }
}