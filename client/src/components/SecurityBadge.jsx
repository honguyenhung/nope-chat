import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrypto } from '../hooks/useCrypto.jsx';

/**
 * Shows the E2EE status and security fingerprint for the current room.
 * Users can compare fingerprints out-of-band to verify no MITM.
 */
export default function SecurityBadge({ roomId }) {
  const { getSecurityCode, cryptoReady } = useCrypto();
  const [open,        setOpen]        = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    if (!cryptoReady || !roomId) return;
    getSecurityCode({ roomId }).then(setFingerprint);
  }, [cryptoReady, roomId]);

  function copyFingerprint() {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative">
      {/* Badge button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="E2E Encrypted — click for details"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: open ? 'rgba(59,165,93,0.2)' : 'rgba(59,165,93,0.1)',
          color: '#3ba55d',
          border: '1px solid rgba(59,165,93,0.3)',
        }}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        E2EE
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl p-4 z-50 shadow-float"
            style={{ background: 'var(--panel)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,165,93,0.15)' }}>
                <svg className="w-4 h-4" fill="#3ba55d" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#3ba55d' }}>End-to-End Encrypted</p>
                <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Messages are encrypted on your device</p>
              </div>
            </div>

            {/* What this means */}
            <div className="space-y-1.5 mb-4">
              {[
                'Server cannot read your messages',
                'Images are encrypted before sending',
                'Only room members can decrypt',
              ].map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: '#3ba55d' }}>✓</span>
                  <span className="text-xs" style={{ color: 'var(--text-2)' }}>{line}</span>
                </div>
              ))}
            </div>

            {/* Security fingerprint */}
            <div className="rounded-xl p-3" style={{ background: 'var(--panel-hover)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                Security Code
              </p>
              {fingerprint ? (
                <>
                  <p className="font-mono text-sm font-bold tracking-widest mb-2" style={{ color: 'var(--text-1)' }}>
                    {fingerprint}
                  </p>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--text-3)' }}>
                    Compare this code with other members to verify no one is intercepting.
                  </p>
                  <button
                    onClick={copyFingerprint}
                    className="text-xs font-medium transition-colors"
                    style={{ color: copied ? '#3ba55d' : 'var(--accent)' }}
                  >
                    {copied ? '✓ Copied!' : '⎘ Copy code'}
                  </button>
                </>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Generating…</p>
              )}
            </div>

            {/* Algorithm info */}
            <p className="text-[10px] mt-3 text-center" style={{ color: 'var(--text-3)' }}>
              AES-GCM 256-bit · PBKDF2 600k iterations
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
