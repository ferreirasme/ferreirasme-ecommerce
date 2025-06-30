# Guia de Deploy - Ferreiras ME E-commerce

## 🚀 Deploy no Vercel

### 1. Preparação
- Certifique-se de que o código está no GitHub
- Tenha uma conta no Vercel (vercel.com)

### 2. Configuração no Vercel

1. **Conectar Repositório**
   - Acesse https://vercel.com/new
   - Conecte sua conta GitHub
   - Selecione o repositório `ferreirasme-ecommerce`

2. **Configurações do Build**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Variáveis de Ambiente**
   Adicione TODAS as variáveis do `.env.local`:
   
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe
   STRIPE_SECRET_KEY=sua_chave_secreta_stripe
   STRIPE_WEBHOOK_SECRET=seu_webhook_secret
   
   # Resend
   RESEND_API_KEY=sua_chave_resend
   RESEND_FROM_EMAIL=noreply@seudominio.com
   
   # CTT
   CTT_API_KEY=sua_chave_ctt
   CTT_API_URL=https://api.ctt.pt
   
   # URL do Site
   NEXT_PUBLIC_URL=https://seu-dominio.vercel.app
   
   # Informações da Loja
   NEXT_PUBLIC_STORE_NAME=Ferreiras ME
   STORE_EMAIL=contato@ferreirasme.pt
   STORE_PHONE=+351123456789
   STORE_STREET=Rua do Comércio
   STORE_NUMBER=123
   STORE_CITY=Lisboa
   STORE_POSTAL_CODE=1200-195
   ```

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar

### 3. Pós-Deploy

1. **Configurar Webhook do Stripe**
   - Acesse o dashboard do Stripe
   - Vá em Developers > Webhooks
   - Adicione endpoint: `https://seu-dominio.vercel.app/api/webhooks/stripe`
   - Selecione os eventos:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

2. **Testar Funcionalidades**
   - Acesse o site em produção
   - Teste o login
   - Teste uma compra com cartão de teste
   - Verifique emails

## 🐛 Troubleshooting

### Erro de Build
- Verifique os logs no Vercel
- Certifique-se de que todas as variáveis estão configuradas
- Execute `npm run build` localmente para testar

### Erro 500 em Produção
- Verifique os Function Logs no Vercel
- Confirme as variáveis de ambiente
- Verifique conexão com Supabase

### Emails não funcionam
- Verifique a chave do Resend
- Confirme o domínio verificado no Resend
- Teste com a página `/test-email`

## 📱 Acesso Local

### Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3005

### URLs de Teste
- Login Dev: http://localhost:3005/dev-login
- Debug OTP: http://localhost:3005/debug-otp
- Teste Stripe: http://localhost:3005/test-stripe
- Teste Email: http://localhost:3005/test-shipping-email

## 🔒 Segurança

**IMPORTANTE**: Em produção, remova ou proteja:
- `/dev-login` - Login sem autenticação
- `/debug-otp` - Visualiza códigos OTP
- Outras rotas de teste/debug

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Vercel
2. Confirme todas as variáveis de ambiente
3. Teste localmente primeiro
4. Verifique a documentação do Next.js 15