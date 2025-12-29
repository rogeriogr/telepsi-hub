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
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, perfis_psicologos(nome_completo)')
        .eq('token_acesso', token)
        .single();

      if (error || !data) {
        setErro("Link de consulta inválido ou não encontrado.");
      } else {
        setAgendamento(data);
        verificarHorario(data);
      }
      setLoading(false);
    }
    validarAcesso();
  }, [token]);

  const verificarHorario = (dados) => {
    const agora = new Date();
    const inicio = new Date(dados.data_inicio);
    const fim = new Date(dados.data_fim);
    
    // Permite entrar 5 minutos antes
    const margemInicio = new Date(inicio.getTime() - 5 * 60000);

    if (agora < margemInicio) {
      setErro(`Sua consulta está agendada para as ${inicio.toLocaleTimeString()}. Por favor, aguarde.`);
    } else if (agora > fim) {
      setErro("Esta consulta já foi encerrada.");
    }
  };

  const ligarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('preview');
      if (videoElement) videoElement.srcObject = stream;
      setCameraAtova(true);
    } catch (err) {
      alert("Erro ao acessar câmera: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Validando acesso...</div>;
  if (erro) return <div style={{ padding: '50px', color: 'red', textAlign: 'center' }}>{erro}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Olá, {agendamento.paciente_nome}!</h2>
      <p>Sua consulta com <strong>{agendamento.perfis_psicologos.nome_completo}</strong> está pronta.</p>
      
      <div style={{ backgroundColor: '#000', width: '100%', height: '400px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video id="preview" autoPlay playsInline muted style={{ width: '100%', height: '100%', borderRadius: '12px', transform: 'scaleX(-1)' }} />
        {!cameraAtiva && <button onClick={ligarCamera} style={{ padding: '15px 30px', fontSize: '16px', cursor: 'pointer' }}>Testar Câmera e Microfone</button>}
      </div>

      {cameraAtiva && (
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Entrar na Consulta
        </button>
      )}
    </div>
  );
}