import { createHash } from 'crypto';

// In-memory store — stateless by design, no permanent DB
const rooms = new Map(); // roomId -> { users, messages, createdAt, createdBy, passwordHash }
const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Hash password with SHA-256 (no need for bcrypt — rooms are ephemeral) */
export function hashPassword(plain) {
  return createHash('sha256').update(plain).digest('hex');
}

// Offline users are kept in the list for this long before being removed
const OFFLINE_GRACE_MS = 60 * 1000; // 60 seconds

function pruneExpiredRooms() {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) rooms.delete(id);
  }
}
setInterval(pruneExpiredRooms, 30 * 60 * 1000);

export function getOrCreateRoom(roomId, createdBy = null, passwordHash = null) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Map(),   // socketId -> userInfo
      messages: [],
      createdAt: Date.now(),
      createdBy,          // socketId of creator (for private rooms)
      passwordHash,       // null = no password
    });
  }
  return rooms.get(roomId);
}

export function isRoomPasswordProtected(roomId) {
  return !!(rooms.get(roomId)?.passwordHash);
}

export function checkRoomPassword(roomId, passwordHash) {
  const room = rooms.get(roomId);
  if (!room) return true; // room doesn't exist yet — allow (will be created)
  if (!room.passwordHash) return true; // no password set
  return room.passwordHash === passwordHash;
}

export function addUserToRoom(roomId, socketId, userInfo) {
  const room = getOrCreateRoom(roomId);
  room.users.set(socketId, {
    ...userInfo,
    online: true,
    lastSeen: Date.now(),
  });
}

// Mark user offline instead of removing — keeps them visible with offline status
export function markUserOffline(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const user = room.users.get(socketId);
  if (!user) return;
  user.online = false;
  user.lastSeen = Date.now();

  // Schedule actual removal after grace period
  setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r) return;
    const u = r.users.get(socketId);
    // Only remove if still offline (didn't reconnect)
    if (u && !u.online) r.users.delete(socketId);
  }, OFFLINE_GRACE_MS);
}

export function removeUserFromRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.users.delete(socketId);
}

export function getRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.values());
}

export function addMessageToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.messages.push(message);
  if (room.messages.length > 200) room.messages.shift();
}

export function getRoomMessages(roomId) {
  return rooms.get(roomId)?.messages ?? [];
}

export function roomExists(roomId) {
  return rooms.has(roomId);
}

export function getRoomCreator(roomId) {
  return rooms.get(roomId)?.createdBy ?? null;
}
