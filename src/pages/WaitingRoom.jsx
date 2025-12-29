import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function WaitingRoom() {
  const { token } = useParams();
  const [mensagem, setMensagem] = useState('Verificando token...');

  useEffect(() => {
    // LOG 1: Verificando se o React iniciou o efeito
    console.log("Componente montado com o token:", token);
    
    if (!token) {
      setMensagem("ERRO: O token não foi encontrado na URL!");
      return;
    }

    async function validar() {
      try {
        setMensagem("Conectando ao servidor Supabase...");
        
        // LOG 2: Tentando chamar a função
        const { data, error } = await supabase.functions.invoke('get-daily-token', {
          body: { token }
        });

        if (error) {
          setMensagem("Erro no Supabase: " + error.message);
        } else if (data?.error) {
          setMensagem("A função recusou: " + data.error);
        } else {
          setMensagem("Sucesso! Sala encontrada: " + data.url);
          window.location.href = data.url; // Redireciona direto para o Daily se o Iframe falhar
        }
      } catch (e) {
        setMensagem("Erro Crítico de Código: " + e.message);
      }
    }

    validar();
  }, [token]);

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fff', height: '100vh' }}>
      <h2 style={{ color: '#334' }}>🩺 TelePsi Hub - Sala de Atendimento</h2>
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <strong>Status:</strong> {mensagem}
      </div>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>Token atual: {token}</p>
    </div>
  );
}