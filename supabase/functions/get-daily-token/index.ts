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

    // 1. Busca o agendamento
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('token_acesso', token)
      .single()

    if (fetchError || !agendamento) {
      return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), { status: 404, headers: corsHeaders })
    }

    // --- LÓGICA DE TEMPO MAIS FLEXÍVEL ---
    const agora = new Date();
    const inicio = new Date(agendamento.data_inicio);
    const fim = new Date(agendamento.data_fim);

    // Damos 30 minutos de tolerância antes e 30 minutos depois
    const inicioComMargem = new Date(inicio.getTime() - 30 * 60000);
    const fimComMargem = new Date(fim.getTime() + 30 * 60000);

    console.log(`DEBUG: Agora: ${agora.toISOString()} | Início: ${inicio.toISOString()} | Fim: ${fim.toISOString()}`);

    if (agora < inicioComMargem || agora > fimComMargem) {
      return new Response(
        JSON.stringify({ error: `Fora do horário. Sua consulta é às ${inicio.toLocaleTimeString()}` }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Se estiver no horário, cria a sala no Daily
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('DAILY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: token,
        properties: {
          exp: Math.round(fimComMargem.getTime() / 1000), // Sala expira após a margem
          eject_at_token_exp: true,
        },
      }),
    });

    const dailyData = await response.json();
    const roomUrl = dailyData.url || `https://api.daily.co/v1/rooms/${token}`; // Fallback se já existir

    return new Response(JSON.stringify({ url: roomUrl }), {
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