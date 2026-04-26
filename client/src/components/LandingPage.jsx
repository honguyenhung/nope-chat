import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket.jsx';
import { useFavorites } from '../hooks/useFavorites.js';
import { useThemeContext } from '../App.jsx';
import ThemeToggle from './ThemeToggle.jsx';

function slugify(s) {
  return s.trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 64);
}

const WORDS = ['Ghost','Shadow','Phantom','Cipher','Void','Neon','Stealth','Raven','Lynx','Viper'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { socket, identity, connected, nickname, applyNickname } = useSocket();
  const { favorites, toggle } = useFavorites();
  const { theme, toggle: toggleTheme } = useThemeContext();

  const [nickInput, setNickInput] = useState(nickname);
  const [nickSaved, setNickSaved] = useState(!!nickname);
  const [joinInput, setJoinInput] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [creating, setCreating]   = useState(false);
  const [tab, setTab]             = useState('join');

  function handleSaveNick(e) {
    e.preventDefault();
    if (!nickInput.trim()) return;
    applyNickname(nickInput.trim());
    setNickSaved(true);
  }

  function handleCreate() {
    if (!socket || creating) return;
    setCreating(true);
    socket.emit('create_room', { password: roomPassword.trim() || undefined }, ({ roomId }) => {
      toggle(roomId);
      navigate(`/room/${roomId}`);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    const s = slugify(joinInput);
    if (s) navigate(`/room/${s}`);
  }

  const displayName = identity?.username ?? nickInput;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Theme toggle */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-2"
        >
          {/* Logo */}
          <div className="relative inline-flex mb-5">
            <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl select-none"
              style={{ background: 'linear-gradient(135deg,#7c6af7,#5b8af5)', boxShadow: '0 8px 40px rgba(124,106,247,0.5)' }}>
              👻
            </div>
            {/* Ping dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: connected ? '#3ba55d' : '#f59e0b', boxShadow: `0 0 8px ${connected ? '#3ba55d' : '#f59e0b'}` }}>
              <span className="w-2 h-2 rounded-full bg-white/80" />
            </span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-2">
            <span className="grad-text">Nope</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            No account · No trace · End-to-end encrypted
          </p>
        </motion.div>

        {/* ── Identity card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full p-5"
        >
          {nickSaved ? (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0 select-none"
                style={{ background: 'linear-gradient(135deg,#7c6af7,#5b8af5)', boxShadow: '0 4px 16px rgba(124,106,247,0.4)' }}>
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#3ba55d' : '#f59e0b' }} />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{connected ? 'Ready to chat' : 'Connecting...'}</span>
                </div>
              </div>
              <button onClick={() => setNickSaved(false)}
                className="btn btn-soft text-xs px-3 py-1.5 rounded-xl">
                Edit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Choose your identity</p>
              <form onSubmit={handleSaveNick} className="flex gap-2">
                <input value={nickInput} onChange={(e) => setNickInput(e.target.value)}
                  maxLength={24} placeholder="Your nickname..." autoFocus className="field flex-1" />
                <button type="submit" disabled={!nickInput.trim()} className="btn btn-grad px-5">Go</button>
              </form>
              <button type="button"
                onClick={() => setNickInput(`${WORDS[Math.floor(Math.random()*WORDS.length)]}_${Math.floor(Math.random()*9000)+1000}`)}
                className="text-xs flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
              >
                <span>🎲</span> Generate random name
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Room card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {[{ k: 'join', label: 'Join Room', icon: '🔑' }, { k: 'create', label: 'Create Room', icon: '✨' }].map(({ k, label, icon }) => (
              <button key={k} onClick={() => setTab(k)}
                className="flex-1 py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                style={{
                  color: tab === k ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
                  background: tab === k ? 'var(--panel-hover)' : 'transparent',
                }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {tab === 'join' ? (
                <motion.form key="join"
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleJoin} className="space-y-3"
                >
                  <input value={joinInput} onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="Enter room code or name..." maxLength={64} className="field" />
                  {joinInput.trim() && (
                    <p className="text-xs font-mono px-1" style={{ color: 'var(--text-3)' }}>
                      /room/<span style={{ color: 'var(--accent)' }}>{slugify(joinInput)}</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" disabled={!joinInput.trim()} className="btn btn-grad flex-1">
                      Join →
                    </button>
                    <button type="button" onClick={() => navigate('/global')}
                      className="btn btn-soft px-4" title="Global public room">
                      🌐 Global
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="create"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="space-y-2.5 rounded-xl p-4" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
                    {[
                      ['🔀', 'Unique UUID — impossible to guess or collide'],
                      ['🔗', 'Share the link with anyone you want'],
                      ['💨', 'Messages vanish after 24h'],
                    ].map(([icon, text]) => (
                      <div key={text} className="flex items-center gap-3">
                        <span className="text-base">{icon}</span>
                        <span className="text-xs" style={{ color: 'var(--text-2)' }}>{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Optional password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                      🔐 Room Password <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <input
                      type="password"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="Leave blank for open room..."
                      maxLength={64}
                      className="field w-full"
                    />
                    {roomPassword.trim() && (
                      <p className="text-[11px] flex items-center gap-1" style={{ color: '#3ba55d' }}>
                        🔒 Room will require this password to join
                      </p>
                    )}
                  </div>

                  <button onClick={handleCreate} disabled={creating || !connected} className="btn btn-grad w-full py-3">
                    {creating
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                      : roomPassword.trim() ? '🔐 Create Protected Room' : '✨ Create Private Room'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Recent rooms ── */}
        <AnimatePresence>
          {favorites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: 0.1 }}
              className="glass w-full p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
                Recent Rooms
              </p>
              <div className="space-y-1.5">
                {favorites.map((room) => (
                  <div key={room} className="flex items-center gap-2">
                    <button onClick={() => navigate(`/room/${room}`)}
                      className="flex-1 text-left px-3 py-2 rounded-xl text-xs font-mono truncate transition-all"
                      style={{ background: 'var(--panel)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      🔒 {room.length > 36 ? room.slice(0, 8) + '…' : room}
                    </button>
                    <button onClick={() => toggle(room)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(237,66,69,0.15)'; e.currentTarget.style.color = '#ed4245'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Feature pills ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-4 gap-2 w-full"
        >
          {[['🔐','E2E Encrypted'],['💨','No Logs'],['⚡','Real-time'],['🕵️','Anonymous']].map(([icon, label]) => (
            <div key={label} className="glass-sm p-3 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
