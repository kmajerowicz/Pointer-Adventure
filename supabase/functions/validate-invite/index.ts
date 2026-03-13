import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json()
    const { token } = body as { token?: string }

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, reason: 'not_found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Create service role client to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Query invitation by token
    const { data, error } = await supabase
      .from('invitations')
      .select('id, expires_at, used_at, used_by')
      .eq('token', token)
      .single()

    // Token not found
    if (error || !data) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'not_found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Token already used
    if (data.used_at !== null) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'used' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Token expired
    if (new Date(data.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'expired' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Valid token
    return new Response(
      JSON.stringify({ valid: true, invitation_id: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ valid: false, reason: 'error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
