import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importação das Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgendarConsulta from './pages/AgendarConsulta';
import WaitingRoom from './pages/WaitingRoom'; // Certifique-se que o caminho está correto

// Importação do Componente de Segurança
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. ROTA PÚBLICA (Paciente) 
            Importante: Ela deve vir ANTES de rotas genéricas e 
            NÃO pode estar dentro de PrivateRoute */}
        <Route path="/sala/:token" element={<WaitingRoom />} />
        
        {/* 2. ROTAS DE AUTENTICAÇÃO */}
        <Route path="/login" element={<Login />} />

        {/* 3. ROTAS PROTEGIDAS (Psicólogo) */}
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
        
        {/* 4. REDIRECIONAMENTOS E ERROS */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        <Route path="*" element={
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>404</h2>
            <p>Página não encontrada.</p>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;