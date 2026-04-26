# 🚀 Production Deployment Guide

## Quick Deploy (5 minutes)

### 1. **Deploy Backend (Render.com)**

1. Fork this repo to your GitHub
2. Go to [render.com](https://render.com) → "New Web Service"
3. Connect your GitHub repo
4. Select `anon-chat/server` folder
5. Set these environment variables in Render dashboard:
   ```
   CLIENT_URL=https://your-app.vercel.app
   ADMIN_KEY=your-super-secret-admin-key-here
   ```
6. Deploy! Note your backend URL (e.g., `https://your-app.onrender.com`)

### 2. **Deploy Frontend (Vercel)**

1. Go to [vercel.com](https://vercel.com) → "New Project"
2. Import your GitHub repo
3. Set Root Directory to `anon-chat/client`
4. Add environment variable:
   ```
   VITE_SERVER_URL=https://your-backend.onrender.com
   ```
5. Deploy! Your app is live at `https://your-app.vercel.app`

### 3. **Update Backend URL**

Go back to Render dashboard and update:
```
CLIENT_URL=https://your-app.vercel.app
```

## ✅ Post-Deployment Checklist

- [ ] Test chat functionality
- [ ] Test room creation with password
- [ ] Test image upload
- [ ] Check admin API: `GET /api/admin/stats` with Bearer token
- [ ] Test DDoS protection: `node test-ddos.js`
- [ ] Update privacy policy with your contact email
- [ ] Update terms of service with your jurisdiction

## 🔧 Advanced Configuration

### Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add your domain (e.g., `chat.yourdomain.com`)
3. Update DNS records as instructed

**Render:**
1. Go to Service Settings → Custom Domains
2. Add your API domain (e.g., `api.yourdomain.com`)

### SSL/HTTPS

Both Vercel and Render provide free SSL certificates automatically.

### Environment Variables

**Production Backend (.env):**
```bash
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
ADMIN_KEY=your-super-secret-key-minimum-32-chars
PORT=3001

# Security (optional - defaults are good)
MAX_CONNECTIONS_PER_IP=5
MAX_VIOLATIONS_BEFORE_BAN=10
BAN_DURATION_MINUTES=60
MESSAGE_RATE_LIMIT=30
MESSAGE_RATE_WINDOW_SECONDS=10
```

**Production Frontend (.env.local):**
```bash
VITE_SERVER_URL=https://your-backend-domain.com
```

## 🛡️ Security Hardening

### 1. **Enable Cloudflare (Recommended)**

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers
4. Enable "Under Attack Mode" if needed
5. Set Security Level to "High"

### 2. **Monitor Your App**

Check these endpoints regularly:
```bash
# Health check
curl https://your-backend.com/api/health

# Admin stats (replace with your ADMIN_KEY)
curl https://your-backend.com/api/admin/stats \
  -H "Authorization: Bearer your-admin-key"
```

### 3. **Backup Strategy**

Since the app is stateless, just backup:
- Your source code (already on GitHub)
- Environment variables (save securely)
- Domain/DNS settings

## 🚨 Emergency Response

If under attack:

1. **Enable Cloudflare "Under Attack Mode"**
2. **Check admin stats**: `GET /api/admin/stats`
3. **Ban attacking IPs**: `POST /api/admin/ban-ip`
4. **Restart services** if needed

## 📊 Monitoring

### Server Logs (Render)
```bash
# View live logs
render logs -s your-service-name -f
```

### Performance Monitoring
- Render provides basic metrics
- Vercel provides analytics
- Consider adding Sentry for error tracking

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Render and Vercel auto-deploy from main branch
3. Test functionality after each update

## 💰 Costs

**Free Tier Limits:**
- **Render Free:** 750 hours/month, sleeps after 15min inactivity
- **Vercel Hobby:** 100GB bandwidth, unlimited requests

**Paid Upgrades:**
- **Render Starter ($7/month):** No sleep, better performance
- **Vercel Pro ($20/month):** More bandwidth, better support

## 🆘 Troubleshooting

**Common Issues:**

1. **CORS Error:** Check CLIENT_URL matches exactly
2. **WebSocket Connection Failed:** Ensure backend is running
3. **Admin API 501:** Set ADMIN_KEY environment variable
4. **Rate Limited:** Normal behavior, wait or adjust limits

**Debug Commands:**
```bash
# Test backend health
curl https://your-backend.com/api/health

# Test WebSocket (in browser console)
const socket = io('https://your-backend.com');
socket.on('connect', () => console.log('Connected!'));
```

## 📞 Support

Need help? Check:
1. [Render Documentation](https://render.com/docs)
2. [Vercel Documentation](https://vercel.com/docs)
3. GitHub Issues on this repo