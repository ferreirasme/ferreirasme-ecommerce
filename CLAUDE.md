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

## Status do Projeto (Atualizado em 30/06/2025)

### Implementações Concluídas

1. **Sistema de Consultoras e Comissões**
   - Tabelas: consultants, clients, consultant_commissions, consent_records, audit_logs
   - LGPD compliance implementado
   - Sistema de comissões automáticas
   - Interface completa para gestão

2. **Sistema de Administradores (Separado)**
   - Tabelas: admins, admin_permissions, admin_logs
   - Área administrativa separada das consultoras
   - Dashboard com métricas gerais

3. **Integrações de Pagamento**
   - Stripe com suporte a Klarna
   - Sistema de checkout completo
   - Rastreamento de pedidos com consultoras

4. **Sistema de Email**
   - Notificações para consultoras
   - Emails de boas-vindas
   - Relatórios mensais de comissões

5. **Correções e Melhorias**
   - Login com OTP (8 caracteres)
   - Preenchimento automático de endereço por código postal
   - Compatibilidade com Next.js 15

### Problema Atual: Travamento do Navegador

**Situação**: As páginas que usam Supabase estão travando o navegador em produção.

**Páginas que funcionam**:
- `/hello` - Página simples sem Supabase
- `/admin-login-static` - Login sem integração Supabase

**Páginas que travam**:
- `/admin/login-simple` - Usa Supabase client
- `/admin/login` - Usa AuthProvider
- Outras páginas com autenticação

**Diagnóstico**:
- Problema relacionado ao Supabase client em produção
- Possível loop infinito na inicialização
- AuthProvider causava loops no layout.tsx

**Soluções Tentadas**:
1. Simplificação do layout.tsx (removido AuthProvider)
2. Desabilitação temporária do middleware
3. Criação de páginas de teste isoladas
4. Uso de IP direto no WSL (172.18.59.172)

### Próximos Passos

1. **Resolver problema do Supabase em produção**
   - Investigar configuração das variáveis de ambiente no Vercel
   - Testar inicialização do Supabase client
   - Verificar compatibilidade com Next.js 15

2. **Após resolver o travamento**:
   - Restaurar AuthProvider gradualmente
   - Reabilitar middleware com configurações corretas
   - Testar sistema de admin completo

3. **Funcionalidades pendentes do TODO original**:
   - Sistema de gestão de pedidos para administradores
   - Sistema de administração de produtos
   - Otimização do carregamento de códigos postais

### Comandos Úteis para Debug

```bash
# Verificar logs do Supabase
npx supabase db dump

# Testar build local
npm run build

# Verificar variáveis de ambiente
env | grep SUPABASE

# Logs do Vercel
vercel logs
```

### URLs de Teste

- https://ferreirasme-ecommerce.vercel.app/hello (funciona)
- https://ferreirasme-ecommerce.vercel.app/admin-login-static (funciona)
- https://ferreirasme-ecommerce.vercel.app/test-supabase-init (para testar)
- https://ferreirasme-ecommerce.vercel.app/admin-login-debug (para testar)