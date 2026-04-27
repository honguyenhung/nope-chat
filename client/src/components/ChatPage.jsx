import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrypto } from '../hooks/useCrypto.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import { useChat } from '../hooks/useChat.js';
import { useDocTitle } from '../hooks/useDocTitle.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useFavorites } from '../hooks/useFavorites.js';
import { useThemeContext } from '../App.jsx';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import UserList from './UserList.jsx';
import ShareButton from './ShareButton.jsx';
import EmojiPicker from './EmojiPicker.jsx';
import ImageUpload from './ImageUpload.jsx';
import ImagePreview from './ImagePreview.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import ThemeSelector from './ThemeSelector.jsx';
import SecurityBadge from './SecurityBadge.jsx';

export default function ChatPage() {
  const { roomId }      = useParams();
  const effectiveRoom   = roomId || 'global';
  const isGlobal        = effectiveRoom === 'global';
  const navigate        = useNavigate();
  const { identity, connected, error, socket } = useSocket();
  const { getSecurityCode } = useCrypto();

  // Password gate state
  const [password, setPassword]         = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false); // waiting for user input
  const [checkingRoom, setCheckingRoom]  = useState(!isGlobal); // querying server

  // Query server: does this room need a password?
  useEffect(() => {
    if (isGlobal || !socket) { setCheckingRoom(false); return; }
    socket.emit('room_info', { roomId: effectiveRoom }, ({ hasPassword }) => {
      if (hasPassword) setNeedsPassword(true);
      setCheckingRoom(false);
    });
  }, [socket, effectiveRoom, isGlobal]);

  const { messages, users, typingUsers, joinError, sendMessage, sendTyping } = useChat(
    effectiveRoom,
    password || null
  );

  // If server rejects password, show gate again
  useEffect(() => {
    if (joinError === 'WRONG_PASSWORD') {
      setNeedsPassword(true);
      setPassword('');
    }
  }, [joinError]);
  const { notify }      = useNotifications();
  const { add: fav }    = useFavorites();
  const { theme, toggle: toggleTheme, setThemeById } = useThemeContext();

  useEffect(() => { if (!isGlobal) fav(effectiveRoom); }, [effectiveRoom]); // eslint-disable-line

  const [input, setInput]           = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [pendingImg, setPendingImg] = useState(null);
  const [atBottom, setAtBottom]     = useState(true);
  const [unread, setUnread]         = useState(0);
  const [securityCode, setSecurityCode] = useState(null);
  const [replyTo, setReplyTo]       = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mentionList, setMentionList] = useState([]);
  const [showMention, setShowMention] = useState(false);

  const scrollRef    = useRef(null);
  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);
  const typingRef    = useRef(null);
  const typingEmit   = useRef(null);
  const prevCount    = useRef(0);

  useDocTitle(isGlobal ? 'Global' : effectiveRoom, unread);

  // Fetch security code periodically (in case key updates)
  useEffect(() => {
    if (isGlobal) return;
    const fetchCode = async () => {
      const code = await getSecurityCode({ roomId: effectiveRoom });
      if (code) setSecurityCode(code);
    };
    fetchCode();
    const interval = setInterval(fetchCode, 5000);
    return () => clearInterval(interval);
  }, [effectiveRoom, isGlobal, getSecurityCode]);

  // Notifications
  useEffect(() => {
    if (messages.length <= prevCount.current) { prevCount.current = messages.length; return; }
    messages.slice(prevCount.current).forEach((m) => {
      if (m.socketId !== identity?.socketId && !m.optimistic) notify(m.username, m.text || '📷 Image');
    });
    prevCount.current = messages.length;
  }, [messages.length]); // eslint-disable-line

  // Auto scroll
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (atBottom || last?.socketId === identity?.socketId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnread(0);
    } else setUnread((n) => n + 1);
  }, [messages.length]); // eslint-disable-line

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typingUsers.size]); // eslint-disable-line

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setUnread(0);
  }

  function onInput(e) {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    if (!typingEmit.current) sendTyping(true);
    clearTimeout(typingEmit.current);
    typingEmit.current = setTimeout(() => { typingEmit.current = null; }, 500);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => sendTyping(false), 2500);

    // @mention detection
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      const matches = users.filter(u => u.username !== identity?.username && u.username.toLowerCase().includes(query));
      setMentionList(matches.slice(0, 5));
      setShowMention(matches.length > 0);
    } else {
      setShowMention(false);
    }
  }

  function insertMention(username) {
    const newInput = input.replace(/@\w*$/, `@${username} `);
    setInput(newInput);
    setShowMention(false);
    textareaRef.current?.focus();
  }

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  function onSend(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const finalText = replyTo ? `↩ "${replyTo.text?.slice(0,40)}${replyTo.text?.length > 40 ? '…' : ''}"\n${input}` : input;
    
    // Clear reply state immediately before sending
    setReplyTo(null);
    setInput('');
    
    sendMessage(finalText);
    sendTyping(false);
    clearTimeout(typingRef.current); clearTimeout(typingEmit.current); typingEmit.current = null;
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }

  const onlineCount = users.filter((u) => u.online !== false).length;
  const roomLabel   = isGlobal ? 'Global' : (effectiveRoom.length > 18 ? effectiveRoom.slice(0,8)+'…' : effectiveRoom);

  // ── Password gate ──
  if (checkingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="orb orb-1" /><div className="orb orb-2" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass w-full max-w-sm p-6 relative z-10"
        >
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', boxShadow: '0 4px 24px var(--accent-glow)' }}>
              🔐
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Password Required</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              This room is protected. Enter the password to join.
            </p>
          </div>

          {joinError === 'WRONG_PASSWORD' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 px-3 py-2 rounded-xl text-xs font-medium text-center"
              style={{ background: 'rgba(237,66,69,0.1)', border: '1px solid rgba(237,66,69,0.25)', color: '#ed4245' }}>
              ❌ Incorrect password. Try again.
            </motion.div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); setPassword(pendingPassword); setNeedsPassword(false); }}
            className="space-y-3">
            <input
              type="password"
              value={pendingPassword}
              onChange={(e) => setPendingPassword(e.target.value)}
              placeholder="Enter room password..."
              autoFocus
              className="field w-full"
            />
            <button type="submit" disabled={!pendingPassword.trim()}
              className="btn btn-grad w-full py-2.5">
              Unlock Room →
            </button>
            <button type="button" onClick={() => navigate('/')}
              className="btn btn-soft w-full py-2 text-sm">
              ← Go Back
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient orbs (subtle in chat) */}
      <div className="orb orb-1" style={{ opacity: 0.12 }} />
      <div className="orb orb-2" style={{ opacity: 0.10 }} />

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 md:hidden"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar mobile ── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside key="sb-m"
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed z-30 h-full w-72 flex flex-col md:hidden"
            style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', backdropFilter: 'blur(24px)' }}
          >
            <Sidebar isGlobal={isGlobal} room={roomLabel} roomId={effectiveRoom} users={users} identity={identity}
              navigate={navigate} theme={theme} setThemeById={setThemeById} onlineCount={onlineCount} securityCode={securityCode} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex w-72 flex-col shrink-0 relative z-10"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', backdropFilter: 'blur(24px)' }}>
        <Sidebar isGlobal={isGlobal} room={roomLabel} roomId={effectiveRoom} users={users} identity={identity}
          navigate={navigate} theme={theme} setThemeById={setThemeById} onlineCount={onlineCount} securityCode={securityCode} />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Topbar */}
        <header className="h-14 flex items-center px-4 gap-3 shrink-0"
          style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
          {/* Mobile menu */}
          <button className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => setShowSidebar((v) => !v)}
            aria-label="Toggle sidebar menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Room info */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', boxShadow: '0 2px 10px var(--accent-glow)' }}>
              {isGlobal ? '🌐' : '🔒'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{isGlobal ? 'Global Room' : roomLabel}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{onlineCount} online</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search button */}
            <button onClick={() => setShowSearch(v => !v)}
              className="p-2 rounded-xl transition-all"
              style={{ background: showSearch ? 'var(--accent-glow)' : 'var(--panel)', border: '1px solid var(--border)', color: showSearch ? 'var(--accent)' : 'var(--text-2)' }}
              title="Search messages">
              🔍
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: connected ? '#3ba55d' : '#f59e0b', boxShadow: connected ? '0 0 6px #3ba55d' : 'none' }} />
              <span className="text-xs font-medium max-w-[110px] truncate" style={{ color: 'var(--text-2)' }}>
                {identity?.username}
              </span>
            </div>
            <SecurityBadge roomId={effectiveRoom} />
          </div>
        </header>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 flex items-center gap-2"
              style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)' }}>🔍</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tin nhắn..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-1)' }}
              />
              {searchQuery && (
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {filteredMessages.length} kết quả
                </span>
              )}
              <button onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                className="text-xs" style={{ color: 'var(--text-3)' }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Banners */}
        <AnimatePresence>
          {!connected && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="text-xs text-center py-2 font-semibold"
              style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#d97706' }}>
              ⚡ Reconnecting to server...
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 mt-3 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(237,66,69,0.1)', border: '1px solid rgba(237,66,69,0.25)', color: '#ed4245' }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>💬</div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No messages yet — say something!</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {filteredMessages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.socketId === identity?.socketId} 
                onReply={setReplyTo} 
                highlight={searchQuery} 
              />
            ))}
          </AnimatePresence>
          {typingUsers.size > 0 && <TypingIndicator users={[...typingUsers]} />}
          <div ref={bottomRef} />
        </div>

        {/* Scroll to bottom FAB */}
        <AnimatePresence>
          {!atBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnread(0); }}
              className="absolute bottom-24 right-5 w-11 h-11 rounded-full flex items-center justify-center z-10 font-bold text-white"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', boxShadow: '0 4px 20px var(--accent-glow)' }}
            >
              {unread > 0
                ? <span className="text-xs">{unread > 99 ? '99+' : unread}</span>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              }
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div className="p-3 shrink-0 relative"
          style={{ background: 'var(--topbar-bg)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
          <AnimatePresence>
            {pendingImg && <ImagePreview src={pendingImg} onSend={() => { 
              setReplyTo(null); // Clear reply when sending image
              sendMessage('', pendingImg); 
              setPendingImg(null); 
            }} onCancel={() => setPendingImg(null)} />}
          </AnimatePresence>
          {/* Reply preview */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}
              >
                <span>↩</span>
                <span className="font-bold" style={{ color: 'var(--accent)' }}>{replyTo.username}</span>
                <span className="truncate flex-1" style={{ color: 'var(--text-3)' }}>{replyTo.text?.slice(0, 60)}</span>
                <button onClick={() => setReplyTo(null)} className="shrink-0" style={{ color: 'var(--text-3)' }}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>
          {showEmoji && <EmojiPicker onSelect={(e) => { setInput((p) => p + e); textareaRef.current?.focus(); }} onClose={() => setShowEmoji(false)} />}

          {/* @mention popup */}
          <AnimatePresence>
            {showMention && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full left-0 right-0 mx-3 mb-1 rounded-xl overflow-hidden z-20"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', boxShadow: '0 -8px 24px rgba(0,0,0,0.2)' }}
              >
                {mentionList.map(u => (
                  <button key={u.socketId} onClick={() => insertMention(u.username)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-all hover:scale-[1.01]"
                    style={{ color: 'var(--text-1)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'var(--accent)' }}>
                      {u.username[0]?.toUpperCase()}
                    </span>
                    <span>@{u.username}</span>
                    {!u.online && <span className="text-xs ml-auto" style={{ color: 'var(--text-3)' }}>offline</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            {/* Emoji btn */}
            <button type="button" onClick={() => setShowEmoji((v) => !v)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all"
              style={{ background: showEmoji ? 'var(--accent-glow)' : 'var(--panel)', border: '1px solid var(--border)', color: showEmoji ? 'var(--accent)' : 'var(--text-2)' }}>
              😊
            </button>

            {/* Image btn */}
            <ImageUpload onImage={(d) => { setPendingImg(d); setShowEmoji(false); }} disabled={!connected} />

            {/* Textarea */}
            <textarea ref={textareaRef} value={input} onChange={onInput} onKeyDown={onKey}
              placeholder={connected ? 'Write a message…' : 'Reconnecting...'}
              disabled={!connected} rows={1}
              className="flex-1 resize-none outline-none text-sm rounded-xl px-4 py-2.5 max-h-28 font-[inherit]"
              style={{
                background: 'var(--input-bg)', color: 'var(--text-1)',
                border: '1.5px solid var(--border)', opacity: connected ? 1 : 0.5,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            {/* Send btn */}
            <button onClick={onSend} disabled={!input.trim() || !connected}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', boxShadow: input.trim() ? '0 4px 16px var(--accent-glow)' : 'none' }}>
              <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ isGlobal, room, roomId, users, identity, navigate, theme, setThemeById, onlineCount, securityCode }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all btn btn-soft">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
        </div>

        {/* Room badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', boxShadow: '0 2px 12px var(--accent-glow)' }}>
            {isGlobal ? '🌐' : '🔒'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>
              {isGlobal ? 'Global Room' : room}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{onlineCount} online</p>
          </div>
        </div>

        {/* Security Code */}
        {!isGlobal && securityCode && (
          <div className="mt-3 p-3 rounded-xl flex flex-col gap-1.5" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Mã bảo mật
              </span>
            </div>
            <div className="font-mono text-[11px] text-center font-semibold tracking-widest break-all" style={{ color: 'var(--text-1)' }}>
              {securityCode}
            </div>
          </div>
        )}
      </div>

      {/* Users */}
      <UserList users={users} mySocketId={identity?.socketId} />

      {/* Share */}
      {!isGlobal && (
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <ShareButton roomId={roomId} />
        </div>
      )}
    </>
  );
}
