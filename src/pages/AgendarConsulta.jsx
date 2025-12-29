import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export default function AgendarConsulta() {
  const [paciente, setPaciente] = useState('');
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFim, setHoraFim] = useState('10:00');
  const [linkGerado, setLinkGerado] = useState('');

  const handleAgendar = async (e) => {
    e.preventDefault();

    // Converte data e hora para o formato ISO aceito pelo Supabase
    const dataInicioISO = new Date(`${data}T${horaInicio}:00`).toISOString();
    const dataFimISO = new Date(`${data}T${horaFim}:00`).toISOString();

    const { data: novoAgendamento, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          paciente_nome: paciente,
          data_inicio: dataInicioISO,
          data_fim: dataFimISO,
          psicologo_id: '86a437c3-7186-4e5a-8b2b-097c36a4667d' // Substitua pelo seu ID real de psicólogo
        }
      ])
      .select();

    if (error) {
      alert("Erro ao agendar: " + error.message);
    } else {
      // O Supabase gera o token_acesso automaticamente via Default Value (UUID)
      const token = novoAgendamento[0].token_acesso;
      const urlCompleta = `${window.location.origin}/sala/${token}`;
      setLinkGerado(urlCompleta);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    alert("Link copiado para a área de transferência!");
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#1e293b' }}>Novo Agendamento</h2>
      
      {!linkGerado ? (
        <form onSubmit={handleAgendar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label>Nome do Paciente:
            <input type="text" value={paciente} onChange={(e) => setPaciente(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
          </label>
          
          <label>Data da Consulta:
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>Início:
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
            </label>
            <label style={{ flex: 1 }}>Fim:
              <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
            </label>
          </div>

          <button type="submit" style={{ padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            GERAR LINK DE CONSULTA
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bcf0da' }}>
          <p style={{ color: '#166534', fontWeight: 'bold' }}>Consulta agendada com sucesso!</p>
          <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>{linkGerado}</p>
          <button onClick={copiarLink} style={{ padding: '10px 20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>
            Copiar Link
          </button>
          <button onClick={() => setLinkGerado('')} style={{ padding: '10px 20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Novo Agendamento
          </button>
        </div>
      )}
    </div>
  );
}