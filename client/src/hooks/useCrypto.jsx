import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  deriveRoomKey,
  derivePasswordKey,
  encryptMessage,
  decryptMessage,
  encryptImage,
  decryptImage,
  getFingerprint,
} from '../utils/crypto.js';

const CryptoContext = createContext(null);

export function CryptoProvider({ children }) {
  const keyPairRef   = useRef(null);
  const [publicKeyB64, setPublicKeyB64] = useState(null);
  const [cryptoReady, setCryptoReady]   = useState(false);

  // socketId → AES-GCM shared key (ECDH peer-to-peer)
  const peerKeys = useRef(new Map());
  // roomId → AES-GCM room key (group / password)
  const roomKeys = useRef(new Map());

  // Generate ECDH key pair once per session
  useEffect(() => {
    generateKeyPair()
      .then(async (kp) => {
        keyPairRef.current = kp;
        const pub = await exportPublicKey(kp.publicKey);
        setPublicKeyB64(pub);
        setCryptoReady(true);
      })
      .catch((err) => {
        console.error('Failed to generate crypto keys:', err);
        setCryptoReady(false);
        // Show user-friendly error
        alert('Failed to initialize encryption. Please refresh the page.');
      });
  }, []);

  // ── Peer key management ──────────────────────────────────

  async function addPeer(socketId, peerPublicKeyB64) {
    if (!keyPairRef.current || peerKeys.current.has(socketId)) return;
    try {
      const peerPub = await importPublicKey(peerPublicKeyB64);
      const shared  = await deriveSharedKey(keyPairRef.current.privateKey, peerPub);
      peerKeys.current.set(socketId, shared);
    } catch (e) {
      console.warn('[crypto] addPeer failed:', e);
    }
  }

  function removePeer(socketId) {
    peerKeys.current.delete(socketId);
  }

  // ── Room key management ──────────────────────────────────

  async function getRoomKey(roomId) {
    if (!roomKeys.current.has(roomId)) {
      const key = await deriveRoomKey(roomId);
      roomKeys.current.set(roomId, key);
    }
    return roomKeys.current.get(roomId);
  }

  /**
   * Set a password-derived key for a room.
   * Call this before joining a password-protected room.
   * @param {string} roomId
   * @param {string} password
   * @param {string|null} saltB64  - null when creating, base64 when joining
   * @returns {string} saltB64 — pass this in the share link
   */
  async function setPasswordKey(roomId, password, saltB64 = null) {
    const { key, saltB64: newSalt } = await derivePasswordKey(roomId, password, saltB64);
    roomKeys.current.set(roomId, key);
    return newSalt;
  }

  // ── Resolve key for a given context ─────────────────────

  async function resolveKey({ peerId, roomId }) {
    if (peerId) return peerKeys.current.get(peerId) ?? null;
    return getRoomKey(roomId);
  }

  // ── Encrypt / Decrypt text ───────────────────────────────

  /** Returns { ciphertext, iv } or null if key not ready */
  async function encrypt(text, ctx) {
    const key = await resolveKey(ctx);
    if (!key) return null;
    return encryptMessage(key, text);
  }

  /** Returns plaintext string or null on failure */
  async function decrypt(ciphertext, iv, ctx) {
    if (!iv) return null;
    const key = await resolveKey(ctx);
    if (!key) return null;
    return decryptMessage(key, ciphertext, iv);
  }

  // ── Encrypt / Decrypt images ─────────────────────────────

  /**
   * Encrypt a base64 data-URL image.
   * Returns { ciphertext, iv } — server never sees the image content.
   */
  async function encryptImg(dataUrl, ctx) {
    const key = await resolveKey(ctx);
    if (!key) return null;
    return encryptImage(key, dataUrl);
  }

  /**
   * Decrypt an encrypted image back to a data-URL.
   * Returns data-URL string or null on failure.
   */
  async function decryptImg(ciphertext, iv, ctx) {
    if (!iv) return null;
    const key = await resolveKey(ctx);
    if (!key) return null;
    return decryptImage(key, ciphertext, iv);
  }

  // ── Security fingerprint ─────────────────────────────────

  /** Returns a 4-group hex string like "A1B2 C3D4 E5F6 7890" */
  async function getSecurityCode(ctx) {
    const key = await resolveKey(ctx);
    if (!key) return null;
    return getFingerprint(key);
  }

  return (
    <CryptoContext.Provider value={{
      publicKeyB64,
      cryptoReady,
      addPeer,
      removePeer,
      setPasswordKey,
      encrypt,
      decrypt,
      encryptImg,
      decryptImg,
      getSecurityCode,
    }}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  return useContext(CryptoContext);
}
