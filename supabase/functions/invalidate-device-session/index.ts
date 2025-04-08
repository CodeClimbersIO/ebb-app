import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from invalidate-device-session!')

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session of the logged-in user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) throw new Error('Not authorized')

    // Get the request payload
    const { device_id, license_id, session_id } = await req.json()
    if (!device_id || !license_id || !session_id) {
      throw new Error('Missing required parameters')
    }

    // Verify the device belongs to the user's license
    const { data: deviceData, error: deviceError } = await supabaseClient
      .from('license_devices')
      .select('*')
      .eq('device_id', device_id)
      .eq('license_id', license_id)
      .single()

    if (deviceError || !deviceData) {
      throw new Error('Device not found or not authorized')
    }

    // Create admin client for session management
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Revoke the specific session
    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(session_id)
    if (revokeError) throw revokeError

    return new Response(
      JSON.stringify({ message: 'Device session invalidated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
