// Limit concurrent WebSocket connections per IP + IP blacklist
const ipConnections = new Map(); // ip -> Set of socketIds
const ipBlacklist = new Set(); // IPs that are temporarily banned
const ipViolations = new Map(); // ip -> { count, resetAt }
const banHistory = new Map(); // ip -> ban count - NEW: Track repeat offenders

const MAX_CONNECTIONS_PER_IP = 3; // STRICTER: Was 5
const MAX_VIOLATIONS_BEFORE_BAN = 5; // STRICTER: Was 10
const VIOLATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // LONGER: 24 hours (was 1 hour)

export function trackConnection(ip, socketId) {
  // Check if IP is blacklisted
  if (ipBlacklist.has(ip)) {
    console.log(`🚫 Blocked connection from banned IP: ${ip}`);
    return false;
  }

  if (!ipConnections.has(ip)) ipConnections.set(ip, new Set());
  const sockets = ipConnections.get(ip);

  if (sockets.size >= MAX_CONNECTIONS_PER_IP) {
    recordViolation(ip, 'max_connections');
    return false; // Reject connection
  }

  sockets.add(socketId);
  return true;
}

export function releaseConnection(ip, socketId) {
  const sockets = ipConnections.get(ip);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) ipConnections.delete(ip);
}

// Record a violation (rate limit, spam, etc.) and potentially ban IP
export function recordViolation(ip, reason) {
  const now = Date.now();
  let violations = ipViolations.get(ip);

  if (!violations || now > violations.resetAt) {
    violations = { count: 0, resetAt: now + VIOLATION_WINDOW_MS };
    ipViolations.set(ip, violations);
  }

  violations.count++;
  console.log(`⚠️  IP ${ip} violation (${reason}): ${violations.count}/${MAX_VIOLATIONS_BEFORE_BAN}`);

  if (violations.count >= MAX_VIOLATIONS_BEFORE_BAN) {
    banIP(ip);
  }
}

// NEW: Escalating ban duration for repeat offenders
function banIP(ip) {
  const banCount = (banHistory.get(ip) || 0) + 1;
  banHistory.set(ip, banCount);
  
  // Escalating: 24h, 48h, 96h, 192h...
  const duration = BAN_DURATION_MS * Math.pow(2, banCount - 1);
  const hours = duration / 1000 / 60 / 60;
  
  ipBlacklist.add(ip);
  console.log(`🔨 IP ${ip} banned for ${hours} hours (ban #${banCount})`);
  
  // Disconnect all existing connections from this IP
  const sockets = ipConnections.get(ip);
  if (sockets) {
    // Note: actual socket disconnection would need to be handled by the caller
    // since we don't have access to the io instance here
    ipConnections.delete(ip);
  }

  // Auto-unban after duration
  setTimeout(() => {
    ipBlacklist.delete(ip);
    ipViolations.delete(ip);
    console.log(`✅ IP ${ip} unbanned after ${hours} hours`);
  }, duration);
}

export function isIPBanned(ip) {
  return ipBlacklist.has(ip);
}

// Manual ban/unban functions for admin use
export function manualBanIP(ip) {
  banIP(ip);
}

export function manualUnbanIP(ip) {
  ipBlacklist.delete(ip);
  ipViolations.delete(ip);
  banHistory.delete(ip);
  console.log(`✅ IP ${ip} manually unbanned`);
}
