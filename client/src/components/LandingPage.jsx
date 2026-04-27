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

function DiscordButton() {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText('.yennhimylove_');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all hover:scale-105 w-full text-left"
      style={{ background: 'rgba(124,106,247,0.12)', color: 'var(--text-1)' }}>
      <span className="text-base">🎮</span>
      <span className="flex-1">Discord</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-md transition-all"
        style={{ background: copied ? 'rgba(59,165,93,0.2)' : 'rgba(124,106,247,0.2)', color: copied ? '#3ba55d' : 'var(--text-3)' }}>
        {copied ? '✓ Copied!' : 'Copy'}
      </span>
    </button>
  );
}

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
  const [showContact, setShowContact] = useState(false);

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
            <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden select-none"
              style={{ boxShadow: '0 8px 40px rgba(124,106,247,0.5)' }}>
              <img src="/avatar.png" alt="Nope" className="w-full h-full object-cover" />
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

        {/* ── Admin Access ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={() => navigate('/admin')}
            className="text-[10px] font-mono opacity-30 hover:opacity-60 transition-opacity"
            style={{ color: 'var(--text-3)' }}
          >
            👑 admin
          </button>
        </motion.div>
      </div>

      {/* ── Floating Contact Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Contact popup */}
        <AnimatePresence>
          {showContact && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass p-4 rounded-2xl shadow-2xl"
              style={{ width: 220, border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-1)' }}>📬 Contact</p>
              <div className="flex flex-col gap-2">
                <a href="mailto:honguyenhung2010@gmail.com"
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                  style={{ background: 'rgba(124,106,247,0.12)', color: 'var(--text-1)' }}>
                  <span className="text-base">📧</span>
                  <span>Gmail</span>
                </a>
                <a href="https://zalo.me/0355417718" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                  style={{ background: 'rgba(124,106,247,0.12)', color: 'var(--text-1)' }}>
                  <span className="text-base">💬</span>
                  <span>Zalo</span>
                </a>
                <a href="https://web.facebook.com/Nguyen.Hvng" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                  style={{ background: 'rgba(124,106,247,0.12)', color: 'var(--text-1)' }}>
                  <span className="text-base">📘</span>
                  <span>Facebook</span>
                </a>
                <DiscordButton />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowContact(v => !v)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg"
          style={{ background: 'linear-gradient(135deg,#7c6af7,#5b8af5)', boxShadow: '0 4px 20px rgba(124,106,247,0.5)' }}
        >
          {showContact ? '✕' : '💬'}
        </motion.button>
      </div>
    </div>
  );
}
