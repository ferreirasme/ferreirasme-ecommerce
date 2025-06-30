const https = require('https')
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')

// URLs dos arquivos CSV
const POSTAL_CODES_URL = 'https://raw.githubusercontent.com/centraldedados/codigos_postais/master/data/codigos_postais.csv'
const DISTRITOS_URL = 'https://raw.githubusercontent.com/centraldedados/codigos_postais/master/data/distritos.csv'
const CONCELHOS_URL = 'https://raw.githubusercontent.com/centraldedados/codigos_postais/master/data/concelhos.csv'

const OUTPUT_DIR = path.join(__dirname, '..', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'postal-codes-portugal.json')

// Criar diretório se não existir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

console.log('📥 Baixando base de dados de códigos postais...')

// Função para baixar o arquivo
function downloadFile(url, callback) {
  https.get(url, (response) => {
    let data = ''
    
    response.on('data', (chunk) => {
      data += chunk
    })
    
    response.on('end', () => {
      callback(null, data)
    })
  }).on('error', (err) => {
    callback(err)
  })
}

// Baixar todos os arquivos necessários
async function downloadAllData() {
  try {
    // Primeiro baixar distritos e concelhos
    console.log('📥 Baixando dados de distritos...')
    const distritosData = await new Promise((resolve, reject) => {
      downloadFile(DISTRITOS_URL, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
    
    console.log('📥 Baixando dados de concelhos...')
    const concelhosData = await new Promise((resolve, reject) => {
      downloadFile(CONCELHOS_URL, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
    
    // Processar distritos
    const distritos = {}
    const distritosParser = parse(distritosData, {
      columns: true,
      delimiter: ',',
      skip_empty_lines: true
    })
    
    for await (const row of distritosParser) {
      distritos[row.cod_distrito] = row.nome_distrito
    }
    
    // Processar concelhos
    const concelhos = {}
    const concelhosParser = parse(concelhosData, {
      columns: true,
      delimiter: ',',
      skip_empty_lines: true
    })
    
    for await (const row of concelhosParser) {
      const key = `${row.cod_distrito}-${row.cod_concelho}`
      concelhos[key] = row.nome_concelho
    }
    
    console.log('✅ Dados de distritos e concelhos carregados')
    console.log('📥 Baixando códigos postais...')
    
    // Agora baixar e processar códigos postais
    downloadFile(POSTAL_CODES_URL, (err, csvData) => {
      if (err) {
        console.error('❌ Erro ao baixar arquivo:', err)
        return
      }
      
      console.log('✅ Arquivo baixado com sucesso')
      console.log('🔄 Processando dados...')
      
      const postalCodes = {}
      let count = 0
      
      // Processar CSV
      const parser = parse(csvData, {
        columns: true,
        delimiter: ',',
        skip_empty_lines: true
      })
      
      parser.on('data', (row) => {
        const cp4 = row.num_cod_postal
        const cp3 = row.ext_cod_postal
        const codigoPostal = `${cp4}-${cp3}`
        
        // Buscar nome do distrito e concelho
        const nomeDistrito = distritos[row.cod_distrito] || ''
        const nomeConcelho = concelhos[`${row.cod_distrito}-${row.cod_concelho}`] || ''
        
        // Construir endereço completo
        let rua = ''
        if (row.tipo_arteria || row.nome_arteria) {
          const tipo = row.tipo_arteria || ''
          const titulo = row.titulo_arteria || ''
          const nome = row.nome_arteria || ''
          const local = row.local_arteria || ''
          
          // Montar nome da rua
          rua = [tipo, titulo, nome].filter(x => x).join(' ')
          if (local && local !== row.nome_localidade) {
            rua += `, ${local}`
          }
        }
        
        // Armazenar dados
        postalCodes[codigoPostal] = {
          codigo_postal: codigoPostal,
          designacao_postal: row.desig_postal || '',
          rua: rua,
          localidade: row.nome_localidade || row.desig_postal || '',
          freguesia: row.desig_postal || '', // Usando desig_postal como freguesia quando não temos dados específicos
          concelho: nomeConcelho,
          distrito: nomeDistrito,
          cod_distrito: row.cod_distrito,
          cod_concelho: row.cod_concelho
        }
        
        count++
        
        if (count % 10000 === 0) {
          console.log(`  Processados: ${count} códigos postais...`)
        }
      })
      
      parser.on('end', () => {
        console.log(`✅ Total de códigos postais processados: ${count}`)
        
        // Salvar em arquivo JSON
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(postalCodes, null, 2))
        console.log(`💾 Dados salvos em: ${OUTPUT_FILE}`)
        
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
      })
      
      parser.on('error', (err) => {
        console.error('❌ Erro ao processar CSV:', err)
      })
    })
    
  } catch (error) {
    console.error('❌ Erro ao baixar dados:', error)
  }
}

// Executar o download
downloadAllData()