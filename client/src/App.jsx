import { createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './hooks/useSocket.jsx';
import { CryptoProvider } from './hooks/useCrypto.jsx';
import { useTheme } from './hooks/useTheme.js';
import LandingPage from './components/LandingPage.jsx';
import ChatPage from './components/ChatPage.jsx';

export const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });
export const useThemeContext = () => useContext(ThemeContext);

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <CryptoProvider>
        <SocketProvider>
          <Routes>
            <Route path="/"            element={<LandingPage />} />
            <Route path="/room/:roomId" element={<ChatPage />} />
            <Route path="/global"       element={<ChatPage />} />
          </Routes>
        </SocketProvider>
      </CryptoProvider>
    </ThemeContext.Provider>
  );
}
