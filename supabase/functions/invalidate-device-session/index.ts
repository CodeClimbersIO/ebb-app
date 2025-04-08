import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from invalidate-device-session!')

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { device_id, user_id, session_id } = await req.json()
    if (!device_id || !user_id || !session_id) {
      console.warn('Missing required parameters in request body')
      throw new Error('Missing required parameters')
    }

    console.log(`Verifying device ${device_id} for user ${user_id}`)
    const { data: deviceData, error: deviceError } = await supabaseAdmin
      .from('active_devices')
      .select('id')
      .eq('device_id', device_id)
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle() 

    if (deviceError) {
      console.error('Error verifying device:', deviceError)
      throw new Error('Error verifying device ownership') 
    }
    if (!deviceData) {
      console.warn(`Active device ${device_id} not found for user ${user_id}`)
      throw new Error('Device not found or is already deactivated')
    }
    console.log(`Device ${device_id} verified successfully.`)    

    // Deactivate the device
    console.log(`Deactivating device ${device_id}`)
    const { error: updateError } = await supabaseAdmin
      .from('active_devices')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString(),
        session_id: null // Clear the session ID
      })
      .eq('device_id', device_id)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Error deactivating device:', updateError)
      throw new Error('Failed to deactivate device')
    }

    console.log(`Revoking session ${session_id}`)
    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(session_id)
    if (revokeError) { 
        console.error('Error revoking session:', revokeError)
        throw revokeError 
    }
    console.log(`Session ${session_id} revoked successfully.`)

    return new Response(
      JSON.stringify({ message: 'Device session invalidated and device deactivated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('invalidate-device-session error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
