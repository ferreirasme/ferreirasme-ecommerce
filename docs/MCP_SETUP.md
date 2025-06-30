# MCP (Model Context Protocol) Setup

Este projeto está configurado com dois servidores MCP para auxiliar no desenvolvimento:

## 1. Supabase MCP

Permite interação direta com o banco de dados Supabase do projeto.

### Funcionalidades:
- Consultar dados do banco
- Executar queries SQL (modo read-only)
- Gerenciar esquemas e tabelas
- Obter configurações do projeto
- Acessar logs para debugging

### Como usar:
```bash
# Via script helper
node scripts/supabase-mcp.js <seu-access-token>

# Ou diretamente
SUPABASE_ACCESS_TOKEN=<seu-access-token> npx @supabase/mcp-server-supabase@latest --project-ref=pzoopouhdypgytwcvqre --read-only
```

## 2. Context7

Fornece documentação atualizada e específica da versão para bibliotecas de programação.

### Funcionalidades:
- Documentação em tempo real
- Exemplos de código atualizados
- Informações específicas da versão
- Previne alucinações do modelo

### Como usar:
Adicione "use context7" aos seus prompts quando precisar de documentação atualizada.

Exemplo:
```
"Crie um componente React com Tailwind CSS para um card de produto. use context7"
```

## Configuração

As configurações estão no arquivo `mcp-config.json` (ignorado pelo git).

### Para IDEs com suporte MCP (como Cursor):
1. Copie o conteúdo de `mcp-config.json`
2. Cole nas configurações MCP do seu editor
3. Os servidores estarão disponíveis automaticamente

### Segurança:
- O Supabase MCP está configurado em modo **read-only**
- O access token está protegido no `.gitignore`
- Nunca commite credenciais no repositório

## Troubleshooting

### Node.js Version
Alguns pacotes MCP requerem Node.js 20+. Se encontrar avisos sobre versão:
```bash
nvm use 20  # ou instale Node.js 20+
```

### Conexão Supabase
Se houver problemas de conexão:
1. Verifique se o access token está válido
2. Confirme o project-ref na URL do Supabase
3. Teste a conexão com o script helper