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

  useEffect(() => {
    async function validarAcesso() {
      try {
        const { data, error } = await supabase
          .from('agendamentos')
          .select('*, perfis_psicologos(nome_completo)')
          .eq('token_acesso', token)
          .maybeSingle();

        if (error || !data) {
          setErro("Link de consulta inválido.");
          return;
        }
        setAgendamento(data);
      } catch (err) {
        setErro("Erro ao carregar sala.");
      } finally {
        setLoading(false);
      }
    }
    validarAcesso();
  }, [token]);

  // EFEITO QUE CRIA O JITSI QUANDO A DIV APARECE
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
          disableDeepLinking: true // Evita pedir para baixar o app no celular
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'tileview', 'hangup']
        }
      };

      // Pequeno atraso para garantir que a div #jitsi-container já existe no DOM
      const timer = setTimeout(() => {
        if (window.JitsiMeetExternalAPI) {
          new window.JitsiMeetExternalAPI(domain, options);
        } else {
          alert("Erro: O script do Jitsi não foi carregado. Verifique seu index.html");
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [chamadaIniciada, agendamento, token]);

  const ligarCameraTeste = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('preview');
      if (videoElement) videoElement.srcObject = stream;
      setCameraAtiva(true);
    } catch (err) {
      alert("Erro ao acessar câmera: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando...</div>;
  if (erro) return <div style={{ padding: '50px', color: 'red', textAlign: 'center' }}>{erro}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      {!chamadaIniciada ? (
        <>
          <h2>Olá, {agendamento.paciente_nome}!</h2>
          <p>Sua consulta com <strong>{agendamento.perfis_psicologos?.nome_completo}</strong></p>
          
          <div style={{ backgroundColor: '#000', width: '100%', height: '450px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <video id="preview" autoPlay playsInline muted style={{ width: '100%', height: '100%', transform: 'scaleX(-1)', objectFit: 'cover' }} />
            {!cameraAtiva && <button onClick={ligarCameraTeste} style={{ position: 'absolute', padding: '15px 30px', cursor: 'pointer', borderRadius: '30px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Ativar Câmera</button>}
          </div>

          {cameraAtiva && (
            <button onClick={() => setChamadaIniciada(true)} style={{ padding: '20px 60px', fontSize: '20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
              ENTRAR NA CONSULTA AGORA
            </button>
          )}
        </>
      ) : (
        <div id="jitsi-container" style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6', border: '1px solid #ddd' }}>
          {/* O Jitsi será renderizado aqui */}
        </div>
      )}
    </div>
  );
}