import { Router } from 'express';
import { roomExists } from '../utils/roomStore.js';
import { manualBanIP, manualUnbanIP, isIPBanned } from '../middleware/ipLimiter.js';
import { getStats } from '../utils/monitor.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import crypto from 'crypto';

export const apiRouter = Router();

// Admin credentials (sẽ lấy từ environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Nhie';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1';

// Admin login endpoint
apiRouter.post('/admin/login', rateLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password required' 
    });
  }

  // Kiểm tra credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Tạo session token (đơn giản)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Lưu token tạm thời (trong production nên dùng Redis)
    global.adminSessions = global.adminSessions || new Map();
    global.adminSessions.set(token, {
      username,
      loginTime: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      token,
      message: 'Login successful',
      user: { username }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// Admin auth middleware với session token
const adminSessionAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const sessions = global.adminSessions || new Map();
  const session = sessions.get(token);

  if (!session || session.expires < Date.now()) {
    if (session) sessions.delete(token); // Cleanup expired
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.adminUser = session.username;
  next();
};

// Check if a room is active
apiRouter.get('/rooms/:roomId/status', (req, res) => {
  const exists = roomExists(req.params.roomId);
  res.json({ exists });
});

// Health check (rate limited to prevent abuse)
apiRouter.get('/health', rateLimiter, (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Admin: Ban IP
apiRouter.post('/admin/ban-ip', adminSessionAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  
  manualBanIP(ip);
  res.json({ success: true, message: `IP ${ip} banned by ${req.adminUser}` });
});

// Admin: Unban IP
apiRouter.post('/admin/unban-ip', adminSessionAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  
  manualUnbanIP(ip);
  res.json({ success: true, message: `IP ${ip} unbanned by ${req.adminUser}` });
});

// Admin: Check IP status
apiRouter.get('/admin/ip-status/:ip', adminSessionAuth, (req, res) => {
  const { ip } = req.params;
  const banned = isIPBanned(ip);
  res.json({ ip, banned });
});

// Admin: Get connected users and their IPs
apiRouter.get('/admin/users', adminSessionAuth, (req, res) => {
  const connectedUsers = [];
  const rooms = global.rooms || new Map();
  
  // Lấy thông tin từ tất cả rooms
  rooms.forEach((room, roomId) => {
    if (room.users) {
      room.users.forEach(user => {
        connectedUsers.push({
          roomId,
          username: user.username,
          ip: user.ip,
          joinedAt: user.joinedAt,
          lastActive: user.lastActive
        });
      });
    }
  });

  res.json({
    connectedUsers,
    totalUsers: connectedUsers.length,
    uniqueIPs: [...new Set(connectedUsers.map(u => u.ip))].length
  });
});

// Admin: Get IP activity history
apiRouter.get('/admin/ip-history', adminSessionAuth, (req, res) => {
  const ipHistory = global.ipHistory || [];
  res.json({ ipHistory });
});
  const stats = getStats();
  res.json({
    ...stats,
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: Date.now(),
    adminUser: req.adminUser
  });
});
