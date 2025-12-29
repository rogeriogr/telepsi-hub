import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function WaitingRoom() {
  const { token } = useParams();
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [chamadaIniciada, setChamadaIniciada] = useState(false);

  // 1. Validar o acesso ao banco de dados
  useEffect(() => {
    async function validarAcesso() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('agendamentos')
          .select('*, perfis_psicologos(nome_completo)')
          .eq('token_acesso', token)
          .maybeSingle();

        if (error || !data) {
          setErro("Link de consulta inválido ou expirado.");
          return;
        }

        setAgendamento(data);

        // Validação de horário simplificada para o teste
        const agora = new Date();
        const fim = new Date(data.data_fim);
        if (agora > fim) {
          setErro("Esta consulta já foi encerrada.");
        }
      } catch (err) {
        setErro("Erro de conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    }
    validarAcesso();
  }, [token]);

  // 2. Inicializar o Jitsi apenas quando o usuário clicar no botão
  useEffect(() => {
    if (chamadaIniciada && agendamento) {
      const domain = "meet.jit.si";
      const options = {
        roomName: `TelePsiHub-${token}`,
        width: '100%',
        height: 600,
        parentNode: document.querySelector('#jitsi-container'),
        userInfo: { displayName: agendamento.paciente_nome },
        configOverwrite: { 
          startWithAudioMuted: false, 
          prejoinPageEnabled: false, // Pula a tela de "Participar da reunião"
          disableDeepLinking: true   // Evita forçar o download do app no celular
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'tileview', 'hangup', 'settings']
        }
      };

      const timer = setTimeout(() => {
        if (window.JitsiMeetExternalAPI) {
          new window.JitsiMeetExternalAPI(domain, options);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [chamadaIniciada, agendamento, token]);

  // 3. Teste de câmera local
  const ligarCameraTeste = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('preview');
      if (videoElement) videoElement.srcObject = stream;
      setCameraAtiva(true);
    } catch (err) {
      alert("Permissão de câmera negada ou erro: " + err.message);
    }
  };

  // 4. Ação de Entrar na Consulta (Libera a câmera antes de entrar)
  const entrarNaConsulta = () => {
    const videoElement = document.getElementById('preview');
    
    // LIMPEZA AGRESSIVA: Desliga a câmera local para o Jitsi poder usá-la
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElement.srcObject = null;
    }

    // Pequeno atraso para garantir que o hardware da câmera foi liberado pelo navegador
    setTimeout(() => {
      setChamadaIniciada(true);
    }, 300);
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Validando agendamento...</div>;
  if (erro) return <div style={{ padding: '50px', color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>{erro}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      {!chamadaIniciada ? (
        <>
          <h2 style={{ color: '#1e293b' }}>Olá, {agendamento?.paciente_nome}!</h2>
          <p style={{ color: '#64748b', marginBottom: '30px' }}>
            Sua consulta com <strong>{agendamento?.perfis_psicologos?.nome_completo}</strong> está pronta.
          </p>
          
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            width: '100%', 
            height: '480px', 
            borderRadius: '20px', 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <video id="preview" autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            
            {!cameraAtiva && (
              <button 
                onClick={ligarCameraTeste}
                style={{ position: 'absolute', padding: '15px 40px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', transition: '0.3s' }}
              >
                Ativar Câmera para Teste
              </button>
            )}
          </div>

          {cameraAtiva && (
            <button 
              onClick={entrarNaConsulta}
              style={{ padding: '20px 80px', fontSize: '20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)' }}
            >
              ENTRAR NA CONSULTA AGORA
            </button>
          )}
        </>
      ) : (
        <div id="jitsi-container" style={{ width: '100%', height: '650px', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          {/* O vídeo do Jitsi será carregado aqui */}
        </div>
      )}
    </div>
  );
}