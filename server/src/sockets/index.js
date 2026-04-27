import { v4 as uuidv4 } from 'uuid';
import { generateUsername } from '../utils/usernameGenerator.js';
import { checkSocketRateLimit, cleanupSocketLimit, checkEventRateLimit } from '../middleware/rateLimiter.js';
import { trackConnection, releaseConnection, recordViolation, isIPBanned } from '../middleware/ipLimiter.js';
import { incrementConnections, incrementMessages } from '../utils/monitor.js';
import {
  addUserToRoom,
  markUserOffline,
  getRoomUsers,
  addMessageToRoom,
  getRoomMessages,
  getOrCreateRoom,
  isRoomPasswordProtected,
  checkRoomPassword,
  hashPassword,
} from '../utils/roomStore.js';
import { containsProfanity } from '../utils/profanityFilter.js';

export function registerSocketHandlers(io) {
  // Store io globally for admin access
  global.io = io;
  
  // Initialize IP activity tracking
  if (!global.ipActivity) global.ipActivity = [];

  io.on('connection', (socket) => {
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

    // Log IP activity
    global.ipActivity.unshift({
      ip,
      action: 'connected',
      timestamp: Date.now(),
      socketId: socket.id
    });
    
    // Keep only last 1000 entries
    if (global.ipActivity.length > 1000) {
      global.ipActivity = global.ipActivity.slice(0, 1000);
    }

    // Check if IP is banned
    if (isIPBanned(ip)) {
      socket.emit('error', { message: 'Your IP is temporarily banned.' });
      socket.disconnect(true);
      return;
    }

    if (!trackConnection(ip, socket.id)) {
      socket.emit('error', { message: 'Too many connections from your IP.' });
      socket.disconnect(true);
      return;
    }

    incrementConnections(); // Monitor connection rate

    const rawNick = socket.handshake.auth?.nickname?.trim();
    const username = rawNick
      ? rawNick.slice(0, 24).replace(/[^a-zA-Z0-9_\-. ]/g, '') || generateUsername()
      : generateUsername();
    socket.data.username = username;
    socket.data.rooms = new Set();

    socket.emit('identity', { username, socketId: socket.id });

    // --- Query room info (does it need a password?) ---
    socket.on('room_info', ({ roomId }, callback) => {
      if (!checkEventRateLimit(socket.id, 'room_info', 30)) {
        recordViolation(ip, 'room_info_spam');
        socket.emit('error', { message: 'Too many room queries.' });
        return;
      }
      if (typeof callback !== 'function') return;
      const targetRoom = roomId
        ? String(roomId).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '-') || 'global'
        : 'global';
      callback({ hasPassword: isRoomPasswordProtected(targetRoom) });
    });

    // --- Create a guaranteed-unique private room ---
    socket.on('create_room', ({ password } = {}, callback) => {
      if (!checkEventRateLimit(socket.id, 'create_room', 10)) {
        recordViolation(ip, 'create_room_spam');
        socket.emit('error', { message: 'Too many room creations.' });
        return;
      }
      const roomId = uuidv4(); // UUID — impossible to guess or collide
      const passwordHash = password?.trim() ? hashPassword(password.trim()) : null;
      getOrCreateRoom(roomId, socket.id, passwordHash);
      if (typeof callback === 'function') callback({ roomId, hasPassword: !!passwordHash });
    });

    // --- Join a room ---
    socket.on('join_room', ({ roomId, publicKey, password }) => {
      if (!checkEventRateLimit(socket.id, 'join_room', 20)) {
        recordViolation(ip, 'join_room_spam');
        socket.emit('error', { message: 'Too many join attempts.' });
        return;
      }
      const targetRoom = roomId
        ? String(roomId).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '-') || 'global'
        : 'global';

      // Validate publicKey format (base64)
      if (publicKey && (typeof publicKey !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(publicKey) || publicKey.length > 200)) {
        socket.emit('error', { message: 'Invalid public key format.' });
        return;
      }

      // Password check (skip for global room)
      if (targetRoom !== 'global' && isRoomPasswordProtected(targetRoom)) {
        const hash = password?.trim() ? hashPassword(password.trim()) : '';
        if (!checkRoomPassword(targetRoom, hash)) {
          socket.emit('join_error', { code: 'WRONG_PASSWORD', message: 'Incorrect password.' });
          return;
        }
      }

      socket.data.rooms.add(targetRoom);

      addUserToRoom(targetRoom, socket.id, {
        username,
        publicKey,
        socketId: socket.id,
        ip: ip, // Track IP for admin
        joinedAt: Date.now(),
        lastActive: Date.now()
      });

      socket.join(targetRoom);

      const history = getRoomMessages(targetRoom);
      socket.emit('message_history', history);

      // Send full user list (includes online/offline status)
      const users = getRoomUsers(targetRoom);
      io.to(targetRoom).emit('room_users', { roomId: targetRoom, users });
      socket.to(targetRoom).emit('user_joined', { username, socketId: socket.id, publicKey });
    });

    // --- Send message ---
    socket.on('send_message', ({ roomId, encryptedContent, iv, recipientId, encryptedImage, imageIv, encryptedFile, fileIv, fileMetadata }) => {
      incrementMessages(); // Monitor message rate
      
      // NEW: Strict payload validation
      const payloadSize = JSON.stringify({ encryptedContent, iv, encryptedImage, imageIv, encryptedFile, fileIv }).length;
      if (payloadSize > 20_000_000) { // 20MB max total payload
        recordViolation(ip, 'payload_too_large');
        socket.emit('error', { message: 'Payload too large.' });
        return;
      }
      
      // NEW: Check for injection attempts
      const payloadStr = JSON.stringify({ roomId, encryptedContent, iv, fileMetadata });
      if (payloadStr.includes('<script>') || 
          payloadStr.includes('javascript:') ||
          payloadStr.includes('onerror=') ||
          payloadStr.includes('eval(') ||
          payloadStr.includes('onclick=')) {
        recordViolation(ip, 'injection_attempt');
        socket.disconnect(true);
        return;
      }
      
      if (!checkSocketRateLimit(socket.id, ip)) {
        recordViolation(ip, 'message_spam');
        socket.emit('error', { message: 'Slow down! You are sending messages too fast.' });
        return;
      }

      const b64Regex = /^[A-Za-z0-9+/=]+$/;

      // Validate text payload
      if (encryptedContent && (!b64Regex.test(encryptedContent) || encryptedContent.length > 20_000)) {
        socket.emit('error', { message: 'Invalid message format.' });
        return;
      }
      if (iv && !b64Regex.test(iv)) {
        socket.emit('error', { message: 'Invalid message format.' });
        return;
      }

      // Validate encrypted image (base64 of 2MB image + AES overhead ≈ 3MB base64)
      if (encryptedImage) {
        if (!b64Regex.test(encryptedImage) || encryptedImage.length > 4_000_000) {
          socket.emit('error', { message: 'Image too large or invalid. Max 2MB.' });
          return;
        }
        if (!imageIv || !b64Regex.test(imageIv)) {
          socket.emit('error', { message: 'Invalid image IV.' });
          return;
        }
      }

      // Validate encrypted file (max 10MB)
      if (encryptedFile) {
        if (!b64Regex.test(encryptedFile) || encryptedFile.length > 15_000_000) {
          socket.emit('error', { message: 'File too large or invalid. Max 10MB.' });
          return;
        }
        if (!fileIv || !b64Regex.test(fileIv)) {
          socket.emit('error', { message: 'Invalid file IV.' });
          return;
        }
      }

      if (!encryptedContent && !encryptedImage && !encryptedFile) return;

      const targetRoom = roomId || 'global';
      const message = {
        id:               uuidv4(),
        socketId:         socket.id,
        username:         socket.data.username,
        encryptedContent, // encrypted text — server cannot read
        iv,
        encryptedImage:   encryptedImage || null, // encrypted image — server cannot read
        imageIv:          imageIv || null,
        encryptedFile:    encryptedFile || null, // encrypted file — server cannot read
        fileIv:           fileIv || null,
        fileMetadata:     fileMetadata || null, // file name, size, type (not encrypted)
        recipientId,
        timestamp:        Date.now(),
      };

      // Store message for admin access
      if (!global.roomMessages) global.roomMessages = {};
      if (!global.roomMessages[targetRoom]) global.roomMessages[targetRoom] = [];
      global.roomMessages[targetRoom].push(message);
      
      // Keep only last 1000 messages per room
      if (global.roomMessages[targetRoom].length > 1000) {
        global.roomMessages[targetRoom] = global.roomMessages[targetRoom].slice(-1000);
      }

      addMessageToRoom(targetRoom, message);

      if (recipientId) {
        io.to(recipientId).emit('new_message', message);
        socket.emit('new_message', message);
      } else {
        io.to(targetRoom).emit('new_message', message);
      }
    });

    // --- Typing ---
    socket.on('typing_start', ({ roomId }) => {
      if (!checkEventRateLimit(socket.id, 'typing', 120)) { // 120 per minute = 2 per second
        recordViolation(ip, 'typing_spam');
        return; // Silently ignore typing spam
      }
      socket.to(roomId || 'global').emit('user_typing', { username, socketId: socket.id });
    });
    socket.on('typing_stop', ({ roomId }) => {
      if (!checkEventRateLimit(socket.id, 'typing', 120)) {
        return; // Silently ignore
      }
      socket.to(roomId || 'global').emit('user_stop_typing', { socketId: socket.id });
    });

    // --- Disconnect: mark offline, keep in list for 60s ---
    socket.on('disconnect', () => {
      // Log disconnect
      global.ipActivity.unshift({
        ip,
        action: 'disconnected',
        timestamp: Date.now(),
        socketId: socket.id
      });

      cleanupSocketLimit(socket.id);
      releaseConnection(ip, socket.id);

      for (const roomId of socket.data.rooms) {
        markUserOffline(roomId, socket.id);
        // Broadcast updated list with offline status immediately
        const users = getRoomUsers(roomId);
        io.to(roomId).emit('room_users', { roomId, users });
        io.to(roomId).emit('user_left', {
          username,
          socketId: socket.id,
          lastSeen: Date.now(),
        });
      }
    });
  });
}
