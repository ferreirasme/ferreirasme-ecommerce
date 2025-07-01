# Scripts de Teste Local para Importação Odoo

Este diretório contém scripts de teste para debug e análise da importação de dados do Odoo.

## Scripts Disponíveis

### 1. test-odoo-import-local.ts
Script principal para teste e debug da importação com múltiplos comandos.

### 2. odoo-quick-test.ts
Script de teste rápido para verificar conexões e permissões.

### 3. odoo-import-report.ts
Gera relatórios detalhados de análise antes da importação.

## Instalação de Dependências

Certifique-se de ter o `tsx` instalado globalmente:
```bash
npm install -g tsx
```

## Configuração

Todos os scripts usam as variáveis de ambiente do arquivo `.env.local`:
- `ODOO_URL`: URL do servidor Odoo
- `ODOO_DB`: Nome do banco de dados
- `ODOO_USERNAME`: Usuário do Odoo
- `ODOO_API_KEY`: Chave de API do Odoo
- `NEXT_PUBLIC_SUPABASE_URL`: URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

## Uso via NPM Scripts

### Teste Rápido de Conexão
```bash
npm run odoo:quick
```
Verifica conexões, permissões e mostra resumo dos dados.

### Teste de Conexão Detalhado
```bash
npm run odoo:connection
```
Testa conexão e lista modelos disponíveis.

### Listar Dados
```bash
# Listar produtos
npm run odoo:list-products

# Listar consultoras
npm run odoo:list-consultants

# Com opções
npm run odoo:test list-products -- --limit=20 --verbose
```

### Gerar Relatório de Análise
```bash
# Analisar todos os dados
npm run odoo:report all

# Apenas produtos
npm run odoo:report products

# Apenas consultoras
npm run odoo:report consultants
```

### Debug de Registros Específicos
```bash
# Debug de um produto
npm run odoo:test debug-product 123

# Debug de uma consultora
npm run odoo:test debug-consultant email@example.com
```

### Importação (Dry-run)
```bash
# Simular importação de produtos (não faz alterações)
npm run odoo:import-products

# Simular importação de consultoras
npm run odoo:import-consultants

# Com limite
npm run odoo:test import-products -- --limit=10
```

### Importação Real
⚠️ **ATENÇÃO**: Use com cuidado! Isso fará alterações reais no banco de dados.

```bash
# Importar produtos de verdade
npm run odoo:test import-products -- --limit=5 --real-run

# Importar consultoras de verdade
npm run odoo:test import-consultants -- --limit=5 --real-run
```

## Exemplos de Uso Direto

### Teste Completo com Verbose
```bash
npx tsx scripts/test-odoo-import-local.ts test-connection --verbose
```

### Listar Produtos com Paginação
```bash
npx tsx scripts/test-odoo-import-local.ts list-products --limit=50 --offset=100
```

### Debug Detalhado
```bash
npx tsx scripts/test-odoo-import-local.ts debug-product 42 --verbose
```

### Gerar Relatório e Salvar
```bash
npx tsx scripts/odoo-import-report.ts all
# Relatórios são salvos em: reports/odoo-import-report-*.json
```

## Fluxo Recomendado para Debug

1. **Teste de Conexão**
   ```bash
   npm run odoo:quick
   ```

2. **Gerar Relatório de Análise**
   ```bash
   npm run odoo:report all
   ```

3. **Revisar Problemas Encontrados**
   - Verifique o relatório gerado em `reports/`
   - Identifique erros críticos que devem ser corrigidos

4. **Debug de Registros Problemáticos**
   ```bash
   npm run odoo:test debug-product [id]
   npm run odoo:test debug-consultant [email]
   ```

5. **Teste de Importação (Dry-run)**
   ```bash
   npm run odoo:import-products -- --limit=5
   npm run odoo:import-consultants -- --limit=5
   ```

6. **Importação Real (se tudo estiver OK)**
   ```bash
   npm run odoo:test import-products -- --limit=5 --real-run
   ```

## Estrutura dos Relatórios

Os relatórios gerados incluem:
- **Resumo**: Total de registros, novos, existentes, com problemas
- **Problemas**: Erros, avisos e informações organizados por tipo
- **Amostras**: Exemplos de dados que serão importados
- **Detalhes**: Informações específicas sobre duplicatas, validações, etc.

## Troubleshooting

### Erro de Autenticação
- Verifique as credenciais no `.env.local`
- Confirme que o usuário tem permissões adequadas no Odoo

### Erro de Conexão
- Verifique se a URL do Odoo está correta
- Confirme que o servidor Odoo está acessível

### Problemas de Importação
- Use o modo dry-run primeiro
- Verifique o relatório de análise
- Debug registros específicos com problemas

## Logs e Saída

Os scripts usam cores para facilitar a leitura:
- 🚀 Início de operação
- ✅ Sucesso
- ❌ Erro
- ⚠️  Aviso
- ℹ️  Informação
- 📊 Estatísticas
- 🔍 Análise/Debug