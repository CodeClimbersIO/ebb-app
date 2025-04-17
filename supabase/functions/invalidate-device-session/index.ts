import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '@shared/cors.ts'

Deno.serve(async (req) => {
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

    const { error: updateError } = await supabaseAdmin
      .from('active_devices')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString(),
        session_id: null
      })
      .eq('device_id', device_id)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Error deactivating device:', updateError)
      throw new Error('Failed to deactivate device')
    }

    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(session_id)
    if (revokeError) { 
      console.error('Error revoking session:', revokeError)
      throw revokeError 
    }

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
