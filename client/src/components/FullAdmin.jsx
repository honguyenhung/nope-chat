import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThemeSelector from './ThemeSelector.jsx';
import VideoBackground from './VideoBackground.jsx';
import { useThemeContext } from '../App.jsx';
import { THEMES } from '../hooks/useTheme.js';

export default function FullAdmin() {
  const themeContext = useThemeContext();
  const theme = themeContext?.theme || 'darkblue';
  const setThemeById = themeContext?.setThemeById || (() => {});
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [ipActivity, setIpActivity] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bannedIPs, setBannedIPs] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('global');
  const [roomMessages, setRoomMessages] = useState([]);
  
  // Form states
  const [banIP, setBanIP] = useState('');
  const [unbanIP, setUnbanIP] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  const API_BASE = `${import.meta.env.VITE_SERVER_URL || 'https://nope-chat.onrender.com'}/api/admin`;

  // Check if already logged in on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      // Verify token is still valid
      verifyToken(savedToken);
    }
  }, []);

  async function verifyToken(authToken) {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        setIsLoggedIn(true);
        setMessage(''); // Clear any error messages
        fetchAllData(authToken);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('admin_token');
        setToken('');
        setIsLoggedIn(false);
        setMessage('Session expired, please login again');
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      // Don't clear token on network error, might be temporary
      setMessage('Connection error, retrying...');
      // Retry after 3 seconds
      setTimeout(() => verifyToken(authToken), 3000);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setMessage(''); // Clear previous messages
    
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token); // Save to localStorage
        setIsLoggedIn(true);
        setMessage('Login successful!');
        fetchAllData(data.token);
      } else {
        setMessage(data.message || 'Invalid credentials');
        // Clear password field on failed login
        setPassword('');
      }
    } catch (err) {
      setMessage('Connection failed - check if server is running');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllData(authToken = token) {
    if (!authToken) return;

    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      // Fetch all data in parallel
      const [statsRes, usersRes, activityRes, roomsRes, bannedRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers }),
        fetch(`${API_BASE}/users`, { headers }),
        fetch(`${API_BASE}/ip-activity`, { headers }),
        fetch(`${API_BASE}/rooms`, { headers }),
        fetch(`${API_BASE}/banned-ips`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setOnlineUsers(userData.onlineUsers || []);
      }
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setIpActivity(activityData.ipActivity || []);
      }
      if (roomsRes.ok) {
        const roomData = await roomsRes.json();
        setRooms(roomData.rooms || []);
      }
      if (bannedRes.ok) {
        const bannedData = await bannedRes.json();
        setBannedIPs(bannedData.bannedIPs || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  }

  async function fetchRoomMessages(roomId) {
    try {
      const response = await fetch(`${API_BASE}/messages/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoomMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 5000);
      
      // Auto-refresh session every 30 minutes instead of 1 hour
      const sessionRefresh = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE}/refresh`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            // Session expired, logout
            handleLogout();
          }
        } catch (err) {
          console.error('Session refresh failed:', err);
        }
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => {
        clearInterval(interval);
        clearInterval(sessionRefresh);
      };
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (selectedRoom && token) {
      fetchRoomMessages(selectedRoom);
    }
  }, [selectedRoom, token]);

  async function handleBanIP(ipToBan = null) {
    const targetIP = ipToBan || banIP.trim();
    if (!targetIP) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ban-ip`, {
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
      fetchAllData(); // Refresh data
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
      const response = await fetch(`${API_BASE}/unban-ip`, {
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
      fetchAllData();
    } catch (err) {
      setMessage('Failed to unban IP');
    } finally {
      setLoading(false);
    }
  }

  async function handleKickUser(socketId, username) {
    if (!confirm(`Kick user "${username}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/kick-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socketId, reason: 'Kicked by admin' })
      });
      
      const data = await response.json();
      setMessage(data.message || 'User kicked');
      fetchAllData();
    } catch (err) {
      setMessage('Failed to kick user');
    }
  }

  async function handleClearRoom(roomId) {
    const roomName = roomId === 'global' ? 'Global Room' : `Room ${roomId.slice(0, 8)}...`;
    if (!confirm(`Clear all messages from ${roomName}?\n\nThis will delete all messages but keep the room active.`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/messages/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ ${data.message || 'Messages cleared successfully'}`);
        fetchRoomMessages(roomId); // Refresh to show empty room
        fetchAllData(); // Refresh room list
      } else {
        setMessage(`❌ Failed to clear messages: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to clear messages: Connection error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAdminMessage() {
    if (!adminMessage.trim() || !selectedRoom) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          roomId: selectedRoom, 
          message: adminMessage.trim() 
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Message sent to ${selectedRoom === 'global' ? 'Global Room' : 'room ' + selectedRoom.slice(0, 8) + '...'}`);
        setAdminMessage('');
        // Don't refresh room messages to avoid duplicates
        // The message will appear via socket event
      } else {
        setMessage(`❌ Failed to send message: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to send message: Connection error');
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_token'); // Clear localStorage
    setIsLoggedIn(false);
    setToken('');
    setUsername('');
    setPassword('');
    setMessage('');
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'rooms', label: 'Rooms', icon: '🏠' },
    { id: 'themes', label: 'Themes', icon: '🎨' }
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 admin-panel relative" style={{ background: 'var(--bg)' }}>
        <VideoBackground theme={theme} />
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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Full Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Complete control over your chat platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="field w-full"
              autoFocus
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
              {loading ? 'Logging in...' : '🔓 Access Full Admin'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 admin-panel" style={{ background: 'var(--bg)', backdropFilter: 'blur(2px)' }}>
      <VideoBackground theme={theme} />
      {/* Header */}
      <header className="border-b sticky top-0 z-20" style={{ background: 'var(--panel)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>
              👑
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Full Admin Panel</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {onlineUsers.length} users online • {rooms.length} active rooms
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
            <ThemeSelector theme={theme} onSelect={setThemeById} />
            <button onClick={handleLogout} className="btn btn-soft px-4 py-2 text-sm">
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
                background: message.includes('success') || message.includes('successful') ? 'rgba(59,165,93,0.1)' : 'rgba(237,66,69,0.1)',
                border: `1px solid ${message.includes('success') || message.includes('successful') ? 'rgba(59,165,93,0.25)' : 'rgba(237,66,69,0.25)'}`,
                color: message.includes('success') || message.includes('successful') ? '#3ba55d' : '#ed4245'
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
              <StatCard title="Online Users" value={onlineUsers.length} icon="👥" color="blue" />
              <StatCard title="Active Rooms" value={rooms.length} icon="🏠" color="green" />
              <StatCard title="Banned IPs" value={bannedIPs.length} icon="🚫" color="red" />
              <StatCard title="Server Uptime" value={formatUptime(stats?.serverUptime || 0)} icon="⏱️" color="purple" />
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
              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  👥 Online Users ({onlineUsers.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>
                      No users currently online
                    </p>
                  ) : (
                    onlineUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: 'var(--text-1)' }}>
                              {user.username}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-lg"
                              style={{ background: 'var(--accent)', color: '#fff' }}>
                              {user.rooms.length > 0 ? user.rooms[0] : 'Lobby'}
                            </span>
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                            IP: {user.ip} • Connected: {new Date(user.connectedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBanIP(user.ip)}
                            className="btn btn-soft px-3 py-1 text-xs"
                            style={{ background: 'rgba(237,66,69,0.1)', color: '#ed4245' }}
                          >
                            🔨 Ban IP
                          </button>
                          <button
                            onClick={() => handleKickUser(user.socketId, user.username)}
                            className="btn btn-soft px-3 py-1 text-xs"
                            style={{ background: 'rgba(255,165,0,0.1)', color: '#ffa500' }}
                          >
                            👢 Kick
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  📋 Recent IP Activity
                </h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {ipActivity.slice(0, 50).map((entry, index) => (
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

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  🔨 Ban IP Address
                </h3>
                <div className="flex gap-2 mb-4">
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

              <div className="glass p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  ✅ Unban IP Address
                </h3>
                <div className="flex gap-2 mb-4">
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

              <div className="glass p-6 lg:col-span-2">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                  🚫 Banned IP Addresses ({bannedIPs.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {bannedIPs.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg text-sm"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-2)' }}>{ip}</span>
                      <button
                        onClick={() => {
                          setUnbanIP(ip);
                          handleUnbanIP();
                        }}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(59,165,93,0.1)', color: '#3ba55d' }}
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
                    💬 Room Messages
                  </h3>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="field"
                  >
                    <option value="global">Global Room</option>
                    {rooms.filter(r => r.roomId !== 'global').map(room => (
                      <option key={room.roomId} value={room.roomId}>
                        {room.roomId} ({room.userCount} users)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Send admin message to room..."
                    className="field flex-1"
                  />
                  <button
                    onClick={handleSendAdminMessage}
                    disabled={!adminMessage.trim()}
                    className="btn btn-grad px-4"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => handleClearRoom(selectedRoom)}
                    className="btn btn-soft px-4"
                    style={{ background: 'rgba(237,66,69,0.1)', color: '#ed4245' }}
                  >
                    Clear Room
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {roomMessages.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>
                      No messages in this room
                    </p>
                  ) : (
                    roomMessages.map((msg, index) => (
                      <div key={index} className="p-3 rounded-xl"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>
                            {msg.username}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                          {msg.encryptedContent ? '🔒 Encrypted message' : '📷 Image message'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rooms' && (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass p-6"
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                🏠 Active Rooms ({rooms.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room, index) => (
                  <div key={index} className="p-4 rounded-xl"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium" style={{ color: 'var(--text-1)' }}>
                        {room.isGlobal ? '🌐 Global' : `🔒 ${room.roomId.slice(0, 8)}...`}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded"
                        style={{ background: 'var(--accent)', color: '#fff' }}>
                        {room.userCount} users
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                      {room.messageCount} messages
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRoom(room.roomId);
                          setActiveTab('messages');
                        }}
                        className="btn btn-soft px-3 py-1 text-xs flex-1"
                      >
                        View Messages
                      </button>
                      <button
                        onClick={() => handleClearRoom(room.roomId)}
                        className="btn btn-soft px-3 py-1 text-xs"
                        style={{ background: 'rgba(237,66,69,0.1)', color: '#ed4245' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'themes' && (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ThemesPanel currentTheme={theme} onSelectTheme={setThemeById} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ThemesPanel({ currentTheme, onSelectTheme }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>🎨 Quản lý Themes</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Chọn theme video nền cho toàn bộ ứng dụng</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          Đang dùng: {THEMES.find(t => t.id === currentTheme)?.icon} {THEMES.find(t => t.id === currentTheme)?.label || 'Custom'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {THEMES.map((t) => {
          const isActive = currentTheme === t.id;
          const isHovered = hoveredId === t.id;
          return (
            <motion.div
              key={t.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl cursor-pointer"
              style={{
                border: isActive
                  ? '2.5px solid var(--accent)'
                  : '2px solid var(--border)',
                boxShadow: isActive ? '0 0 24px var(--accent-glow)' : 'none',
                background: 'var(--panel)',
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectTheme(t.id)}
            >
              {/* Preview area */}
              <div className="relative w-full" style={{ height: 160, background: '#0a0a0f', overflow: 'hidden' }}>
                {t.video ? (
                  <video
                    key={t.id}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{
                      filter: 'brightness(1.3) contrast(1.1) saturate(1.1)',
                      transition: 'filter 0.3s',
                    }}
                  >
                    <source src={t.video} />
                  </video>
                ) : t.bg ? (
                  <img
                    src={t.bg}
                    alt={t.label}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(1.3) contrast(1.1)' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                    {t.icon}
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)'
                }} />

                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 10px var(--accent-glow)' }}>
                    <span>✓</span> Đang dùng
                  </div>
                )}

                {/* Video badge */}
                {t.video && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                    🎬 Video
                  </div>
                )}
              </div>

              {/* Info row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t.label}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); onSelectTheme(t.id); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--panel-hover)',
                    color: isActive ? '#fff' : 'var(--text-2)',
                    border: isActive ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {isActive ? '✓ Đang dùng' : 'Áp dụng'}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-6 p-4 rounded-2xl flex items-start gap-3"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <span className="text-lg shrink-0">💡</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Về tính năng Themes</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Theme được lưu trong localStorage và áp dụng cho toàn bộ app. Video nền chạy tự động với hiệu ứng loop.
            Người dùng cũng có thể tự chọn theme riêng từ chat page.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'rgba(59, 130, 246, 0.1)',
    green: 'rgba(34, 197, 94, 0.1)',
    purple: 'rgba(168, 85, 247, 0.1)',
    red: 'rgba(239, 68, 68, 0.1)'
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