// Simple monitoring utilities for DDoS detection
let connectionCount = 0;
let messageCount = 0;
let lastResetTime = Date.now();

const MONITOR_WINDOW_MS = 60 * 1000; // 1 minute
const ALERT_THRESHOLDS = {
  connectionsPerMinute: 100,
  messagesPerMinute: 1000,
};

export function incrementConnections() {
  connectionCount++;
  checkAlerts();
}

export function incrementMessages() {
  messageCount++;
  checkAlerts();
}

function checkAlerts() {
  const now = Date.now();
  
  if (now - lastResetTime >= MONITOR_WINDOW_MS) {
    // Check if we're under attack
    if (connectionCount > ALERT_THRESHOLDS.connectionsPerMinute) {
      console.log(`🚨 HIGH CONNECTION RATE: ${connectionCount} connections/minute`);
    }
    
    if (messageCount > ALERT_THRESHOLDS.messagesPerMinute) {
      console.log(`🚨 HIGH MESSAGE RATE: ${messageCount} messages/minute`);
    }
    
    // Reset counters
    connectionCount = 0;
    messageCount = 0;
    lastResetTime = now;
  }
}

export function getStats() {
  return {
    connectionsThisMinute: connectionCount,
    messagesThisMinute: messageCount,
    windowStartTime: lastResetTime,
  };
}