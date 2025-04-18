import Stripe from 'stripe'

let stripeClient: Stripe | null = null
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const getStripeClient = () => {
  if (!stripeClient) {
    stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-02-24.basil',
      httpClient: Stripe.createFetchHttpClient()
    })
  }
  return stripeClient
}

export const StripeApi = {
  getStripeClient,
  endpointSecret,
}