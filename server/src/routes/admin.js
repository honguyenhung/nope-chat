import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { manualBanIP, manualUnbanIP } from '../middleware/ipLimiter.js';
import crypto from 'crypto';

export const adminRouter = Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Nhie';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1';

// Simple session storage
const adminSessions = new Map();

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
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
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
    adminUser: req.adminUser
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