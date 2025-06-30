import Stripe from 'stripe'

// Esta chave deve ser a chave secreta do Stripe
// NUNCA exponha esta chave no lado do cliente
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  }
)