import rateLimit from 'express-rate-limit';

// HTTP API rate limiter - STRICTER
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Was 100
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Per-socket message rate limiter (in-memory token bucket)
const socketLimits = new Map(); // socketId -> { count, resetAt }
const socketEventLimits = new Map(); // socketId -> { eventCounts: {}, resetAt }
const ipRequestCount = new Map(); // ip -> { count, resetAt } - NEW: Track per-IP across all sockets

// STRICTER: 10 messages per 10 seconds (was 30)
export function checkSocketRateLimit(socketId, ip) {
  const now = Date.now();
  const limit = socketLimits.get(socketId);

  if (!limit || now > limit.resetAt) {
    // Reset window: allow 10 messages per 10 seconds
    socketLimits.set(socketId, { count: 1, resetAt: now + 10_000 });
  } else {
    if (limit.count >= 10) return false; // Rate limited
    limit.count++;
  }

  // NEW: Per-IP limit across ALL sockets - 30 messages per minute
  const ipLimit = ipRequestCount.get(ip);
  if (!ipLimit || now > ipLimit.resetAt) {
    ipRequestCount.set(ip, { count: 1, resetAt: now + 60_000 });
  } else {
    if (ipLimit.count >= 30) return false; // IP rate limited
    ipLimit.count++;
  }

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

// NEW: Cleanup IP limits periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of ipRequestCount.entries()) {
    if (now > limit.resetAt) {
      ipRequestCount.delete(ip);
    }
  }
}, 60_000); // Every minute
