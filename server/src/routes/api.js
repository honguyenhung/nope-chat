import { Router } from 'express';
import { roomExists } from '../utils/roomStore.js';
import { manualBanIP, manualUnbanIP, isIPBanned } from '../middleware/ipLimiter.js';
import { getStats } from '../utils/monitor.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

export const apiRouter = Router();

// Simple admin auth middleware (use proper auth in production)
const adminAuth = (req, res, next) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return res.status(501).json({ error: 'Admin functionality not configured' });
  }
  if (req.headers.authorization !== `Bearer ${adminKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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
apiRouter.post('/admin/ban-ip', adminAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  
  manualBanIP(ip);
  res.json({ success: true, message: `IP ${ip} banned` });
});

// Admin: Unban IP
apiRouter.post('/admin/unban-ip', adminAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  
  manualUnbanIP(ip);
  res.json({ success: true, message: `IP ${ip} unbanned` });
});

// Admin: Check IP status
apiRouter.get('/admin/ip-status/:ip', adminAuth, (req, res) => {
  const { ip } = req.params;
  const banned = isIPBanned(ip);
  res.json({ ip, banned });
});

// Admin: Get server stats
apiRouter.get('/admin/stats', adminAuth, (req, res) => {
  const stats = getStats();
  res.json({
    ...stats,
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: Date.now(),
  });
});
