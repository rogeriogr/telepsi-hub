import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfilePage from './pages/ProfilePage';
import WaitingRoom from './pages/WaitingRoom'; // Importação adicionada
import AgendarConsulta from './pages/AgendarConsulta';

function App() {
  return (
    <Router>
      <Routes>
        {/* Página inicial */}
        <Route path="/" element={<h1>Bem-vindo ao TelePsi Hub</h1>} />
        
        {/* Rota da Sala de Espera - Validada por Token */}
        <Route path="/sala/:token" element={<WaitingRoom />} />
        
        {/* Rota Dinâmica do Perfil do Psicólogo */}
        <Route path="/:slug" element={<ProfilePage />} />

        {/* Rota de Agendar Consulta */}
        <Route path="/agendar" element={<AgendarConsulta />} />
      </Routes>
    </Router>
  );
}

export default App;