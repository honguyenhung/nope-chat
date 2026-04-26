import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { manualBanIP, manualUnbanIP } from '../middleware/ipLimiter.js';
import crypto from 'crypto';

export const adminRouter = Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Nhie';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1';

// Simple session storage - persistent across server restarts
let adminSessions = new Map();

// Initialize with a default admin session for testing
const defaultToken = 'admin-default-token-2024';
adminSessions.set(defaultToken, {
  username: 'Nhie',
  loginTime: Date.now(),
  expires: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
});

// Clean expired sessions periodically (every hour)
setInterval(() => {
  if (adminSessions.size > 0) {
    const now = Date.now();
    for (const [token, session] of adminSessions.entries()) {
      if (session.expires < now) {
        adminSessions.delete(token);
      }
    }
  }
}, 60 * 60 * 1000);

// Admin login
adminRouter.post('/login', rateLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password required' 
    });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    
    adminSessions.set(token, {
      username,
      loginTime: Date.now(),
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Extend session (refresh token)
adminRouter.post('/refresh', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const session = adminSessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (session) adminSessions.delete(token);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Extend session by 30 days
  session.expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  adminSessions.set(token, session);

  res.json({ 
    success: true, 
    message: 'Session refreshed',
    expires: session.expires 
  });
});

// Auth middleware
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const session = adminSessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (session) adminSessions.delete(token);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.adminUser = session.username;
  next();
}

// Admin stats
adminRouter.get('/stats', adminAuth, (req, res) => {
  res.json({
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: Date.now(),
    adminUser: req.adminUser,
    connectionsThisMinute: global.connectionsThisMinute || 0,
    messagesThisMinute: global.messagesThisMinute || 0
  });
});

// Get online users with IPs
adminRouter.get('/users', adminAuth, (req, res) => {
  const onlineUsers = [];
  
  // Get users from all socket connections
  if (global.io) {
    const sockets = global.io.sockets.sockets;
    sockets.forEach((socket) => {
      const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
      onlineUsers.push({
        socketId: socket.id,
        username: socket.data?.username || 'Anonymous',
        ip: ip,
        connectedAt: socket.handshake.time,
        rooms: Array.from(socket.rooms).filter(room => room !== socket.id)
      });
    });
  }

  res.json({
    onlineUsers,
    totalUsers: onlineUsers.length,
    uniqueIPs: [...new Set(onlineUsers.map(u => u.ip))].length
  });
});

// Get IP activity log
adminRouter.get('/ip-activity', adminAuth, (req, res) => {
  const ipActivity = global.ipActivity || [];
  res.json({ 
    ipActivity: ipActivity.slice(0, 100) // Last 100 activities
  });
});

// Ban IP
adminRouter.post('/ban-ip', adminAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  
  manualBanIP(ip);
  res.json({ success: true, message: `IP ${ip} banned` });
});

// Unban IP
adminRouter.post('/unban-ip', adminAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  
  manualUnbanIP(ip);
  res.json({ success: true, message: `IP ${ip} unbanned` });
});

// Get all messages from a room
adminRouter.get('/messages/:roomId', adminAuth, (req, res) => {
  const { roomId } = req.params;
  const messages = global.roomMessages?.[roomId] || [];
  res.json({ messages, roomId });
});

// Delete specific message
adminRouter.delete('/messages/:roomId/:messageId', adminAuth, (req, res) => {
  const { roomId, messageId } = req.params;
  
  if (!global.roomMessages) global.roomMessages = {};
  if (!global.roomMessages[roomId]) global.roomMessages[roomId] = [];
  
  const messages = global.roomMessages[roomId];
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex !== -1) {
    messages.splice(messageIndex, 1);
    
    // Broadcast message deletion to room
    if (global.io) {
      global.io.to(roomId).emit('message_deleted', { messageId, deletedBy: 'admin' });
    }
    
    res.json({ success: true, message: 'Message deleted' });
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

// Clear all messages from a room
adminRouter.delete('/messages/:roomId', adminAuth, (req, res) => {
  const { roomId } = req.params;
  
  // Only clear messages, don't delete the room itself
  if (!global.roomMessages) global.roomMessages = {};
  global.roomMessages[roomId] = [];
  
  // Broadcast message clear to all users in room (but keep room alive)
  if (global.io) {
    global.io.to(roomId).emit('room_messages_cleared', { 
      clearedBy: 'admin',
      message: '🧹 Admin cleared all messages in this room'
    });
  }
  
  console.log(`Admin cleared messages in room: ${roomId}`);
  
  res.json({ 
    success: true, 
    message: `Messages cleared from ${roomId === 'global' ? 'Global Room' : 'room ' + roomId}`,
    roomId 
  });
});

// Kick user from room
adminRouter.post('/kick-user', adminAuth, (req, res) => {
  const { socketId, reason } = req.body;
  
  if (!socketId) return res.status(400).json({ error: 'Socket ID required' });
  
  if (global.io) {
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('kicked', { reason: reason || 'Kicked by admin' });
      socket.disconnect(true);
      res.json({ success: true, message: 'User kicked' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else {
    res.status(500).json({ error: 'Server not available' });
  }
});

// Get all active rooms
adminRouter.get('/rooms', adminAuth, (req, res) => {
  const rooms = [];
  
  if (global.io) {
    const socketRooms = global.io.sockets.adapter.rooms;
    socketRooms.forEach((sockets, roomId) => {
      // Skip socket IDs (they are also in rooms map)
      if (!global.io.sockets.sockets.has(roomId)) {
        const userCount = sockets.size;
        const messages = global.roomMessages?.[roomId]?.length || 0;
        rooms.push({
          roomId,
          userCount,
          messageCount: messages,
          isGlobal: roomId === 'global'
        });
      }
    });
  }
  
  res.json({ rooms });
});

// Send admin message to room
adminRouter.post('/send-message', adminAuth, (req, res) => {
  const { roomId, message } = req.body;
  
  if (!roomId || !message) {
    return res.status(400).json({ error: 'Room ID and message required' });
  }
  
  if (global.io) {
    const adminMessage = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      username: '👑 Admin',
      text: message.trim(),
      timestamp: Date.now(),
      isAdmin: true
    };
    
    // Log for debugging
    console.log(`Admin sending message to room: ${roomId}`, adminMessage);
    
    // ONLY send via socket - don't store in room history to avoid duplicates
    global.io.to(roomId).emit('admin_message', adminMessage);
    
    res.json({ 
      success: true, 
      message: `Admin message sent to room ${roomId}`,
      roomId,
      messageText: message.trim()
    });
  } else {
    res.status(500).json({ error: 'Socket.io server not available' });
  }
});

// Get banned IPs list
adminRouter.get('/banned-ips', adminAuth, (req, res) => {
  const bannedIPs = global.bannedIPs || new Set();
  res.json({ 
    bannedIPs: Array.from(bannedIPs),
    count: bannedIPs.size 
  });
});

// Server control - restart warning
adminRouter.post('/server-restart', adminAuth, (req, res) => {
  if (global.io) {
    global.io.emit('server_restart_warning', { 
      message: 'Server will restart in 30 seconds for maintenance',
      countdown: 30 
    });
  }
  
  res.json({ success: true, message: 'Restart warning sent to all users' });
});