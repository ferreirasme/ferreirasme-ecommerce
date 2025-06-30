# Segurança - OWASP Top 10

Este documento descreve as medidas de segurança implementadas no projeto, seguindo as diretrizes do OWASP Top 10 2021.

## Medidas Implementadas

### A01:2021 - Controle de Acesso

#### ✅ Implementado:
- **Middleware de autenticação global** (`middleware.ts`)
  - Proteção de rotas sensíveis
  - Verificação de sessão Supabase
  - Controle de acesso baseado em roles (admin)
  
- **Proteção de endpoints de API**
  - Funções `requireAuth()` e `requireAdmin()`
  - Bloqueio de endpoints de debug em produção
  - Autenticação obrigatória para operações sensíveis

#### 📋 Próximos passos:
- Implementar logs de tentativas de acesso não autorizado
- Adicionar testes automatizados para controle de acesso

### A02:2021 - Falhas Criptográficas

#### ✅ Implementado:
- **Remoção de credenciais hardcoded**
  - API keys CTT removidas do código fonte
  - Validação de variáveis de ambiente
  
- **OTP seguro**
  - Códigos alfanuméricos de 8 caracteres
  - Geração usando crypto.randomBytes
  - Expiração reduzida para 5 minutos
  - Limite de tentativas (3)

- **Headers de segurança HTTPS**
  - Strict-Transport-Security configurado
  - Forçar HTTPS em produção

#### 📋 Próximos passos:
- Implementar hash de OTP antes do armazenamento
- Configurar certificado SSL/TLS

### A03:2021 - Injeção

#### ✅ Implementado:
- **Validação de entrada com Zod**
  - Schemas para email, telefone, CEP
  - Sanitização de inputs contra XSS
  - Validação de tipos e formatos

- **Uso de queries parametrizadas**
  - Supabase client previne SQL injection
  - Sem concatenação direta de strings em queries

#### 📋 Próximos passos:
- Adicionar validação em todos os endpoints
- Implementar Content Security Policy mais restritiva

### A04:2021 - Design Inseguro

#### ✅ Implementado:
- **Rate limiting**
  - Limite de 5 requisições OTP por minuto
  - Headers X-RateLimit-* para transparência
  - Proteção contra brute force

- **OTP melhorado**
  - Códigos mais complexos (alfanuméricos)
  - Tempo de expiração reduzido
  - Rastreamento de tentativas

#### 📋 Próximos passos:
- Implementar CAPTCHA para formulários públicos
- Adicionar rate limiting global

### A05:2021 - Configuração Incorreta

#### ✅ Implementado:
- **Headers de segurança HTTP**
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: [configurado]
  ```

- **Bloqueio de endpoints de debug**
  - `/api/test`, `/api/setup-db`, etc. bloqueados em produção
  - Requerem autenticação admin em desenvolvimento

- **Variáveis de ambiente**
  - Arquivo `.env.local` no `.gitignore`
  - Validação de credenciais obrigatórias

#### 📋 Próximos passos:
- Configurar CORS adequadamente
- Remover console.logs em produção

### A06:2021 - Componentes Vulneráveis

#### 📋 Próximos passos:
- Configurar Dependabot para atualizações automáticas
- Realizar auditoria regular com `npm audit`
- Manter dependencies atualizadas

### A07:2021 - Falhas de Autenticação

#### ✅ Implementado:
- **Sistema OTP robusto**
  - Códigos únicos por sessão
  - Expiração automática
  - Invalidação de códigos antigos
  
- **Proteção de sessão**
  - Cookies seguros via Supabase
  - Refresh automático de tokens

#### 📋 Próximos passos:
- Implementar 2FA opcional
- Adicionar detecção de anomalias de login

### A08:2021 - Integridade de Software e Dados

#### ✅ Implementado:
- **Validação de dados**
  - Schemas Zod para validação de tipos
  - Sanitização de inputs

#### 📋 Próximos passos:
- Implementar assinatura de dados críticos
- Adicionar verificação de integridade em uploads

### A09:2021 - Falhas de Log e Monitoramento

#### 📋 Próximos passos:
- Implementar sistema de logs estruturados
- Configurar alertas para eventos de segurança
- Integrar com serviço de monitoramento (Sentry, etc.)
- Logs de:
  - Tentativas de login falhadas
  - Acessos não autorizados
  - Erros de validação
  - Rate limit excedido

### A10:2021 - Server-Side Request Forgery (SSRF)

#### ✅ Implementado:
- **Validação de URLs externas**
  - Apenas domínios permitidos no CSP
  - Sem processamento direto de URLs do usuário

#### 📋 Próximos passos:
- Adicionar whitelist para integrações externas
- Validar todas requisições para APIs externas

## Checklist de Segurança para Deploy

### Antes do deploy em produção:

- [ ] Remover TODOS os endpoints de debug/teste
- [ ] Configurar variáveis de ambiente de produção
- [ ] Ativar HTTPS obrigatório
- [ ] Configurar firewall/WAF
- [ ] Realizar teste de penetração
- [ ] Configurar backups automáticos
- [ ] Implementar monitoramento de segurança
- [ ] Revisar todas as permissões de banco de dados
- [ ] Configurar rate limiting em nível de infraestrutura
- [ ] Implementar sistema de logs centralizado

## Comandos Úteis

```bash
# Verificar vulnerabilidades em dependências
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix

# Verificar headers de segurança
curl -I https://seu-dominio.com

# Testar rate limiting
for i in {1..10}; do curl -X POST https://seu-dominio.com/api/auth/send-otp -d '{"email":"test@test.com"}'; done
```

## Recursos Adicionais

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)