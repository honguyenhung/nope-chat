import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimiter } from './middleware/rateLimiter.js';
import { registerSocketHandlers } from './sockets/index.js';
import { apiRouter } from './routes/api.js';
import { adminRouter } from './routes/admin.js';

const isProd = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Validate critical environment variables
if (isProd) {
  const requiredEnvVars = ['CLIENT_URL', 'ADMIN_KEY'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Set these in your .env file or deployment environment');
    process.exit(1);
  }
  
  if (!process.env.CLIENT_URL.startsWith('https://')) {
    console.warn('⚠️  CLIENT_URL should use HTTPS in production');
  }
}

// Warn in production if CLIENT_URL is not set
if (isProd && !process.env.CLIENT_URL) {
  console.warn('⚠️  CLIENT_URL env var not set — defaulting to localhost (CORS will block production clients)');
}

const app = express();
const httpServer = createServer(app);

// --- Socket.io setup ---
// Redis adapter can be plugged in here for horizontal scaling:
// import { createAdapter } from '@socket.io/redis-adapter';
// import { createClient } from 'redis';
// const pubClient = createClient({ url: process.env.REDIS_URL });
// const subClient = pubClient.duplicate();
// io.adapter(createAdapter(pubClient, subClient));
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 4e6, // 4MB — AES-encrypted images (2MB raw → ~2.7MB base64 + overhead)
  pingTimeout: 60000, // 60s - disconnect if no pong
  pingInterval: 25000, // 25s - send ping every 25s
  upgradeTimeout: 10000, // 10s - max time for transport upgrade
  allowEIO3: false, // Disable legacy Engine.IO v3 (security)
  transports: ['websocket'], // Only WebSocket, no polling (reduces attack surface)
});

// --- Express middleware ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
}));
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));

// Root route - redirect to frontend
app.get('/', (req, res) => {
  res.redirect(CLIENT_URL);
});

app.use('/api', rateLimiter, apiRouter);
app.use('/api/admin', adminRouter); // Admin routes without rate limiting

// --- Socket handlers ---
registerSocketHandlers(io);

// Make io globally available for admin routes
global.io = io;

const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown — wait for existing connections before exit
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
  // Force exit after 10s if connections hang
  setTimeout(() => process.exit(1), 10_000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
