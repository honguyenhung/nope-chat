import { useState, useEffect } from 'react';
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

// Generate avatar initials background
function AvatarIcon({ username, isOwn, size = 8 }) {
  const color = nameColor(username ?? '?');
  return (
    <div
      className={`w-${size} h-${size} rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 select-none`}
      style={{
        background: isOwn ? 'linear-gradient(135deg,var(--accent),var(--accent-2))' : color,
        boxShadow: isOwn ? '0 2px 10px var(--accent-glow)' : 'none',
        minWidth: size === 8 ? '2rem' : '1.75rem',
        minHeight: size === 8 ? '2rem' : '1.75rem',
      }}
    >
      {username?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

const REACTIONS = ['👍','❤️','😂','😮','😢','🔥'];

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
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
        style={{ background: 'rgba(255,255,255,0.15)' }}>✕</button>
    </motion.div>
  );
}

export default function MessageBubble({ message, isOwn, onReply, onEdit, onDelete, highlight }) {
  const { id, username, text, imageData, timestamp, optimistic, isAdmin, isEdited } = message;
  const [lightbox, setLightbox]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [reactions, setReactions]   = useState({});
  const [showReact, setShowReact]   = useState(false);
  const [isNew, setIsNew]           = useState(true);
  const [editing, setEditing]       = useState(false);
  const [editText, setEditText]     = useState(text || '');
  const [deleted, setDeleted]       = useState(false);
  const color = nameColor(username ?? '?');

  // "new message" glow effect — fades after 2s
  useEffect(() => {
    const t = setTimeout(() => setIsNew(false), 2000);
    return () => clearTimeout(t);
  }, []);

  function copy() {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  function addReaction(emoji) {
    setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    setShowReact(false);
  }

  function handleSaveEdit() {
    if (editText.trim() && editText.trim() !== text && onEdit) {
      onEdit(id, editText.trim());
    }
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditing(false);
    setEditText(text || '');
  }

  function handleDelete() {
    if (onDelete && confirm('Xóa tin nhắn này?')) {
      onDelete(id);
    }
  }

  // Highlight search text
  function highlightText(str, query) {
    if (!query?.trim()) return str;
    const parts = str.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{ background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: 3 }}>{part}</mark>
        : part
    );
  }

  if (deleted) return null;

  // Admin message styling
  if (isAdmin) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-center mb-3"
      >
        <div className="max-w-md px-4 py-2 rounded-xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(239,68,68,0.1))',
            border: '1px solid rgba(220,38,38,0.3)',
            color: 'var(--text-1)'
          }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">👑</span>
            <span className="font-bold text-sm" style={{ color: '#dc2626' }}>{username}</span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{formatTime(timestamp)}</span>
          </div>
          <p className="text-sm font-medium">{text}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{
          opacity: optimistic ? 0.65 : 1,
          y: 0,
          scale: 1,
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`flex gap-3 group py-1 px-2 rounded-2xl transition-all relative ${isOwn ? 'flex-row-reverse' : ''}`}
        style={{
          boxShadow: isNew && !optimistic ? (isOwn ? '0 0 0 1.5px var(--accent-glow)' : '0 0 0 1.5px rgba(255,255,255,0.06)') : 'none',
          transition: 'box-shadow 1.5s ease, background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel)'}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setShowReact(false); }}
      >
        {/* Avatar */}
        <AvatarIcon username={username} isOwn={isOwn} />

        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Meta — timestamp always visible */}
          <div className="flex items-center gap-2 mb-1.5 px-0.5">
            <span className="text-xs font-bold" style={{ color: isOwn ? 'var(--accent)' : color }}>
              {isOwn ? 'You' : username}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
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
          {text && !editing && (
            <div className={`px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${isOwn ? 'bubble-me' : 'bubble-them'}`}>
              {highlightText(text, highlight)}
              {isEdited && (
                <span className="text-[10px] opacity-60 ml-2">(đã chỉnh sửa)</span>
              )}
            </div>
          )}

          {/* Edit mode */}
          {editing && (
            <div className="flex flex-col gap-1 w-full">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="field text-sm resize-none"
                rows={2}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') { 
                    handleCancelEdit();
                  }
                }}
              />
              <div className="flex gap-1">
                <button onClick={handleSaveEdit}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--accent)', color: '#fff' }}>✓ Lưu</button>
                <button onClick={handleCancelEdit}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--panel)', color: 'var(--text-3)' }}>✕ Hủy</button>
              </div>
            </div>
          )}

          {!text && !imageData && (
            <div className="px-4 py-2.5 rounded-2xl text-sm italic"
              style={{ background: 'var(--panel)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              🔒 Decrypting...
            </div>
          )}

          {/* Reactions display */}
          {Object.keys(reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactions).map(([emoji, count]) => (
                <button key={emoji} onClick={() => addReaction(emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  {emoji} <span>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Reply + Reaction + Edit/Delete inline buttons */}
          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {text && onReply && (
              <button onClick={() => onReply({ username, text })}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                title="Reply">↩</button>
            )}
            {/* Edit - chỉ tin nhắn của mình */}
            {isOwn && text && (
              <button onClick={() => setEditing(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                title="Edit">✏️</button>
            )}
            {/* Delete - chỉ tin nhắn của mình */}
            {isOwn && (
              <button onClick={handleDelete}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: '#ed4245' }}
                title="Delete">🗑️</button>
            )}
            <div className="relative">
              <button onClick={() => setShowReact(v => !v)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                😊
              </button>
              <AnimatePresence>
                {showReact && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute bottom-8 flex gap-1 p-2 rounded-2xl z-20 ${isOwn ? 'right-0' : 'left-0'}`}
                    style={{ background: 'var(--panel)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                  >
                    {REACTIONS.map(emoji => (
                      <button key={emoji} onClick={() => addReaction(emoji)}
                        className="text-xl transition-all hover:scale-125 active:scale-95 p-0.5">
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Xóa absolute buttons cũ */}
      </motion.div>

      <AnimatePresence>
        {lightbox && <Lightbox src={imageData} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  );
}
