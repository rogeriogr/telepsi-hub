import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importação das Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // <--- ADICIONADO
import AgendarConsulta from './pages/AgendarConsulta';
import WaitingRoom from './pages/WaitingRoom';

// Importação do Componente de Segurança
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        <Route path="/sala/:token" element={<WaitingRoom />} />
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PROTEGIDAS (Apenas para o Psicólogo) --- */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/agendar" 
          element={
            <PrivateRoute>
              <AgendarConsulta />
            </PrivateRoute>
          } 
        />
        
        {/* Redirecionamento Padrão: 
            Agora mandamos para o Dashboard, que é o seu "home" profissional */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* Rota de segurança para páginas não encontradas */}
        <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}>Página não encontrada.</div>} />
      </Routes>
    </Router>
  );
}

export default App;