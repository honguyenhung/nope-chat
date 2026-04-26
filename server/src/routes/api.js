import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';

export const apiRouter = Router();

// Health check (rate limited to prevent abuse)
apiRouter.get('/health', rateLimiter, (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});