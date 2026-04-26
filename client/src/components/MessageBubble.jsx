import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const PALETTE = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#e879f9'];
function nameColor(n) {
  let h = 0;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function Lightbox({ src, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-zoom-out"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.img initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        src={src} alt="full" className="max-w-full max-h-full rounded-2xl object-contain"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default function MessageBubble({ message, isOwn }) {
  const { username, text, imageData, timestamp, optimistic } = message;
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied]     = useState(false);
  const color = nameColor(username ?? '?');

  function copy() {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: optimistic ? 0.65 : 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={`flex gap-3 group py-1 px-2 rounded-2xl transition-colors ${isOwn ? 'flex-row-reverse' : ''}`}
        style={{ ':hover': { background: 'var(--panel)' } }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 select-none"
          style={{ background: isOwn ? 'linear-gradient(135deg,var(--accent),var(--accent-2))' : color, boxShadow: isOwn ? '0 2px 10px var(--accent-glow)' : 'none' }}>
          {username?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Meta */}
          <div className="flex items-center gap-2 mb-1.5 px-0.5">
            <span className="text-xs font-bold" style={{ color: isOwn ? 'var(--accent)' : color }}>
              {isOwn ? 'You' : username}
            </span>
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-3)' }}>
              {formatTime(timestamp)}
            </span>
            {text && (
              <button onClick={copy} title="Copy"
                className="text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                style={{ color: 'var(--text-3)' }}>
                {copied ? '✓' : '⎘'}
              </button>
            )}
            {optimistic && <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>sending…</span>}
          </div>

          {/* Image */}
          {imageData && (
            <motion.img src={imageData} alt="img" onClick={() => setLightbox(true)}
              whileHover={{ scale: 1.02 }}
              className="max-w-[220px] max-h-[180px] rounded-2xl object-cover cursor-zoom-in"
              style={{ border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            />
          )}

          {/* Text */}
          {text && (
            <div className={`px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${isOwn ? 'bubble-me' : 'bubble-them'}`}>
              {text}
            </div>
          )}

          {!text && !imageData && (
            <div className="px-4 py-2.5 rounded-2xl text-sm italic" style={{ background: 'var(--panel)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              🔒 Decrypting...
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox && <Lightbox src={imageData} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  );
}
