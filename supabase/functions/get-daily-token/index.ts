import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json', // Força a resposta como JSON
}

serve(async (req) => {
  // 1. Trata CORS (Preflight)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verificação de segurança: A função espera um POST com corpo
    if (req.method !== 'POST') {
      throw new Error('Esta função aceita apenas requisições POST com um corpo JSON.');
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.token) {
      return new Response(JSON.stringify({ error: 'Token não fornecido no corpo da requisição' }), { status: 400, headers: corsHeaders });
    }

    const { token } = body;
    console.log("LOG: Iniciando atendimento para o token:", token);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Busca Agendamento
    const { data: agendamento, error: dbError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('token_acesso', token)
      .single()

    if (dbError || !agendamento) {
      console.error("LOG ERRO: Agendamento não encontrado.");
      return new Response(JSON.stringify({ error: 'Consulta não encontrada no banco' }), { status: 404, headers: corsHeaders })
    }

    // 3. Chamada ao Daily.co
    const dailyApiKey = Deno.env.get('DAILY_API_KEY');
    if (!dailyApiKey) throw new Error("DAILY_API_KEY não configurada no Supabase.");

    console.log("LOG: Solicitando sala ao Daily.co...");
    const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: token,
        properties: {
          // Garante que o tempo de expiração seja um número inteiro
          exp: Math.round(new Date(agendamento.data_fim).getTime() / 1000) + 3600,
          eject_at_token_exp: true,
        },
      }),
    });

    const dailyData = await dailyRes.json();

    // 4. Trata "Sala já existe" ou erros do Daily
    if (!dailyRes.ok) {
      if (dailyData.info?.includes("already exists") || dailyData.error?.includes("already exists")) {
        console.log("LOG: A sala já existia, recuperando URL...");
        const getRoom = await fetch(`https://api.daily.co/v1/rooms/${token}`, {
          headers: { Authorization: `Bearer ${dailyApiKey}` }
        });
        const existingRoom = await getRoom.json();
        return new Response(JSON.stringify({ url: existingRoom.url }), { headers: corsHeaders, status: 200 });
      }
      
      console.error("LOG ERRO Daily.co:", dailyData);
      return new Response(JSON.stringify({ error: dailyData.error || "Erro no Daily.co" }), { status: dailyRes.status, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ url: dailyData.url }), { headers: corsHeaders, status: 200 });

  } catch (error) {
    console.error("LOG ERRO CRÍTICO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
})