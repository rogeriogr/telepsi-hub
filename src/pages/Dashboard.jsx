import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 2. Busca agendamentos deste psicólogo
        const { data, error } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('psicologo_id', user.id)
          .order('data_inicio', { ascending: true });

        if (!error) setAgendamentos(data);
      }
      setLoading(false);
    };

    carregarDados();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando sua agenda...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#1e293b', margin: 0 }}>Meu Painel</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Bem-vindo, {user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/agendar" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            + Novo Agendamento
          </Link>
          <button onClick={handleLogout} style={{ padding: '10px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </header>

      <section>
        <h2 style={{ color: '#334155', fontSize: '1.2rem' }}>Próximas Consultas</h2>
        
        {agendamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
            <p style={{ color: '#94a3b8' }}>Nenhuma consulta agendada no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {agendamentos.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{item.paciente_nome}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>
                    📅 {new Date(item.data_inicio).toLocaleDateString('pt-BR')} às {new Date(item.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/sala/${item.token_acesso}`)}
                  style={{ padding: '12px 25px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                >
                  ATENDER AGORA
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}