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
- IP WSL: `http://172.18.59.172:3005`
- Produção: https://ferreirasme-ecommerce.vercel.app

## Status do Projeto (Atualizado em 01/07/2025)

### Implementações Concluídas

1. **Sistema de Consultoras e Comissões**
   - Tabelas: consultants, clients, consultant_commissions, consent_records, audit_logs
   - LGPD compliance implementado
   - Sistema de comissões automáticas (45 dias)
   - Interface completa para gestão
   - Upload de fotos de consultoras implementado

2. **Sistema de Administradores (Separado)**
   - Tabelas: admins, admin_permissions, admin_logs
   - Área administrativa separada das consultoras
   - Dashboard com métricas gerais

3. **Área Administrativa Completa**
   - ✅ Gestão de pedidos com filtros e exportação
   - ✅ Detalhes de pedidos com gestão de status
   - ✅ Gestão de categorias hierárquicas
   - ✅ Criação e edição de produtos
   - ✅ Configurações do sistema
   - ✅ Relatórios com gráficos (Recharts)
   - ✅ Importação do Excel
   - ✅ Importação do Odoo

4. **Integrações de Pagamento**
   - Stripe com suporte a Klarna
   - Sistema de checkout completo
   - Rastreamento de pedidos com consultoras

5. **Sistema de Email**
   - Notificações para consultoras
   - Emails de boas-vindas
   - Relatórios mensais de comissões

6. **Correções e Melhorias Recentes**
   - ✅ Login com OTP (8 caracteres)
   - ✅ Preenchimento automático de endereço por código postal
   - ✅ Compatibilidade com Next.js 15
   - ✅ Problema de travamento do Supabase resolvido
   - ✅ Correção de colunas faltantes no banco (odoo_image, main_image_url, status)
   - ✅ Correção de async params no Next.js 15
   - ✅ Correção de erros TypeScript no build
   - ✅ Correção do erro de inicialização do Zod (transpilePackages)

### Problema Atual: Erro de Inicialização do Zod

**Status**: Em resolução

**Erro**: "Cannot access 'z' before initialization" em produção

**Soluções Aplicadas**:
1. ✅ Mudança de `import * as z from 'zod'` para `import { z } from 'zod'`
2. ✅ Adicionado `transpilePackages: ['zod']` no next.config.ts
3. ✅ Criado arquivo central de exportação em lib/zod.ts

**Se o erro persistir**:
- Mudar todos os imports para usar o arquivo centralizado `@/lib/zod`

### Pendências Importantes

1. **Migrations do Banco de Dados**
   - Aplicar migrations para colunas faltantes em produção
   - Adicionar campos Odoo (odoo_id, etc)

2. **Importação de Fotos**
   - Importar fotos de consultoras do Odoo
   - Importar fotos de produtos do Odoo

3. **Funcionalidades a Implementar**
   - Sistema de busca global no admin
   - Envio de email de boas-vindas para consultoras
   - Otimização do carregamento de códigos postais

4. **Testes em Produção**
   - Testar criação de consultora
   - Testar importação da Odoo
   - Testar fluxo completo de admin
   - Testar fluxo completo de consultoras

### Arquivos Importantes do Projeto

- `/CLAUDE.md` - Este arquivo (documentação principal)
- `/lib/database/schema-validator.ts` - Validação de colunas do banco
- `/components/admin/AdminSidebar.tsx` - Menu lateral do admin
- `/lib/zod.ts` - Exportação centralizada do Zod
- `/next.config.ts` - Configurações do Next.js (transpilePackages)

### Comandos Úteis

```bash
# Build e teste local
npm run build

# Limpar cache do Next.js
rm -rf .next

# Testar importação do Odoo
npm run odoo:test

# Testar importação do Excel
npm run excel:preview

# Aplicar migrations
Acessar: https://ferreirasme-ecommerce.vercel.app/api/run-migrations
```

### URLs de Referência

- Produção: https://ferreirasme-ecommerce.vercel.app
- Admin: https://ferreirasme-ecommerce.vercel.app/admin/dashboard
- Consultoras: https://ferreirasme-ecommerce.vercel.app/consultant/dashboard