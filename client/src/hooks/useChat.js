import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket.jsx';
import { useCrypto } from './useCrypto.jsx';
import { sanitize } from '../utils/profanityFilter.js';

const MAX_MESSAGES = 200;

export function useChat(roomId, password = null) {
  const { socket, identity } = useSocket();
  const { publicKeyB64, addPeer, removePeer, encrypt, decrypt, encryptImg, decryptImg } = useCrypto();

  const [messages,    setMessages]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [joinError,   setJoinError]   = useState(null); // 'WRONG_PASSWORD' | null

  const typingTimers = useRef({});
  const roomIdRef    = useRef(roomId);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  useEffect(() => {
    if (!socket || !publicKeyB64 || !roomId) return;

    setMessages([]);
    setUsers([]);
    setTypingUsers(new Set());
    setJoinError(null);

    socket.emit('join_room', { roomId, publicKey: publicKeyB64, password });

    // ── Incoming events ──────────────────────────────────

    socket.on('message_history', async (history) => {
      try {
        const decrypted = await Promise.all(
          history.map((m) => decryptMsg(m, roomIdRef.current).catch((err) => {
            console.warn('Failed to decrypt message:', err);
            return { ...m, text: '🔒 Decryption failed', imageData: null };
          }))
        );
        setMessages(decrypted.slice(-MAX_MESSAGES));
      } catch (err) {
        console.error('Failed to process message history:', err);
        setMessages([]); // Show empty instead of crashing
      }
    });

    socket.on('new_message', async (msg) => {
      const isOwn    = msg.socketId === socket.id;
      const decrypted = await decryptMsg(msg, roomIdRef.current);

      setMessages((prev) => {
        if (isOwn) {
          const idx = prev.findIndex((m) => m.optimistic && m.socketId === socket.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...decrypted, optimistic: false };
            return next;
          }
        }
        const next = [...prev, decrypted];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    });

    socket.on('room_users', ({ users }) => setUsers(users));

    socket.on('user_joined', ({ socketId, publicKey }) => {
      if (publicKey) addPeer(socketId, publicKey);
    });

    socket.on('user_left', ({ socketId, username: leftUsername }) => {
      removePeer(socketId);
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (leftUsername) next.delete(leftUsername);
        return next;
      });
      clearTimeout(typingTimers.current[socketId]);
      delete typingTimers.current[socketId];
    });

    socket.on('user_typing', ({ username, socketId }) => {
      setTypingUsers((prev) => new Set([...prev, username]));
      clearTimeout(typingTimers.current[socketId]);
      typingTimers.current[socketId] = setTimeout(() => {
        setTypingUsers((prev) => { const n = new Set(prev); n.delete(username); return n; });
      }, 3000);
    });

    socket.on('user_stop_typing', ({ socketId }) => {
      clearTimeout(typingTimers.current[socketId]);
    });

    socket.on('join_error', ({ code }) => {
      setJoinError(code); // e.g. 'WRONG_PASSWORD'
    });

    return () => {
      ['message_history','new_message','room_users','user_joined',
       'user_left','user_typing','user_stop_typing','join_error'].forEach((e) => socket.off(e));
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [socket, publicKeyB64, roomId, password]); // re-run when password changes

  // ── Decrypt helper ───────────────────────────────────────

  async function decryptMsg(msg, rid) {
    const ctx = { roomId: rid };

    // Decrypt text
    let text = null;
    if (msg.encryptedContent) {
      try {
        text = await decrypt(msg.encryptedContent, msg.iv, ctx);
      } catch (err) {
        console.warn('Failed to decrypt message:', err);
        text = '🔒 Decryption failed';
      }
    }

    // Decrypt image — server stores encrypted blob, not raw base64
    let imageData = null;
    if (msg.encryptedImage) {
      try {
        imageData = await decryptImg(msg.encryptedImage, msg.imageIv, ctx);
      } catch (err) {
        console.warn('Failed to decrypt image:', err);
        imageData = null; // Show no image rather than broken image
      }
    } else if (msg.imageData) {
      // Legacy: unencrypted image (shouldn't happen in new sessions)
      imageData = msg.imageData;
    }

    return { ...msg, text, imageData };
  }

  // ── Send message ─────────────────────────────────────────

  const sendMessage = useCallback(
    async (text, rawImageDataUrl = null) => {
      if (!socket?.connected) return;
      if (!text?.trim() && !rawImageDataUrl) return;

      const clean = text ? sanitize(text.trim()) : '';
      const ctx   = { roomId };

      // Encrypt text
      let ciphertext = '', iv = '';
      if (clean) {
        const enc = await encrypt(clean, ctx);
        if (!enc) return; // key not ready
        ciphertext = enc.ciphertext;
        iv         = enc.iv;
      }

      // Encrypt image — never send raw base64 to server
      let encryptedImage = null, imageIv = null;
      if (rawImageDataUrl) {
        const encImg = await encryptImg(rawImageDataUrl, ctx);
        if (!encImg) return; // key not ready
        encryptedImage = encImg.ciphertext;
        imageIv        = encImg.iv;
      }

      // Optimistic UI — show plaintext locally immediately
      const optimisticMsg = {
        id:             `opt-${Date.now()}`,
        socketId:       socket.id,
        username:       identity?.username,
        text:           clean || null,
        imageData:      rawImageDataUrl || null, // local preview (never sent)
        encryptedContent: ciphertext,
        iv,
        timestamp:      Date.now(),
        optimistic:     true,
      };
      setMessages((prev) => {
        const next = [...prev, optimisticMsg];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });

      // Send only encrypted data to server
      socket.emit('send_message', {
        roomId,
        encryptedContent: ciphertext,
        iv,
        encryptedImage,   // encrypted image blob
        imageIv,          // IV for image decryption
        // imageData is intentionally NOT sent — server never sees raw images
      });
    },
    [socket, identity, roomId, encrypt, encryptImg]
  );

  const sendTyping = useCallback(
    (isTyping) => {
      if (!socket?.connected) return;
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { roomId });
    },
    [socket, roomId]
  );

  return { messages, users, typingUsers, joinError, sendMessage, sendTyping };
}
