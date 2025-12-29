import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function AgendarConsulta() {
  const [paciente, setPaciente] = useState('');
  const [email, setEmail] = useState(''); // Novo estado para o e-mail
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFim, setHoraFim] = useState('10:00');
  const [linkGerado, setLinkGerado] = useState('');
  const [psicologoId, setPsicologoId] = useState(null);

  useEffect(() => {
    const obterUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setPsicologoId(user.id);
    };
    obterUsuario();
  }, []);

  const handleAgendar = async (e) => {
    e.preventDefault();

    if (!psicologoId) return alert("Erro: Faça login novamente.");

    const dataInicioISO = new Date(`${data}T${horaInicio}:00`).toISOString();
    const dataFimISO = new Date(`${data}T${horaFim}:00`).toISOString();

    const { data: novoAgendamento, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          paciente_nome: paciente,
          paciente_email: email, // <--- Agora enviamos o e-mail para o banco
          data_inicio: dataInicioISO,
          data_fim: dataFimISO,
          psicologo_id: psicologoId
        }
      ])
      .select();

    if (error) {
      alert("Erro ao agendar: " + error.message);
    } else {
      const token = novoAgendamento[0].token_acesso;
      setLinkGerado(`${window.location.origin}/sala/${token}`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
      <h2 style={{ textAlign: 'center' }}>Novo Agendamento</h2>
      
      {!linkGerado ? (
        <form onSubmit={handleAgendar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label>Nome do Paciente:
            <input type="text" value={paciente} onChange={(e) => setPaciente(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
          </label>

          <label>E-mail do Paciente:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
          </label>
          
          <label>Data da Consulta:
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>Início:
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
            </label>
            <label style={{ flex: 1 }}>Fim:
              <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
            </label>
          </div>

          <button type="submit" style={{ padding: '15px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            GERAR LINK DE CONSULTA
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Consulta agendada com sucesso!</p>
          <button onClick={() => navigator.clipboard.writeText(linkGerado)}>Copiar Link</button>
          <button onClick={() => setLinkGerado('')}>Novo Agendamento</button>
        </div>
      )}
    </div>
  );
}