import { createContext, useContext, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './hooks/useSocket.jsx';
import { CryptoProvider } from './hooks/useCrypto.jsx';
import { useTheme } from './hooks/useTheme.js';
import LandingPage from './components/LandingPage.jsx';
import ChatPage from './components/ChatPage.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

export const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });
export const useThemeContext = () => useContext(ThemeContext);

export default function App() {
  const { theme, toggle } = useTheme();
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));

  function handleAdminLogin(token) {
    setAdminToken(token);
  }

  function handleAdminLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminToken(null);
  }

  // Admin Panel Component
  function AdminPanel() {
    if (!adminToken) {
      return <AdminLogin onLogin={handleAdminLogin} />;
    }
    return <AdminDashboard token={adminToken} onLogout={handleAdminLogout} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <CryptoProvider>
        <SocketProvider>
          <Routes>
            <Route path="/"            element={<LandingPage />} />
            <Route path="/room/:roomId" element={<ChatPage />} />
            <Route path="/global"       element={<ChatPage />} />
            <Route path="/admin"        element={<AdminPanel />} />
          </Routes>
        </SocketProvider>
      </CryptoProvider>
    </ThemeContext.Provider>
  );
}
