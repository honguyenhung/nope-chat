import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Use same domain for backend (reverse proxy)
// Client: https://your-domain.com
// Backend: https://your-domain.com/api (proxied)
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState(null); // FIX 1: expose server errors to UI
  const [nickname, setNicknameState] = useState(
    () => sessionStorage.getItem('anon_nickname') || ''
  );

  function connect(nick) {
    socketRef.current?.disconnect();

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { nickname: nick || '' },
    });

    socketRef.current = socket;
    socket.on('connect', () => { 
      setConnected(true); 
      setError(null);
      // Re-emit join_room for current room after reconnection
      // This will be handled by useChat hook when it detects connection
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('identity', (data) => setIdentity(data));
    // FIX 1: catch server-emitted errors (rate limit, IP ban, etc.)
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 4000);
    });
  }

  useEffect(() => {
    connect(nickname);
    return () => socketRef.current?.disconnect();
  }, []); // eslint-disable-line

  const applyNickname = useCallback((nick) => {
    const clean = nick.trim().slice(0, 24);
    sessionStorage.setItem('anon_nickname', clean);
    setNicknameState(clean);
    connect(clean);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      identity,
      nickname,
      error,
      applyNickname,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
