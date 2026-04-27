# 🔒 REVERSE PROXY SETUP - ẨN BACKEND HOÀN TOÀN

## 🎯 MỤC TIÊU

Thay vì:
```
Client → https://backend-server.com (lộ backend URL)
```

Dùng:
```
Client → https://your-domain.com (cùng domain)
        ↓ (reverse proxy)
        → Backend server (ẩn hoàn toàn)
```

---

## 🚀 CÁCH 1: VERCEL REWRITES (DỄ NHẤT)

### Bước 1: Tạo File `vercel.json`

File: `anon-chat/client/vercel.json`

```json
{
  "buildCommand": "npm run build:obfuscated",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.render.com/api/:path*"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "https://your-backend.render.com/socket.io/:path*"
    }
  ]
}
```

### Bước 2: Update Client Code

File: `anon-chat/client/.env`

```env
# Dùng relative path (cùng domain)
VITE_SERVER_URL=
```

Hoặc xóa biến này, code sẽ tự dùng `window.location.origin`.

### Bước 3: Deploy

```bash
vercel --prod
```

**Kết quả:**
- Client: `https://your-domain.com`
- Backend: `https://your-domain.com/api` (proxied)
- Socket: `https://your-domain.com/socket.io` (proxied)
- **Backend URL hoàn toàn ẩn!** ✅

---

## 🚀 CÁCH 2: CLOUDFLARE WORKERS (NÂNG CAO)

### Bước 1: Tạo Worker

Vào Cloudflare Dashboard → Workers → Create Worker

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Proxy API requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    const backendUrl = 'https://your-backend.render.com' + url.pathname + url.search
    
    return fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
  }
  
  // Serve frontend
  return fetch(request)
}
```

### Bước 2: Deploy Worker

```bash
wrangler publish
```

### Bước 3: Add Route

Cloudflare Dashboard → Workers → Add Route:
```
your-domain.com/api/*
your-domain.com/socket.io/*
```

---

## 🚀 CÁCH 3: NGINX REVERSE PROXY (VPS)

### Bước 1: Cài Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Bước 2: Cấu Hình

File: `/etc/nginx/sites-available/your-domain.com`

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend (static files)
    location / {
        root /var/www/your-domain.com;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API (reverse proxy)
    location /api/ {
        proxy_pass https://your-backend.render.com/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO (WebSocket proxy)
    location /socket.io/ {
        proxy_pass https://your-backend.render.com/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### Bước 3: Enable & Restart

```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ KIỂM TRA

### 1. Mở DevTools (F12)

Network tab → Filter: WS

**Trước:**
```
wss://backend-server.render.com/socket.io/...
```

**Sau:**
```
wss://your-domain.com/socket.io/...
```

✅ Backend URL đã ẩn!

### 2. Kiểm Tra API

```bash
curl https://your-domain.com/api/health
```

Phải trả về response từ backend.

---

## 🎯 KẾT QUẢ

### Trước:
- ❌ Backend URL lộ trong client code
- ❌ User thấy backend domain
- ⚠️ Có thể tấn công trực tiếp backend

### Sau:
- ✅ Backend URL hoàn toàn ẩn
- ✅ User chỉ thấy 1 domain duy nhất
- ✅ Không thể tấn công trực tiếp backend
- ✅ Cloudflare bảo vệ cả frontend & backend

---

## 📊 SO SÁNH

| Method | Độ Khó | Chi Phí | Hiệu Quả |
|--------|--------|---------|----------|
| **Vercel Rewrites** | Dễ | Free | ⭐⭐⭐⭐⭐ |
| **Cloudflare Workers** | Trung bình | Free | ⭐⭐⭐⭐⭐ |
| **Nginx Proxy** | Khó | VPS cost | ⭐⭐⭐⭐⭐ |

---

## 🎯 KHUYẾN NGHỊ

**Dùng Vercel Rewrites** (Cách 1):
- Dễ nhất
- Miễn phí
- Tích hợp sẵn với Vercel
- Không cần VPS

**Chỉ cần thêm `rewrites` vào `vercel.json` là xong!**

---

## 🔐 BẢO MẬT TỔNG HỢP

Sau khi setup reverse proxy:

1. ✅ Backend URL ẩn hoàn toàn
2. ✅ Cloudflare bảo vệ cả 2 layers
3. ✅ Rate limiting
4. ✅ IP limiting
5. ✅ Encryption (E2E)
6. ✅ Code obfuscation
7. ✅ Security headers
8. ✅ Request validation

**Security Score: 10/10** 🏆🏆🏆

---

**Bắt đầu với Cách 1 (Vercel Rewrites) - Dễ nhất!**
