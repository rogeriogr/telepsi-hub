import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token_acesso } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verifica se o agendamento existe
    const { data: agendamento } = await supabaseClient
      .from('agendamentos')
      .select('data_fim')
      .eq('token_acesso', token_acesso)
      .single()

    if (!agendamento) throw new Error('Agendamento não encontrado')

    // Pede ao Daily.co para criar uma sala privada
    const dailyKey = Deno.env.get('DAILY_API_KEY')
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dailyKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          exp: Math.round(new Date(agendamento.data_fim).getTime() / 1000), // Expira no fim da consulta
          eject_at_room_exp: true,
          enable_screenshare: true,
        },
      }),
    })

    const room = await response.json()
    return new Response(JSON.stringify({ url: room.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: corsHeaders,
      status: 400,
    })
  }
})
