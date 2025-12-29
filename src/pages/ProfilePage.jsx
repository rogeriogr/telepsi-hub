// 1. Importamos o que é necessário
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Para ler o slug da URL
import { supabase } from '../services/supabaseClient'; // Sua conexão com o banco

export default function ProfilePage() {
  // 2. Criamos as "gavetas" (estados) para guardar as informações
  const { slug } = useParams(); // Se a URL for /dr-roberto, slug = "dr-roberto"
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. A Lógica: "Assim que a página abrir, busque os dados"
  useEffect(() => {
    async function carregarPerfil() {
      setLoading(true);
      
      // Buscamos na tabela 'perfis_psicologos' a linha onde o slug é igual ao da URL
      const { data, error } = await supabase
        .from('perfis_psicologos')
        .select('*')
        .eq('slug', slug)
        .single(); // .single() garante que virá apenas um resultado

      if (error) {
        console.error("Erro ao carregar:", error.message);
      } else {
        setPerfil(data);
      }
      setLoading(false);
    }

    carregarPerfil();
  }, [slug]); // Se o slug mudar na URL, ele busca novamente

  // 4. Tratamento de estados: Enquanto carrega ou se não encontrar nada
  if (loading) return <div style={{ padding: '20px' }}>Carregando consultório digital...</div>;
  if (!perfil) return <div style={{ padding: '20px' }}>Psicólogo não encontrado no TelePsi.</div>;

  // 5. O Visual: Usando os dados do banco
  return (
    <div style={{ 
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      backgroundColor: perfil.config_visual?.theme === 'dark' ? '#121212' : '#ffffff',
      color: perfil.config_visual?.theme === 'dark' ? '#ffffff' : '#333333'
    }}>
      {/* Faixa superior com a cor preferida do psicólogo */}
      <header style={{ 
        backgroundColor: perfil.config_visual?.primary_color || '#3b82f6', 
        padding: '40px', 
        color: 'white', 
        textAlign: 'center' 
      }}>
        <h1>{perfil.nome_completo}</h1>
        <p>CRP: {perfil.crp}</p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <section>
          <h2>Sobre mim</h2>
          <p style={{ lineHeight: '1.6' }}>{perfil.bio}</p>
        </section>

        <section style={{ marginTop: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
          <h3>Sessão Clínica</h3>
          <p>Duração: 50 minutos</p>
          <p><strong>Valor: R$ {perfil.preco_sessao}</strong></p>
          <button style={{ 
            backgroundColor: perfil.config_visual?.primary_color || '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Agendar Agora
          </button>
        </section>
      </main>
    </div>
  );
}