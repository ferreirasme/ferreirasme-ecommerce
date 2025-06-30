import { loadStripe } from '@stripe/stripe-js'

// Esta chave deve ser a chave pública do Stripe
// Você precisa criar uma conta no Stripe e obter as chaves
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)