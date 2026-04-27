import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket.jsx';
import { useCrypto } from './useCrypto.jsx';
import { sanitize } from '../utils/profanityFilter.js';

const MAX_MESSAGES = 200;
const MESSAGES_PER_PAGE = 50;

export function useChat(roomId, password = null) {
  const { socket, identity } = useSocket();
  const { publicKeyB64, addPeer, removePeer, encrypt, decrypt, encryptImg, decryptImg } = useCrypto();

  const [messages,    setMessages]    = useState([]);
  const [allMessages, setAllMessages] = useState([]); // Store all messages
  const [hasMore,     setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
        setAllMessages(decrypted);
        setMessages(decrypted.slice(-MESSAGES_PER_PAGE)); // Show last 50 initially
        setHasMore(decrypted.length > MESSAGES_PER_PAGE);
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

      // Also add to allMessages
      setAllMessages(prev => {
        const next = [...prev, decrypted];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    });

    // Handle admin messages (unencrypted)
    socket.on('admin_message', (adminMsg) => {
      console.log('Received admin message:', adminMsg);
      setMessages((prev) => {
        // Check for duplicates by ID and timestamp
        const exists = prev.find(msg => 
          msg.id === adminMsg.id || 
          (msg.isAdmin && msg.timestamp === adminMsg.timestamp && msg.text === adminMsg.text)
        );
        if (exists) {
          console.log('Duplicate admin message detected, skipping');
          return prev; // Don't add duplicate
        }
        
        const next = [...prev, {
          ...adminMsg,
          isAdmin: true,
          decrypted: adminMsg.text || adminMsg.message // Admin messages are plain text
        }];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    });

    // Handle room messages cleared (not room deletion)
    socket.on('room_messages_cleared', (data) => {
      setMessages([]); // Clear messages in UI
      // Show admin notification
      const clearNotification = {
        id: Date.now().toString(),
        username: '🧹 System',
        text: data.message || 'Messages cleared by admin',
        timestamp: Date.now(),
        isAdmin: true,
        decrypted: data.message || 'Messages cleared by admin'
      };
      setMessages([clearNotification]);
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
      ['message_history','new_message','admin_message','room_messages_cleared','room_users','user_joined',
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

    // Decrypt file
    let fileData = null;
    if (msg.encryptedFile) {
      try {
        const decryptedData = await decryptImg(msg.encryptedFile, msg.fileIv, ctx);
        fileData = {
          data: decryptedData,
          name: msg.fileMetadata?.name || 'file',
          size: msg.fileMetadata?.size || 0,
          type: msg.fileMetadata?.type || 'application/octet-stream',
        };
      } catch (err) {
        console.warn('Failed to decrypt file:', err);
        fileData = null;
      }
    }

    return { ...msg, text, imageData, fileData };
  }

  // ── Send message ─────────────────────────────────────────

  const sendMessage = useCallback(
    async (text, rawImageDataUrl = null, fileData = null) => {
      if (!socket?.connected) return;
      if (!text?.trim() && !rawImageDataUrl && !fileData) return;

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

      // Encrypt file
      let encryptedFile = null, fileIv = null, fileMetadata = null;
      if (fileData) {
        const encFile = await encryptImg(fileData.data, ctx); // Reuse image encryption for files
        if (!encFile) return;
        encryptedFile = encFile.ciphertext;
        fileIv = encFile.iv;
        fileMetadata = { name: fileData.name, size: fileData.size, type: fileData.type };
      }

      // Optimistic UI — show plaintext locally immediately
      const optimisticMsg = {
        id:             `opt-${Date.now()}`,
        socketId:       socket.id,
        username:       identity?.username,
        text:           clean || null,
        imageData:      rawImageDataUrl || null, // local preview (never sent)
        fileData:       fileData || null, // local preview
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
        encryptedFile,    // encrypted file blob
        fileIv,           // IV for file decryption
        fileMetadata,     // file name, size, type (not encrypted - for display)
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

  const loadMoreMessages = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      setMessages(prev => {
        const currentCount = prev.length;
        const startIndex = Math.max(0, allMessages.length - currentCount - MESSAGES_PER_PAGE);
        const endIndex = allMessages.length - currentCount;
        const olderMessages = allMessages.slice(startIndex, endIndex);
        
        setHasMore(startIndex > 0);
        setLoadingMore(false);
        
        return [...olderMessages, ...prev];
      });
    }, 300); // Simulate loading delay
  }, [allMessages, loadingMore, hasMore]);

  return { messages, users, typingUsers, joinError, sendMessage, sendTyping, loadMoreMessages, hasMore, loadingMore };
}
