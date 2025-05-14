import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { ...corsHeaders } })
  }

  let body: { message?: string; user?: string } = {}
  try {
    body = await req.json()
  } catch (_) {
    return new Response('Invalid JSON', { status: 400, headers: { ...corsHeaders } })
  }

  const { message, user } = body
  if (!message || typeof message !== 'string') {
    return new Response('Missing or invalid message', { status: 400, headers: { ...corsHeaders } })
  }

  const webhookUrl = Deno.env.get('DISCORD_FEEDBACK_WEBHOOK_URL')
  if (!webhookUrl) {
    return new Response('Missing webhook URL', { status: 500, headers: { ...corsHeaders } })
  }

  const discordPayload = {
    content: `**Feedback from ${user || 'Anonymous'}:**\n${message}`,
  }

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload),
  })

  if (!resp.ok) {
    return new Response('Failed to send to Discord', { status: 500, headers: { ...corsHeaders } })
  }

  return new Response('OK', { status: 200, headers: { ...corsHeaders } })
}) 