import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard({ token, onLogout }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [banIP, setBanIP] = useState('');
  const [unbanIP, setUnbanIP] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch stats every 5 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
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

  async function handleBanIP() {
    if (!banIP.trim()) return;
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'https://nope-chat.onrender.com';
      const response = await fetch(`${backendUrl}/api/admin/ban-ip`, {
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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="border-b" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                    onClick={handleBanIP}
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
              className="glass p-6"
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                👥 User Management
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                User management features coming soon...
              </p>
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