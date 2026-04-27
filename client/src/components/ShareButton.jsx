import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function ShareButton({ roomId }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/room/${roomId}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      {/* QR Code */}
      <div className="bg-white p-3 rounded-xl" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <QRCodeSVG value={url} size={160} fgColor="#09090b" bgColor="#ffffff" />
      </div>

      <button onClick={copy}
        className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
        style={{
          background: copied ? 'rgba(59,165,93,0.15)' : 'linear-gradient(135deg,var(--accent),var(--accent-2))',
          color: copied ? '#3ba55d' : '#fff',
          border: copied ? '1px solid rgba(59,165,93,0.4)' : 'none',
          boxShadow: copied ? 'none' : '0 4px 16px var(--accent-glow)',
        }}
      >
        <AnimatePresence mode="wait">
          {copied
            ? <motion.span key="ok" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-2">✅ Copied!</motion.span>
            : <motion.span key="cp" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-2">🔗 Share Room Link</motion.span>
          }
        </AnimatePresence>
      </button>
    </div>
  );
}
