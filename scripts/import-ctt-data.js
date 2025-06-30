const fs = require('fs')
const path = require('path')

// Caminhos dos arquivos
const CTT_DIR = path.join(__dirname, '..', 'ctt-basedados')
const OUTPUT_DIR = path.join(__dirname, '..', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'postal-codes-portugal.json')

// Criar diretório se não existir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

console.log('📥 Importando dados do CTT...')

// Função para ler arquivo e converter encoding
function readFileWithEncoding(filePath) {
  // Os arquivos do CTT geralmente estão em Windows-1252 (Latin1)
  const buffer = fs.readFileSync(filePath)
  // Converter para UTF-8
  const decoder = new TextDecoder('windows-1252')
  return decoder.decode(buffer)
}

// Ler distritos
console.log('📖 Lendo distritos...')
const distritosData = readFileWithEncoding(path.join(CTT_DIR, 'distritos.txt'))
const distritos = {}
distritosData.split('\n').forEach(line => {
  const parts = line.trim().split(';')
  if (parts.length >= 2) {
    distritos[parts[0]] = parts[1]
  }
})

// Ler concelhos
console.log('📖 Lendo concelhos...')
const concelhosData = readFileWithEncoding(path.join(CTT_DIR, 'concelhos.txt'))
const concelhos = {}
concelhosData.split('\n').forEach(line => {
  const parts = line.trim().split(';')
  if (parts.length >= 3) {
    const key = `${parts[0]};${parts[1]}`
    concelhos[key] = parts[2]
  }
})

// Ler códigos postais
console.log('📖 Lendo códigos postais...')
const cpData = readFileWithEncoding(path.join(CTT_DIR, 'todos_cp.txt'))
const postalCodes = {}
let count = 0

cpData.split('\n').forEach(line => {
  const parts = line.trim().split(';')
  if (parts.length >= 16) {
    // Extrair campos conforme documentação
    const codDistrito = parts[0]
    const codConcelho = parts[1]
    const codLocalidade = parts[2]
    const nomeLocalidade = parts[3]
    const codArteria = parts[4]
    const tipoArteria = parts[5]
    const priPrep = parts[6]
    const titulo = parts[7]
    const segPrep = parts[8]
    const designacao = parts[9]
    const localArteria = parts[10]
    const troco = parts[11]
    const porta = parts[12]
    const cliente = parts[13]
    const cp4 = parts[14]
    const cp3 = parts[15]
    const cpAlfa = parts[16]
    
    const codigoPostal = `${cp4}-${cp3}`
    
    // Buscar nome do distrito e concelho
    const nomeDistrito = distritos[codDistrito] || ''
    const nomeConcelho = concelhos[`${codDistrito};${codConcelho}`] || ''
    
    // Construir nome da rua
    let rua = ''
    const partes = []
    if (tipoArteria) partes.push(tipoArteria)
    if (priPrep) partes.push(priPrep)
    if (titulo) partes.push(titulo)
    if (segPrep) partes.push(segPrep)
    if (designacao) partes.push(designacao)
    
    if (partes.length > 0) {
      rua = partes.join(' ')
      if (localArteria && localArteria !== nomeLocalidade) {
        rua += `, ${localArteria}`
      }
    }
    
    // Se for cliente com código postal próprio
    if (cliente) {
      rua = cliente
    }
    
    // Armazenar dados
    postalCodes[codigoPostal] = {
      codigo_postal: codigoPostal,
      designacao_postal: cpAlfa || '',
      rua: rua,
      localidade: nomeLocalidade,
      freguesia: cpAlfa || nomeLocalidade, // CTT não fornece freguesia específica
      concelho: nomeConcelho,
      distrito: nomeDistrito,
      cod_distrito: codDistrito,
      cod_concelho: codConcelho,
      // Campos adicionais para referência
      troco: troco || '',
      porta: porta || '',
      cliente: cliente || ''
    }
    
    count++
    
    if (count % 10000 === 0) {
      console.log(`  Processados: ${count} códigos postais...`)
    }
  }
})

console.log(`✅ Total de códigos postais processados: ${count}`)

// Salvar em arquivo JSON
console.log('💾 Salvando dados...')
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(postalCodes, null, 2))
console.log(`✅ Dados salvos em: ${OUTPUT_FILE}`)

// Criar índice por distrito para busca mais rápida
const byDistrito = {}
Object.values(postalCodes).forEach(cp => {
  if (!byDistrito[cp.distrito]) {
    byDistrito[cp.distrito] = []
  }
  byDistrito[cp.distrito].push(cp.codigo_postal)
})

const indexFile = path.join(OUTPUT_DIR, 'postal-codes-index.json')
fs.writeFileSync(indexFile, JSON.stringify(byDistrito, null, 2))
console.log(`📇 Índice criado em: ${indexFile}`)

// Mostrar exemplos
console.log('\n📋 Exemplos de códigos postais:')
const examples = ['4470-296', '1990-239', '1200-195', '4000-123']
examples.forEach(cp => {
  if (postalCodes[cp]) {
    console.log(`\n${cp}:`, postalCodes[cp])
  }
})

// Estatísticas
console.log('\n📊 Estatísticas:')
console.log(`Total de distritos: ${Object.keys(distritos).length}`)
console.log(`Total de concelhos: ${Object.keys(concelhos).length}`)
console.log(`Total de códigos postais: ${Object.keys(postalCodes).length}`)