# Integração CTT E-commerce (Correios de Portugal)

## Configuração

### 1. Obter Credenciais CTT

Para usar a API CTT E-commerce, você precisa:

1. Criar uma conta no [Portal CTT E-commerce](https://enviosecommerce.ctt.pt/)
2. Fazer login e acessar a seção de API/Integrações
3. Gerar suas chaves de API:
   - Chave Pública (Public Key)
   - Chave Secreta (Secret Key)

### 2. Ambientes

A CTT E-commerce oferece:

- **Produção**: `https://api.cttexpresso.pt/services/rest`
- **Testes**: Use as chaves de teste fornecidas no portal

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.local.example .env.local
```

## Funcionalidades Implementadas

### 1. Cálculo de Frete

```typescript
// POST /api/shipping/calculate
{
  "postal_code": "1200-195",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ]
}
```

Retorna as opções de envio disponíveis com preços e prazos.

### 2. Criação de Envio

```typescript
// POST /api/shipping/create
{
  "order_id": "uuid"
}
```

Cria um envio no sistema CTT e retorna:
- ID do envio
- Número de rastreamento
- URL da etiqueta

### 3. Rastreamento

```typescript
// GET /api/shipping/track?tracking_number=CT123456789PT
```

Retorna o status atual e histórico de eventos do envio.

## Tipos de Serviço CTT E-commerce

- **EXPRESSO10**: Expresso 10:30 (entrega até às 10:30 do dia seguinte)
- **EXPRESSO**: Expresso (entrega no próximo dia útil)
- **ECONOMICO**: Económico (entrega em 3-5 dias úteis)
- **CORREIO_VERDE**: Correio Verde (entrega em 2 dias úteis, menor impacto ambiental)

## Códigos Postais

Os códigos postais portugueses seguem o formato: `XXXX-XXX`

Exemplos:
- Lisboa: 1000-000 a 1999-999
- Porto: 4000-000 a 4999-999
- Coimbra: 3000-000 a 3999-999

## Pesos e Dimensões

### Limites por Tipo de Envio

| Tipo | Peso Máx | Dimensões Máx (C x L x A) |
|------|----------|---------------------------|
| Envelope | 500g | 35 x 25 x 2 cm |
| Caixa Pequena | 2kg | 35 x 25 x 10 cm |
| Caixa Média | 10kg | 60 x 40 x 30 cm |
| Caixa Grande | 30kg | 120 x 60 x 60 cm |

## Webhooks

Para receber atualizações automáticas de status:

1. Configure o URL do webhook nas variáveis de ambiente
2. Implemente o endpoint `/api/webhooks/ctt`
3. Valide a assinatura usando `CTT_WEBHOOK_SECRET`

## Tratamento de Erros

A API CTT retorna os seguintes códigos de erro:

- `400`: Dados inválidos
- `401`: Não autorizado (credenciais inválidas)
- `404`: Recurso não encontrado
- `429`: Limite de requisições excedido
- `500`: Erro interno do servidor

## Autenticação

A API CTT E-commerce usa autenticação baseada em HMAC SHA256. Cada requisição deve incluir:

- **Authorization**: `CTT {public_key}:{signature}`
- **X-CTT-Timestamp**: Timestamp ISO 8601
- **X-CTT-Nonce**: String aleatória única

A assinatura é gerada com: `HMAC-SHA256(method + endpoint + body + timestamp + nonce, secret_key)`

## Links Úteis

- [Portal CTT E-commerce](https://enviosecommerce.ctt.pt/)
- [Documentação API](https://enviosecommerce.ctt.pt/api-docs)
- [Portal CTT Empresas](https://www.ctt.pt/empresas)
- [Calculadora de Portes](https://www.ctt.pt/particulares/enviar/calculadora-de-portes)
- [Códigos Postais](https://www.ctt.pt/feapl_2/app/open/postalCodeSearch/postalCodeSearch.jspx)