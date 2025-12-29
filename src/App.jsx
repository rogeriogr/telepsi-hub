import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importação das Páginas
import Login from './pages/Login';
import AgendarConsulta from './pages/AgendarConsulta';
import WaitingRoom from './pages/WaitingRoom';

// Importação do Componente de Segurança
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        {/* O paciente entra aqui via link do WhatsApp */}
        <Route path="/sala/:token" element={<WaitingRoom />} />
        
        {/* Tela de entrada para o psicólogo */}
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PROTEGIDAS (Apenas para você) --- */}
        <Route 
          path="/agendar" 
          element={
            <PrivateRoute>
              <AgendarConsulta />
            </PrivateRoute>
          } 
        />
        
        {/* Redirecionamento Padrão: 
            Se alguém acessar a raiz "/", mandamos para o Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rota de segurança para páginas não encontradas */}
        <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}>Página não encontrada.</div>} />
      </Routes>
    </Router>
  );
}

export default App;