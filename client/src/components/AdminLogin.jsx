import { useState } from 'react';
import { motion } from 'framer-motion';
import VideoBackground from './VideoBackground.jsx';
import { useThemeContext } from '../App.jsx';

export default function AdminLogin({ onLogin }) {
  const { theme } = useThemeContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Gửi username + password để xác thực
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', username.trim());
        onLogin(data.token);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'var(--bg)' }}>
      <VideoBackground theme={theme} />
      
      {/* Back to Home Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => window.location.href = '/'}
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
        style={{ 
          background: 'var(--glass)', 
          border: '1px solid var(--glass-border)', 
          color: 'var(--text-2)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <span>←</span>
        <span className="hidden sm:inline">Quay lại</span>
      </motion.button>
      
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', boxShadow: '0 8px 32px rgba(220,38,38,0.4)' }}>
            👑
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Admin Panel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Restricted access - Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username..."
              className="field w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password..."
              className="field w-full"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-2 rounded-xl text-xs font-medium text-center"
              style={{ background: 'rgba(237,66,69,0.1)', border: '1px solid rgba(237,66,69,0.25)', color: '#ed4245' }}
            >
              ❌ {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="btn btn-grad w-full py-3"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              '🔓 Access Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            🔒 Only authorized administrators can access this panel
          </p>
        </div>
      </motion.div>
    </div>
  );
}