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
  // Restore original logic
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('Webhook Error: No signature header received.')
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    let event: Stripe.Event
    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)
    } catch (err) {
        console.error(`⚠️  Webhook signature verification failed: ${(err as Error).message}`)
        return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
    }

    console.log(`Received event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        // Use client_reference_id passed during checkout creation
        const userId = session.client_reference_id 

        if (!userId) {
          console.error('Webhook Error: No user ID (client_reference_id) found in checkout session.')
          throw new Error('No user ID found in session')
        }

        console.log(`Processing checkout.session.completed for user: ${userId}`)

        // Handle based on mode
        if (session.mode === 'payment') {
          // One-time perpetual license
          const expirationDate = new Date(Date.now() + ONE_YEAR_IN_MS)
          console.log(`Adding perpetual license for user ${userId} with expiration ${expirationDate.toISOString()}`)

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
            console.error('Supabase upsert error (perpetual):', licenseError)
            throw licenseError
          }
          console.log(`Perpetual license successfully added/updated for user ${userId}`)
        }
        // Note: Subscription creation handled by customer.subscription.created/updated
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log(`Processing subscription event ${event.type} for customer: ${customerId}`)

        // Get user_id from customer metadata 
        // (ensure user_id is added to customer metadata when subscription is first created)
        let userId: string | null | undefined = subscription.metadata?.user_id

        // Fallback: Retrieve customer if metadata isn't directly on subscription event
        if (!userId) {
            try {
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
                // Check if the customer object is deleted
                if (customer.deleted) {
                    console.warn(`Customer ${customerId} is deleted. Cannot retrieve user_id.`)
                } else {
                    userId = customer.metadata?.user_id
                }
            } catch (custError) {
                console.error(`Failed to retrieve Stripe customer ${customerId}:`, custError)
            }
        }

        if (!userId) {
          console.error(`Webhook Error: No user ID found in subscription metadata or retrieved customer for customer ID: ${customerId}`)
          throw new Error('No user ID found for subscription')
        }

        const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'expired'
        const expirationDate = new Date(subscription.current_period_end * 1000)
        const purchaseDate = new Date(subscription.start_date * 1000)

        console.log(`Upserting subscription license for user ${userId} with status ${status}, expiration ${expirationDate.toISOString()}`)

        const { error: licenseError } = await supabase
          .from('licenses')
          .upsert({
            user_id: userId,
            status: status,
            license_type: 'subscription',
            purchase_date: purchaseDate.toISOString(),
            expiration_date: expirationDate.toISOString(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
          })

        if (licenseError) {
          console.error('Supabase upsert error (subscription):', licenseError)
          throw licenseError
        }
         console.log(`Subscription license successfully added/updated for user ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`Processing subscription deleted for ID: ${subscription.id}`)

        // Update license status to expired
        const { error: updateError } = await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Supabase update error (sub deleted):', updateError)
          // Don't throw here, maybe the license was already deleted or never existed
          console.warn(`Failed to update license status for deleted subscription ${subscription.id}. Maybe it didn't exist?`)
        } else {
          console.log(`License status set to expired for subscription ${subscription.id}`)
        }
        break
      }

      // Optional: Handle refunds if necessary
      /*
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string
        // Implement logic to potentially revoke license based on charge/customer
        console.log(`Processing charge refunded for customer: ${customerId}, charge: ${charge.id}`)
        break
      }
      */
      default: {
         console.log(`Unhandled event type: ${event.type}`)
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook processing error:', err)
    const errorMessage = (err instanceof Error) ? err.message : 'Unknown error'
    // Return 400 for processing errors to prevent infinite retries for non-transient issues
    return new Response(
      JSON.stringify({ error: { message: errorMessage } }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 
