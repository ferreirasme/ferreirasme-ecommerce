# Configuração de Pagamentos

## Stripe (Cartão de Crédito/Débito)

### 1. Criar conta no Stripe
1. Acesse https://dashboard.stripe.com/register
2. Crie uma conta com os dados da empresa
3. Complete a verificação da conta

### 2. Obter as chaves da API
1. No dashboard do Stripe, vá para **Developers > API keys**
2. Copie a **Publishable key** (começa com `pk_`)
3. Copie a **Secret key** (começa com `sk_`)

### 3. Configurar no projeto
Adicione as chaves ao arquivo `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Configurar Webhooks (Produção)
1. No Stripe Dashboard, vá para **Developers > Webhooks**
2. Adicione endpoint: `https://seu-dominio.com/api/webhooks/stripe`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`

## MB Way

O MB Way requer integração com um gateway de pagamento português como:
- **SIBS API Market** (oficial)
- **Easypay**
- **IFTHENPAY**

### Configuração SIBS (exemplo)
1. Registre-se em https://www.sibsapimarket.com/
2. Obtenha as credenciais de API
3. Configure no `.env.local`:
```env
SIBS_API_KEY=seu_api_key
SIBS_ENTITY_ID=sua_entidade
```

## Transferência Bancária

Configure os dados bancários no `.env.local`:
```env
BANK_IBAN=PT50000000000000000000000
BANK_NAME=Banco Example
BANK_SWIFT=EXAMPLEPT
```

## Testar Pagamentos

### Cartões de teste Stripe
- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### MB Way teste
Use números de telefone de teste fornecidos pelo gateway escolhido.

## Segurança

⚠️ **IMPORTANTE**:
- Nunca exponha a `STRIPE_SECRET_KEY` no cliente
- Use sempre HTTPS em produção
- Valide todos os webhooks
- Implemente rate limiting nas APIs de pagamento