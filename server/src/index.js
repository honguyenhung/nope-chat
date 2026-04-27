import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimiter } from './middleware/rateLimiter.js';
import { securityMiddleware, validateRequestSize, validateRequestMethod } from './middleware/requestValidator.js';
import { registerSocketHandlers } from './sockets/index.js';
import { apiRouter } from './routes/api.js';
import { adminRouter } from './routes/admin.js';
import { connectDatabase } from './config/database.js';

const isProd = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to database
await connectDatabase();

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
      frameSrc: ["'none'"], // Prevent iframe embedding
      objectSrc: ["'none'"], // Block plugins
      baseUri: ["'self'"], // Restrict base tag
      formAction: ["'self'"], // Restrict form submissions
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  noSniff: true, // X-Content-Type-Options: nosniff
  xssFilter: true, // X-XSS-Protection: 1; mode=block
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

// Additional security headers
app.use((req, res, next) => {
  // Hide server info
  res.removeHeader('X-Powered-By');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy (disable unnecessary features)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  
  // Expect-CT (Certificate Transparency)
  res.setHeader('Expect-CT', 'max-age=86400, enforce');
  
  // Disable compression to prevent BREACH attack
  res.setHeader('Content-Encoding', 'identity');
  
  next();
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));

// Security validation middleware
app.use(validateRequestSize(10 * 1024)); // 10KB max for API requests
app.use(validateRequestMethod(['GET', 'POST']));
app.use(securityMiddleware);

// Root route - redirect to frontend
app.get('/', (req, res) => {
  res.redirect(CLIENT_URL);
});

// Health check (minimal info)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Hide 404 details
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Admin routes first - completely bypass rate limiting
app.use('/api/admin', adminRouter);

// Regular API routes with rate limiting  
app.use('/api', rateLimiter, apiRouter);

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
