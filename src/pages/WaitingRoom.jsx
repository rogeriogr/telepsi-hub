import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function WaitingRoom() {
  const { token } = useParams();
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [chamadaIniciada, setChamadaIniciada] = useState(false);
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    async function validarAcesso() {
      try {
        const { data, error } = await supabase
          .from('agendamentos')
          .select('*, perfis_psicologos(nome_completo)')
          .eq('token_acesso', token)
          .maybeSingle();

        if (error || !data) {
          setErro("Link de consulta inválido ou não encontrado.");
          return;
        }

        setAgendamento(data);
        
        // Validação de Horário
        const agora = new Date();
        const inicio = new Date(data.data_inicio);
        const fim = new Date(data.data_fim);
        const margemInicio = new Date(inicio.getTime() - 10 * 60000);

        if (agora < margemInicio) {
          setErro(`Sua consulta está agendada para ${inicio.toLocaleTimeString()}. A sala abrirá 10 minutos antes.`);
        } else if (agora > fim) {
          setErro("Esta consulta já expirou.");
        }
      } catch (err) {
        setErro("Erro ao carregar sala.");
      } finally {
        setLoading(false);
      }
    }
    validarAcesso();
  }, [token]);

  const ligarCameraTeste = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('preview');
      if (videoElement) videoElement.srcObject = stream;
      setCameraAtiva(true);
    } catch (err) {
      alert("Erro ao acessar câmera: " + err.message);
    }
  }

  const iniciarConsulta = () => {
    setChamadaIniciada(true);
    
    // Parar o stream de teste da câmera antes de ligar o Jitsi
    const videoElement = document.getElementById('preview');
    if (videoElement && videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
    }

    // Configuração do Jitsi
    const domain = "meet.jit.si";
    const options = {
      roomName: `TelePsiHub-${token}`, // Nome único da sala usando seu token
      width: '100%',
      height: 600,
      parentNode: document.querySelector('#jitsi-container'),
      userInfo: {
        displayName: agendamento.paciente_nome // Nome que aparecerá no vídeo
      },
      configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'tileview', 'hangup', 'settings']
      }
    };
    
    // Inicializa a API do Jitsi
    new window.JitsiMeetExternalAPI(domain, options);
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando...</div>;
  if (erro) return <div style={{ padding: '50px', color: 'red', textAlign: 'center' }}>{erro}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      {!chamadaIniciada ? (
        <>
          <h2>Olá, {agendamento.paciente_nome}!</h2>
          <p>Consulta com <strong>{agendamento.perfis_psicologos.nome_completo}</strong></p>
          
          <div style={{ backgroundColor: '#000', width: '100%', height: '450px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <video id="preview" autoPlay playsInline muted style={{ width: '100%', height: '100%', borderRadius: '12px', transform: 'scaleX(-1)', objectFit: 'cover' }} />
            {!cameraAtiva && <button onClick={ligarCameraTeste} style={{ position: 'absolute', padding: '15px 30px', cursor: 'pointer', borderRadius: '30px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Testar Câmera</button>}
          </div>

          {cameraAtiva && (
            <button onClick={iniciarConsulta} style={{ padding: '20px 60px', fontSize: '20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
              ENTRAR NA CONSULTA AGORA
            </button>
          )}
        </>
      ) : (
        <div id="jitsi-container" style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
          {/* O Jitsi será renderizado aqui dentro */}
        </div>
      )}
    </div>
  );
}