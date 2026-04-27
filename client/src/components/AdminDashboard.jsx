import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VideoBackground from './VideoBackground.jsx';
import { useThemeContext } from '../App.jsx';

export default function AdminDashboard({ token, onLogout }) {
  const { theme } = useThemeContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [banIP, setBanIP] = useState('');
  const [unbanIP, setUnbanIP] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [ipHistory, setIpHistory] = useState([]);

  // Fetch stats every 5 seconds
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchIpHistory();
    const interval = setInterval(() => {
      fetchStats();
      fetchUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  async function fetchUsers() {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConnectedUsers(data.connectedUsers || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }

  async function fetchIpHistory() {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/ip-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIpHistory(data.ipHistory || []);
      }
    } catch (err) {
      console.error('Failed to fetch IP history:', err);
    }
  }

  async function handleBanIP(ipToBan = null) {
    const targetIP = ipToBan || banIP.trim();
    if (!targetIP) return;
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/ban-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: targetIP })
      });
      const data = await response.json();
      setMessage(data.message || 'IP banned successfully');
      setBanIP('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to ban IP');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnbanIP() {
    if (!unbanIP.trim()) return;
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/unban-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: unbanIP.trim() })
      });
      const data = await response.json();
      setMessage(data.message || 'IP unbanned successfully');
      setUnbanIP('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to unban IP');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'system', label: 'System', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <VideoBackground theme={theme} />
      {/* Header */}
      <header className="border-b relative z-20" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>
              👑
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Admin Panel</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Welcome back, {stats?.adminUser || 'Admin'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{ background: 'var(--panel-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
            >
              <span>🏠</span>
              <span className="hidden sm:inline">Trang chính</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Server Online
              </span>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-soft px-4 py-2 text-sm"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ 
                background: message.includes('Failed') ? 'rgba(237,66,69,0.1)' : 'rgba(59,165,93,0.1)',
                border: `1px solid ${message.includes('Failed') ? 'rgba(237,66,69,0.25)' : 'rgba(59,165,93,0.25)'}`,
                color: message.includes('Failed') ? '#ed4245' : '#3ba55d'
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: 'var(--panel)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-2)'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                title="Connections/Min"
                value={stats?.connectionsThisMinute || 0}
                icon="🔗"
                color="blue"
              />
              <StatCard
                title="Messages/Min"
                value={stats?.messagesThisMinute || 0}
                icon="💬"
                color="green"
              />
              <StatCard
                title="Server Uptime"
                value={formatUptime(stats?.serverUptime || 0)}
                icon="⏱️"
                color="purple"
              />
              <StatCard
                title="Memory Usage"
                value={formatMemory(stats?.memoryUsage?.heapUsed || 0)}
                icon="🧠"
                color="orange"
              />
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Ban IP */}
              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                  🔨 Ban IP Address
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={banIP}
                    onChange={(e) => setBanIP(e.target.value)}
                    placeholder="Enter IP address..."
                    className="field flex-1"
                  />
                  <button
                    onClick={() => handleBanIP()}
                    disabled={loading || !banIP.trim()}
                    className="btn btn-grad px-4"
                  >
                    Ban
                  </button>
                </div>
              </div>

              {/* Unban IP */}
              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                  ✅ Unban IP Address
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={unbanIP}
                    onChange={(e) => setUnbanIP(e.target.value)}
                    placeholder="Enter IP address..."
                    className="field flex-1"
                  />
                  <button
                    onClick={handleUnbanIP}
                    disabled={loading || !unbanIP.trim()}
                    className="btn btn-soft px-4"
                  >
                    Unban
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Connected Users */}
              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  👥 Connected Users ({connectedUsers.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {connectedUsers.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>
                      No users currently connected
                    </p>
                  ) : (
                    connectedUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: 'var(--text-1)' }}>
                              {user.username}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-lg"
                              style={{ background: 'var(--accent)', color: '#fff' }}>
                              {user.roomId === 'global' ? 'Global' : 'Private'}
                            </span>
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                            IP: {user.ip} • Joined: {new Date(user.joinedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleBanIP(user.ip)}
                          className="btn btn-soft px-3 py-1 text-xs"
                          style={{ background: 'rgba(237,66,69,0.1)', color: '#ed4245' }}
                        >
                          🔨 Ban IP
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* IP History */}
              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  📋 Recent IP Activity
                </h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {ipHistory.slice(0, 50).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg"
                      style={{ background: 'var(--input-bg)' }}>
                      <span style={{ color: 'var(--text-2)' }}>
                        {entry.ip}
                      </span>
                      <span style={{ color: 'var(--text-3)' }}>
                        {entry.action} • {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass p-6"
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                ⚙️ System Information
              </h3>
              {stats && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-3)' }}>Node.js Version:</span>
                    <span style={{ color: 'var(--text-1)' }}>{process.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-3)' }}>Memory Heap:</span>
                    <span style={{ color: 'var(--text-1)' }}>{formatMemory(stats.memoryUsage.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-3)' }}>Memory Total:</span>
                    <span style={{ color: 'var(--text-1)' }}>{formatMemory(stats.memoryUsage.heapTotal)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'rgba(59, 130, 246, 0.1)',
    green: 'rgba(34, 197, 94, 0.1)',
    purple: 'rgba(168, 85, 247, 0.1)',
    orange: 'rgba(249, 115, 22, 0.1)'
  };

  return (
    <div className="glass p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
          style={{ background: colors[color] }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
          {title}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
        {value}
      </p>
    </div>
  );
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatMemory(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}