# 👻 AnonChat

Anonymous, end-to-end encrypted real-time chat. No accounts. No logs. Messages vanish.

---

## Quick Start (Local)

```bash
# 1. Clone / open the project, then:
cd anon-chat

# 2. Double-click start.bat  (Windows)
#    OR run manually:

# Terminal 1 — Backend
cd server && npm install && cp .env.example .env && npm run dev

# Terminal 2 — Frontend
cd client && npm install && cp .env.example .env && npm run dev
```

Open **http://localhost:5173**

---

## Deploy to Production

### Step 1 — Backend → Render.com (free)

1. Push the `anon-chat/server/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Settings:
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Environment**: Node
5. Add environment variable:
   - `CLIENT_URL` = `https://your-app.vercel.app` *(fill in after step 2)*
6. Deploy → copy the Render URL (e.g. `https://anon-chat-api.onrender.com`)

### Step 2 — Frontend → Vercel (free)

1. Push the `anon-chat/client/` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework: **Vite**
4. Add environment variable:
   - `VITE_SERVER_URL` = your Render URL from Step 1
5. Deploy → copy the Vercel URL
6. Go back to Render → update `CLIENT_URL` to the Vercel URL → redeploy

---

## Architecture

```
Client A                         Server (relay only)                Client B
  │                                      │                               │
  ├─ Generate ECDH P-256 KeyPair         │                               │
  ├─ join_room + publicKey ─────────────►│                               │
  │                                      ├─ user_joined + publicKey ────►│
  │◄─ user_joined + publicKey ───────────┤                               │
  │                                      │                               │
  ├─ deriveSharedKey(B.pubKey)           │          deriveSharedKey(A.pubKey)
  │                                      │                               │
  ├─ AES-GCM encrypt(msg) ─────────────►│──── relay encrypted blob ────►│
  │                                      │    (server cannot read)       ├─ decrypt(blob)
```

- Text: **ECDH P-256** key exchange → **AES-GCM 256-bit** per-room key (PBKDF2 600k iterations)
- Images: base64, relayed as-is, stored only in RAM
- Server stores nothing permanently — all data lives in memory, expires after 24h

---

## Scale-out with Redis

Uncomment the Redis adapter block in `server/src/index.js` and set `REDIS_URL` in `.env`.
Allows running multiple server instances behind a load balancer.
