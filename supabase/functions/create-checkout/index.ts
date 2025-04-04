import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.5.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient()
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Get the user from the auth header
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Error getting user')
    }

    // Check if user already has an active license
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingLicense) {
      throw new Error('User already has an active license')
    }

    // Get license type from request body
    const { licenseType } = await req.json()
    if (!licenseType || !['perpetual', 'subscription'].includes(licenseType)) {
      throw new Error('Invalid license type')
    }

    // Create Stripe checkout session based on license type
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: licenseType === 'perpetual' ? 'Ebb Perpetual License' : 'Ebb Pro Subscription',
              description: licenseType === 'perpetual' 
                ? 'One-time purchase with 1 year of updates'
                : 'Monthly subscription with continuous updates'
            },
            unit_amount: licenseType === 'perpetual' ? 3700 : 500, // $37 one-time or $5/month
            ...(licenseType === 'subscription' ? { recurring: { interval: 'month' } } : {})
          },
          quantity: 1
        }
      ],
      mode: licenseType === 'perpetual' ? 'payment' : 'subscription',
      success_url: 'ebb://license/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'ebb://license/cancel',
      client_reference_id: user.id,
      customer_creation: 'always',
      customer_email: user.email,
      metadata: {
        user_id: user.id
      }
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (err) {
    console.error('Create checkout error:', err)
    return new Response(
      JSON.stringify({ error: { message: (err as Error).message } }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}) 
