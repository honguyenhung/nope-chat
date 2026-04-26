import { motion, AnimatePresence } from 'framer-motion';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const PALETTE = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#e879f9'];
function nameColor(n) {
  let h = 0;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export default function UserList({ users, mySocketId }) {
  const online  = users.filter((u) => u.online !== false);
  const offline = users.filter((u) => u.online === false);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
      <SectionLabel label="Online" count={online.length} />
      <AnimatePresence>
        {online.map((u) => <Row key={u.socketId} user={u} mySocketId={mySocketId} />)}
      </AnimatePresence>

      {offline.length > 0 && (
        <>
          <SectionLabel label="Offline" count={offline.length} className="mt-4" />
          <AnimatePresence>
            {offline.map((u) => <Row key={u.socketId} user={u} mySocketId={mySocketId} />)}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function SectionLabel({ label, count, className = '' }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${className}`} style={{ color: 'var(--text-3)' }}>
      {label} — {count}
    </p>
  );
}

function Row({ user, mySocketId }) {
  const online = user.online !== false;
  const isMe   = user.socketId === mySocketId;
  const color  = nameColor(user.username ?? '?');

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: online ? 1 : 0.4, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-default transition-colors"
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white select-none"
          style={{ background: color, opacity: online ? 1 : 0.5, boxShadow: online ? `0 2px 8px ${color}55` : 'none' }}>
          {user.username?.[0]?.toUpperCase()}
        </div>
        {/* Status dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg)', border: '2px solid var(--bg)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: online ? '#3ba55d' : 'var(--text-3)', boxShadow: online ? '0 0 6px #3ba55d' : 'none' }} />
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: online ? 'var(--text-1)' : 'var(--text-3)' }}>
          {user.username}
          {isMe && <span className="ml-1 text-[10px] font-normal" style={{ color: 'var(--text-3)' }}>(you)</span>}
        </p>
        {!online && user.lastSeen && (
          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{timeAgo(user.lastSeen)}</p>
        )}
      </div>
    </motion.div>
  );
}
