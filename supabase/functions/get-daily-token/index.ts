import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: agendamento } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('token_acesso', token)
      .single()

    if (!agendamento) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 404, headers: corsHeaders })

    // Tenta criar a sala
    const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('DAILY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: token,
        properties: {
          exp: Math.round(new Date(agendamento.data_fim).getTime() / 1000),
          eject_at_token_exp: true,
        },
      }),
    });

    let dailyData = await dailyRes.json();

    // SE A SALA JÁ EXISTIR (Erro 400), buscamos os dados da sala existente
    if (dailyRes.status === 400 && dailyData.info?.includes("already exists")) {
      const getRoomRes = await fetch(`https://api.daily.co/v1/rooms/${token}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${Deno.env.get('DAILY_API_KEY')}` }
      });
      dailyData = await getRoomRes.json();
    }

    if (!dailyData.url) {
      throw new Error(dailyData.error || "Erro ao obter URL da sala");
    }

    return new Response(JSON.stringify({ url: dailyData.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})