import Stripe from 'stripe'

// Esta chave deve ser a chave secreta do Stripe
// NUNCA exponha esta chave no lado do cliente
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error('⚠️  STRIPE_SECRET_KEY não está configurada!')
}

export const stripe = new Stripe(
  stripeSecretKey || '',
  {
    apiVersion: '2025-05-28.basil',
    typescript: true,
  }
)