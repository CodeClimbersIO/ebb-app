import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient()
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const userId = session.client_reference_id

        if (!userId) {
          throw new Error('No user ID found in session')
        }

        // Handle based on mode
        if (session.mode === 'payment') {
          // One-time perpetual license
          const expirationDate = new Date(Date.now() + ONE_YEAR_IN_MS)
          
          const { error: licenseError } = await supabase
            .from('licenses')
            .upsert({
              user_id: userId,
              status: 'active',
              license_type: 'perpetual',
              purchase_date: new Date().toISOString(),
              expiration_date: expirationDate.toISOString(),
              stripe_customer_id: customerId,
              stripe_payment_id: session.payment_intent as string
            })

          if (licenseError) {
            throw licenseError
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user_id from metadata
        const { data: customer } = await stripe.customers.retrieve(customerId)
        const userId = customer.metadata.user_id

        if (!userId) {
          throw new Error('No user ID found in customer metadata')
        }

        const { error: licenseError } = await supabase
          .from('licenses')
          .upsert({
            user_id: userId,
            status: subscription.status === 'active' ? 'active' : 'expired',
            license_type: 'subscription',
            purchase_date: new Date(subscription.start_date * 1000).toISOString(),
            expiration_date: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id
          })

        if (licenseError) {
          throw licenseError
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Update license status to expired
        const { error: updateError } = await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          throw updateError
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string

        // Find and update license
        const { data: license, error: findError } = await supabase
          .from('licenses')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single()

        if (findError) {
          throw findError
        }

        if (license) {
          const { error: updateError } = await supabase
            .from('licenses')
            .update({ status: 'expired' })
            .eq('id', license.id)

          if (updateError) {
            throw updateError
          }
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: { message: (err as Error).message } }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 
