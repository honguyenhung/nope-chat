/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           AnonChat — End-to-End Encryption               ║
 * ║                                                          ║
 * ║  Layer 1 (Group):  PBKDF2 → AES-GCM-256 room key        ║
 * ║  Layer 2 (Peer):   ECDH P-256 → AES-GCM-256 shared key  ║
 * ║  Layer 3 (Room pw): PBKDF2 + random salt → AES-GCM-256  ║
 * ║                                                          ║
 * ║  Server sees: encrypted blobs + IV only. Nothing else.   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// ─── Helpers ────────────────────────────────────────────────

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ─── ECDH Key Pair ──────────────────────────────────────────

/** Generate an ECDH P-256 key pair for this session */
export async function generateKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
}

/** Export public key → base64 string (safe to share) */
export async function exportPublicKey(publicKey) {
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  return toBase64(raw);
}

/** Import a peer's public key from base64 */
export async function importPublicKey(base64) {
  return crypto.subtle.importKey(
    'raw',
    fromBase64(base64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

/** Derive a shared AES-GCM-256 key via ECDH */
export async function deriveSharedKey(privateKey, peerPublicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ─── AES-GCM Encrypt / Decrypt ──────────────────────────────

/**
 * Encrypt any Uint8Array payload → { ciphertext, iv } (both base64)
 * Works for text AND binary (images)
 */
export async function encryptBytes(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    bytes
  );
  return {
    ciphertext: toBase64(cipherBuffer),
    iv: toBase64(iv),
  };
}

/**
 * Decrypt → Uint8Array, or null on failure
 */
export async function decryptBytes(key, ciphertext, ivBase64) {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(ivBase64) },
      key,
      fromBase64(ciphertext)
    );
    return new Uint8Array(plain);
  } catch {
    return null;
  }
}

/** Encrypt a UTF-8 string → { ciphertext, iv } */
export async function encryptMessage(key, plaintext) {
  return encryptBytes(key, new TextEncoder().encode(plaintext));
}

/** Decrypt to string, or null on failure */
export async function decryptMessage(key, ciphertext, iv) {
  const bytes = await decryptBytes(key, ciphertext, iv);
  if (!bytes) return null;
  return new TextDecoder().decode(bytes);
}

/**
 * Encrypt a base64 data-URL image → { ciphertext, iv }
 * The entire data-URL string is encrypted so server can't see MIME type either.
 */
export async function encryptImage(key, dataUrl) {
  return encryptMessage(key, dataUrl);
}

/** Decrypt image → data-URL string, or null */
export async function decryptImage(key, ciphertext, iv) {
  return decryptMessage(key, ciphertext, iv);
}

// ─── Room Key (Group Encryption) ────────────────────────────

/**
 * Derive a deterministic AES-GCM-256 room key from roomId.
 * PBKDF2 with 600k iterations (OWASP 2023).
 * All members of the same room derive the same key client-side.
 */
export async function deriveRoomKey(roomId) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(roomId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('anon-chat-room-v2'),
      iterations: 600_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ─── Password-Protected Room Key ────────────────────────────

/**
 * Derive an AES-GCM-256 key from roomId + user password.
 * Uses a random salt stored in the room link so only people
 * with the link AND password can decrypt.
 *
 * @param {string} roomId
 * @param {string} password
 * @param {string|null} saltB64  - base64 salt (creator generates, others receive via link)
 * @returns {{ key: CryptoKey, saltB64: string }}
 */
export async function derivePasswordKey(roomId, password, saltB64 = null) {
  // Creator generates a random salt; joiners use the salt from the link
  const salt = saltB64
    ? fromBase64(saltB64)
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${roomId}:${password}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return { key, saltB64: toBase64(salt) };
}

// ─── Security Fingerprint ────────────────────────────────────

/**
 * Generate a human-readable 4-group hex fingerprint from a CryptoKey.
 * Users can compare this out-of-band to verify no MITM.
 * e.g. "A1B2 C3D4 E5F6 7890"
 */
export async function getFingerprint(key) {
  if (!key) return null;
  try {
    const raw = await crypto.subtle.exportKey('raw', key);
    const hash = await crypto.subtle.digest('SHA-256', raw);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    // Return first 16 hex chars grouped as 4×4
    return hex.slice(0, 16).match(/.{4}/g).join(' ');
  } catch {
    return null;
  }
}
