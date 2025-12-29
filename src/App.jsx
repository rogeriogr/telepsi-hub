import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Bem-vindo ao TelePsi Hub</h1>} />
        <Route path="/:slug" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}
export default App;