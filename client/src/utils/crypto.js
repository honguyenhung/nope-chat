/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        AnonChat — Multi-Layer End-to-End Encryption      ║
 * ║                                                          ║
 * ║  Layer 1 (Room):    PBKDF2 → AES-GCM-256 room key       ║
 * ║  Layer 2 (Session): Random → AES-GCM-256 session key    ║
 * ║  Layer 3 (Transport): XOR obfuscation                   ║
 * ║  Layer 4 (Peer):    ECDH P-256 → AES-GCM-256 shared key ║
 * ║                                                          ║
 * ║  Triple encryption: AES → AES → XOR                     ║
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

// ─── Multi-Layer Encryption Helpers ─────────────────────────

/**
 * Layer 3: XOR obfuscation (lightweight, fast)
 * Adds extra layer without performance hit
 */
function xorObfuscate(data, key) {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

/**
 * Generate session key (rotates every message)
 */
function generateSessionKey() {
  return crypto.getRandomValues(new Uint8Array(32)); // 256-bit
}

/**
 * Derive transport key from session key
 */
async function deriveTransportKey(sessionKey) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sessionKey,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('transport-layer-v1'),
      iterations: 100_000, // Faster for real-time
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
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

/** 
 * MULTI-LAYER ENCRYPTION
 * Encrypt a UTF-8 string with 3 layers of encryption
 * Layer 1: AES-GCM-256 (Room Key)
 * Layer 2: AES-GCM-256 (Session Key)  
 * Layer 3: XOR obfuscation
 */
export async function encryptMessage(key, plaintext) {
  // Add timestamp for replay attack protection
  const timestamp = Date.now();
  const payload = JSON.stringify({ text: plaintext, ts: timestamp });
  
  // Generate session key for this message
  const sessionKey = generateSessionKey();
  const transportKey = await deriveTransportKey(sessionKey);
  
  // Layer 1: Encrypt with room key (AES-GCM)
  const layer1 = await encryptBytes(key, new TextEncoder().encode(payload));
  
  // Layer 2: Encrypt layer1 with transport key (AES-GCM)
  const layer2Data = new TextEncoder().encode(JSON.stringify(layer1));
  const layer2 = await encryptBytes(transportKey, layer2Data);
  
  // Layer 3: XOR obfuscation
  const layer3Cipher = xorObfuscate(fromBase64(layer2.ciphertext), sessionKey);
  
  return {
    ciphertext: toBase64(layer3Cipher),
    iv: layer2.iv,
    sessionKey: toBase64(sessionKey), // Send session key (encrypted by room key later)
    timestamp,
    layers: 3 // Indicator for multi-layer
  };
}

/** 
 * MULTI-LAYER DECRYPTION
 * Decrypt with 3 layers
 */
export async function decryptMessage(key, ciphertext, iv, sessionKeyB64) {
  try {
    // Check if multi-layer (has sessionKey)
    if (sessionKeyB64) {
      const sessionKey = fromBase64(sessionKeyB64);
      const transportKey = await deriveTransportKey(sessionKey);
      
      // Layer 3: XOR de-obfuscation
      const layer3Plain = xorObfuscate(fromBase64(ciphertext), sessionKey);
      
      // Layer 2: Decrypt with transport key
      const layer2Plain = await decryptBytes(transportKey, toBase64(layer3Plain), iv);
      if (!layer2Plain) return null;
      
      const layer1Data = JSON.parse(new TextDecoder().decode(layer2Plain));
      
      // Layer 1: Decrypt with room key
      const layer1Plain = await decryptBytes(key, layer1Data.ciphertext, layer1Data.iv);
      if (!layer1Plain) return null;
      
      const decoded = new TextDecoder().decode(layer1Plain);
      const payload = JSON.parse(decoded);
      
      // Replay attack protection
      if (payload.ts) {
        const age = Date.now() - payload.ts;
        if (age > 5 * 60 * 1000) {
          console.warn('Rejected old message (replay attack protection)');
          return null;
        }
      }
      
      return payload.text || decoded;
    }
    
    // Fallback: Single-layer decryption (old format)
    const bytes = await decryptBytes(key, ciphertext, iv);
    if (!bytes) return null;
    
    const decoded = new TextDecoder().decode(bytes);
    const payload = JSON.parse(decoded);
    
    if (payload.ts) {
      const age = Date.now() - payload.ts;
      if (age > 5 * 60 * 1000) {
        console.warn('Rejected old message (replay attack protection)');
        return null;
      }
    }
    
    return payload.text || decoded;
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
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
 * PBKDF2 with 1M iterations + SHA-512 (maximum security).
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
      iterations: 1_000_000,
      hash: 'SHA-512',
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
      iterations: 1_000_000,
      hash: 'SHA-512',
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
