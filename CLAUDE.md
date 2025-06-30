# Configurações do Projeto - Ferreira's Me E-commerce

## Comandos de Desenvolvimento

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```

### Verificar tipos TypeScript
```bash
npm run typecheck
```

### Executar linter
```bash
npm run lint
```

## Acesso Mobile

Para permitir acesso mobile/externo ao servidor de desenvolvimento, consulte o arquivo `MOBILE_ACCESS_SETUP.md` que contém:
- Configuração de port proxy para Windows/WSL
- Configuração de firewall e Kaspersky
- Scripts para facilitar o acesso
- Soluções usando CloudFlare tunnel

## Estrutura do Projeto

- `/app` - Páginas e rotas do Next.js 15 (App Router)
- `/components` - Componentes React reutilizáveis
- `/lib` - Funções utilitárias e integrações
- `/store` - Estado global com Zustand
- `/supabase` - Migrations e schema do banco de dados

## Tecnologias Principais

- Next.js 15.3.4
- React 19
- TypeScript
- Tailwind CSS
- Supabase (banco de dados e autenticação)
- Zustand (gerenciamento de estado)

## Variáveis de Ambiente

O projeto usa `.env.local` com as seguintes configurações:
- Supabase (URL e chaves)
- Resend (para emails)
- CTT (integração com correios de Portugal)
- Informações da loja

## Portas e URLs

- Desenvolvimento: `http://localhost:3005`
- IP local para mobile: `http://192.168.131.99:3005`
- Produção: porta 3001