import React from 'react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function WaitingRoom() {
  const { token } = useParams();
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);

  useEffect(() => {
    async function validarAcesso() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('agendamentos')
          .select('*, perfis_psicologos(nome_completo)')
          .eq('token_acesso', token)
          .maybeSingle(); // Usamos maybeSingle para evitar erro se não achar nada

        if (error) throw error;
        if (!data) {
          setErro("Link de consulta inválido ou não encontrado.");
          return;
        }

        setAgendamento(data);
        
        // Validação de Horário
        const agora = new Date();
        const inicio = new Date(data.data_inicio);
        const fim = new Date(data.data_fim);
        const margemInicio = new Date(inicio.getTime() - 10 * 60000); // 10 min antes

        if (agora < margemInicio) {
          setErro(`Atenção: Sua consulta está agendada para ${inicio.toLocaleTimeString()}. A sala abrirá 10 minutos antes.`);
        } else if (agora > fim) {
          setErro("Esta consulta já expirou (horário de término ultrapassado).");
        }
      } catch (err) {
        console.error(err);
        setErro("Erro ao carregar dados da sala.");
      } finally {
        setLoading(false);
      }
    }
    validarAcesso();
  }, [token]);

  const ligarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('preview');
      if (videoElement) videoElement.srcObject = stream;
      setCameraAtiva(true);
    } catch (err) {
      alert("Permissão de câmera negada ou erro: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Validando agendamento...</div>;
  if (erro) return <div style={{ padding: '50px', color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>{erro}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Olá, {agendamento?.paciente_nome}!</h2>
      <p>Sua consulta com <strong>{agendamento?.perfis_psicologos?.nome_completo || 'seu psicólogo'}</strong> está pronta para começar.</p>
      
      <div style={{ backgroundColor: '#1a1a1a', width: '100%', height: '450px', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <video id="preview" autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        {!cameraAtiva && (
          <button 
            onClick={ligarCamera}
            style={{ position: 'absolute', padding: '15px 30px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold' }}
          >
            Ativar Câmera para Teste
          </button>
        )}
      </div>

      {cameraAtiva && (
        <button style={{ padding: '18px 50px', fontSize: '20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          Entrar na Chamada de Vídeo
        </button>
      )}
    </div>
  );
}