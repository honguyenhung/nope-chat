import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SimpleAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [banIP, setBanIP] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('https://nope-chat.onrender.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setToken(data.token);
        setIsLoggedIn(true);
        setMessage('Login successful!');
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (err) {
      setMessage('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleBanIP() {
    if (!banIP.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('https://nope-chat.onrender.com/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: banIP.trim() })
      });

      const data = await response.json();
      setMessage(data.message || 'IP banned successfully');
      setBanIP('');
    } catch (err) {
      setMessage('Failed to ban IP');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setToken('');
    setUsername('');
    setPassword('');
    setMessage('');
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>
              👑
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Simple Admin</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="field w-full"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="field w-full"
            />
            
            {message && (
              <div className="px-3 py-2 rounded-xl text-xs text-center"
                style={{ 
                  background: message.includes('successful') ? 'rgba(59,165,93,0.1)' : 'rgba(237,66,69,0.1)',
                  color: message.includes('successful') ? '#3ba55d' : '#ed4245'
                }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="btn btn-grad w-full py-3"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="border-b p-4" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>👑 Admin Panel</h1>
          <button onClick={handleLogout} className="btn btn-soft px-4 py-2">Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {message && (
          <div className="mb-4 px-4 py-2 rounded-xl text-sm"
            style={{ 
              background: message.includes('success') ? 'rgba(59,165,93,0.1)' : 'rgba(237,66,69,0.1)',
              color: message.includes('success') ? '#3ba55d' : '#ed4245'
            }}>
            {message}
          </div>
        )}

        <div className="glass p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>🔨 Ban IP Address</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={banIP}
              onChange={(e) => setBanIP(e.target.value)}
              placeholder="Enter IP address to ban..."
              className="field flex-1"
            />
            <button
              onClick={handleBanIP}
              disabled={loading || !banIP.trim()}
              className="btn btn-grad px-6"
            >
              {loading ? 'Banning...' : 'Ban IP'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            Enter an IP address to ban it from accessing the chat
          </p>
        </div>
      </div>
    </div>
  );
}