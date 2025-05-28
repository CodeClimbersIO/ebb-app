import Stripe from 'stripe'

let stripeClient: Stripe | null = null
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_KEY') || ''

const getStripeClient = () => {
  if (!stripeClient) {  
    stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-03-31.basil',
      httpClient: Stripe.createFetchHttpClient()
    })
  }
  return stripeClient
}

export const StripeApi = {
  getStripeClient,
  endpointSecret,
}