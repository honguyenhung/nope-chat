import rateLimit from 'express-rate-limit';

// HTTP API rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Per-socket message rate limiter (in-memory token bucket)
const socketLimits = new Map(); // socketId -> { count, resetAt }
const socketEventLimits = new Map(); // socketId -> { eventCounts: {}, resetAt }

export function checkSocketRateLimit(socketId) {
  const now = Date.now();
  const limit = socketLimits.get(socketId);

  if (!limit || now > limit.resetAt) {
    // Reset window: allow 30 messages per 10 seconds
    socketLimits.set(socketId, { count: 1, resetAt: now + 10_000 });
    return true;
  }

  if (limit.count >= 30) return false; // Rate limited

  limit.count++;
  return true;
}

// Generic event rate limiter (prevents spam of join_room, typing, etc.)
export function checkEventRateLimit(socketId, eventType, maxPerWindow = 60, windowMs = 60_000) {
  const now = Date.now();
  let limits = socketEventLimits.get(socketId);

  if (!limits || now > limits.resetAt) {
    // Reset window
    limits = { eventCounts: {}, resetAt: now + windowMs };
    socketEventLimits.set(socketId, limits);
  }

  const currentCount = limits.eventCounts[eventType] || 0;
  if (currentCount >= maxPerWindow) return false; // Rate limited

  limits.eventCounts[eventType] = currentCount + 1;
  return true;
}

export function cleanupSocketLimit(socketId) {
  socketLimits.delete(socketId);
  socketEventLimits.delete(socketId);
}
