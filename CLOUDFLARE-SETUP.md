# 🛡️ Hướng Dẫn Setup Cloudflare - Bảo Mật Tối Đa

## 📋 Mục Lục
1. [Tại Sao Cần Cloudflare](#tại-sao-cần-cloudflare)
2. [Đăng Ký & Cấu Hình DNS](#đăng-ký--cấu-hình-dns)
3. [Bật Chế Độ Proxy (Ẩn IP Server)](#bật-chế-độ-proxy-ẩn-ip-server)
4. [Cấu Hình SSL/TLS](#cấu-hình-ssltls)
5. [Bật DDoS Protection](#bật-ddos-protection)
6. [Cấu Hình Firewall Rules](#cấu-hình-firewall-rules)
7. [Rate Limiting (Giới Hạn Request)](#rate-limiting-giới-hạn-request)
8. [Bot Protection](#bot-protection)
9. [Page Rules (Tối Ưu Hiệu Suất)](#page-rules-tối-ưu-hiệu-suất)
10. [Security Headers](#security-headers)
11. [Kiểm Tra & Giám Sát](#kiểm-tra--giám-sát)

---

## 🎯 Tại Sao Cần Cloudflare

Cloudflare cung cấp **MIỄN PHÍ**:
- ✅ **DDoS Protection** - Chặn tấn công DDoS tự động
- ✅ **Ẩn IP Server** - Hacker không thể tấn công trực tiếp server
- ✅ **WAF (Web Application Firewall)** - Chặn SQL injection, XSS, etc.
- ✅ **Bot Protection** - Chặn bot độc hại
- ✅ **Rate Limiting** - Giới hạn số request từ 1 IP
- ✅ **SSL/TLS** - HTTPS miễn phí
- ✅ **CDN** - Tăng tốc độ load trang
- ✅ **Analytics** - Theo dõi traffic & tấn công

---

## 🚀 Đăng Ký & Cấu Hình DNS

### Bước 1: Tạo Tài Khoản Cloudflare
1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký với email của bạn
3. Xác nhận email

### Bước 2: Thêm Website
1. Click **"Add a Site"**
2. Nhập domain của bạn (ví dụ: `anonchat.com`)
3. Chọn **Free Plan** (đủ dùng)
4. Click **"Continue"**

### Bước 3: Cấu Hình DNS Records
Cloudflare sẽ tự động quét DNS records hiện tại. Bạn cần thêm/sửa:

```
Type    Name    Content                 Proxy Status
A       @       YOUR_SERVER_IP          Proxied (🟠)
A       www     YOUR_SERVER_IP          Proxied (🟠)
```

**⚠️ QUAN TRỌNG**: Phải bật **Proxied** (biểu tượng mây màu cam 🟠) để ẩn IP server!

### Bước 4: Đổi Nameservers
1. Cloudflare sẽ cho bạn 2 nameservers, ví dụ:
   ```
   ava.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
2. Đăng nhập vào nhà cung cấp domain (GoDaddy, Namecheap, etc.)
3. Tìm mục **"Nameservers"** hoặc **"DNS Management"**
4. Đổi nameservers sang 2 nameservers của Cloudflare
5. Chờ 5-30 phút để DNS cập nhật

---

## 🔒 Bật Chế Độ Proxy (Ẩn IP Server)

### Kiểm Tra Proxy Status
1. Vào **DNS** tab
2. Đảm bảo tất cả A records có biểu tượng **🟠 Proxied**
3. Nếu thấy **⚪ DNS only**, click vào để đổi sang **Proxied**

### Kiểm Tra IP Đã Ẩn Chưa
```bash
# Trước khi dùng Cloudflare
ping anonchat.com
# → Hiện IP server thật (VD: 123.45.67.89)

# Sau khi dùng Cloudflare
ping anonchat.com
# → Hiện IP của Cloudflare (VD: 104.21.x.x hoặc 172.67.x.x)
```

✅ Nếu thấy IP Cloudflare → Server đã được ẩn!

---

## 🔐 Cấu Hình SSL/TLS

### Bước 1: Chọn Chế Độ SSL
1. Vào **SSL/TLS** tab
2. Chọn **"Full (strict)"** (khuyến nghị)
   - **Off**: Không SSL (không an toàn)
   - **Flexible**: SSL giữa user ↔ Cloudflare (không khuyến nghị)
   - **Full**: SSL giữa user ↔ Cloudflare ↔ server
   - **Full (strict)**: SSL + xác thực certificate (an toàn nhất)

### Bước 2: Bật Always Use HTTPS
1. Vào **SSL/TLS** → **Edge Certificates**
2. Bật **"Always Use HTTPS"**
3. Bật **"Automatic HTTPS Rewrites"**

### Bước 3: Cài SSL Certificate Trên Server
Nếu server chưa có SSL:
```bash
# Sử dụng Certbot (Let's Encrypt)
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d anonchat.com -d www.anonchat.com
```

---

## 🛡️ Bật DDoS Protection

Cloudflare tự động bật DDoS protection, nhưng bạn có thể tăng cường:

### Bước 1: Bật "Under Attack Mode" (Khi Bị Tấn Công)
1. Vào **Overview** tab
2. Tìm **"Quick Actions"**
3. Bật **"Under Attack Mode"**
   - User sẽ thấy màn hình "Checking your browser" 5 giây
   - Chặn hầu hết bot & DDoS

### Bước 2: Cấu Hình Security Level
1. Vào **Security** → **Settings**
2. Đặt **Security Level** = **High** hoặc **I'm Under Attack**
   - **Off**: Không chặn gì
   - **Essentially Off**: Chỉ chặn threat score rất cao
   - **Low**: Chặn threat score > 25
   - **Medium**: Chặn threat score > 15
   - **High**: Chặn threat score > 0 (khuyến nghị)
   - **I'm Under Attack**: Chặn tất cả, hiện challenge

---

## 🔥 Cấu Hình Firewall Rules

### Rule 1: Chặn Các Quốc Gia Nguy Hiểm (Tùy Chọn)
1. Vào **Security** → **WAF** → **Firewall rules**
2. Click **"Create rule"**
3. Cấu hình:
   ```
   Rule name: Block High-Risk Countries
   
   When incoming requests match:
   - Country is in: [Chọn các nước bạn muốn chặn]
   
   Then take action: Block
   ```

### Rule 2: Chặn User-Agent Độc Hại
```
Rule name: Block Bad Bots

When incoming requests match:
- User Agent contains: "curl"
- OR User Agent contains: "wget"
- OR User Agent contains: "python"
- OR User Agent contains: "scrapy"

Then take action: Block
```

### Rule 3: Chặn Request Không Có Referer (Chống Bot)
```
Rule name: Block No Referer

When incoming requests match:
- Referer does not contain: "anonchat.com"
- AND URI Path contains: "/api/"

Then take action: Challenge (Managed Challenge)
```

### Rule 4: Chặn SQL Injection & XSS
```
Rule name: Block SQL Injection

When incoming requests match:
- URI contains: "SELECT"
- OR URI contains: "UNION"
- OR URI contains: "<script"
- OR URI contains: "javascript:"
- OR URI contains: "eval("

Then take action: Block
```

### Rule 5: Giới Hạn Request Đến API
```
Rule name: Rate Limit API

When incoming requests match:
- URI Path contains: "/api/"

Then take action: Rate Limit
- Requests: 100 per 1 minute
- Action: Block for 1 hour
```

---

## ⏱️ Rate Limiting (Giới Hạn Request)

### Cấu Hình Rate Limiting
1. Vào **Security** → **WAF** → **Rate limiting rules**
2. Click **"Create rule"**

### Rule 1: Giới Hạn Toàn Bộ Website
```
Rule name: Global Rate Limit

When incoming requests match:
- All incoming requests

Then take action: Rate Limit
- Requests: 300 per 5 minutes
- Action: Block for 10 minutes
- With response code: 429
```

### Rule 2: Giới Hạn Login/Register
```
Rule name: Auth Rate Limit

When incoming requests match:
- URI Path equals: "/api/auth/login"
- OR URI Path equals: "/api/auth/register"

Then take action: Rate Limit
- Requests: 5 per 1 minute
- Action: Block for 30 minutes
```

### Rule 3: Giới Hạn WebSocket
```
Rule name: WebSocket Rate Limit

When incoming requests match:
- URI Path contains: "/socket.io/"

Then take action: Rate Limit
- Requests: 50 per 1 minute
- Action: Block for 5 minutes
```

---

## 🤖 Bot Protection

### Bước 1: Bật Bot Fight Mode (Free Plan)
1. Vào **Security** → **Bots**
2. Bật **"Bot Fight Mode"**
   - Tự động chặn bot độc hại
   - Không ảnh hưởng đến user thật

### Bước 2: Cấu Hình Challenge
1. Vào **Security** → **Settings**
2. Chọn **Challenge Passage**: 30 minutes
   - User chỉ cần verify 1 lần trong 30 phút

---

## 📏 Page Rules (Tối Ưu Hiệu Suất)

### Rule 1: Cache Static Files
1. Vào **Rules** → **Page Rules**
2. Click **"Create Page Rule"**
```
URL: anonchat.com/assets/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
```

### Rule 2: Bypass Cache Cho API
```
URL: anonchat.com/api/*

Settings:
- Cache Level: Bypass
```

### Rule 3: Bật Security Cho Admin
```
URL: anonchat.com/admin*

Settings:
- Security Level: I'm Under Attack
- Browser Integrity Check: On
```

---

## 🔐 Security Headers

### Bật Security Headers
1. Vào **Security** → **Settings**
2. Bật các tùy chọn sau:

```
✅ Browser Integrity Check
   → Chặn browser giả mạo

✅ Challenge Passage: 30 minutes
   → User verify 1 lần/30 phút

✅ Privacy Pass Support
   → Giảm số lần verify cho user thật
```

### Thêm Custom Headers (Transform Rules)
1. Vào **Rules** → **Transform Rules** → **Modify Response Header**
2. Thêm các headers sau:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 📊 Kiểm Tra & Giám Sát

### 1. Kiểm Tra SSL
```bash
# Kiểm tra SSL certificate
curl -I https://anonchat.com

# Hoặc dùng online tool
https://www.ssllabs.com/ssltest/analyze.html?d=anonchat.com
```

### 2. Kiểm Tra DDoS Protection
```bash
# Test rate limiting
for i in {1..100}; do curl https://anonchat.com; done

# Nếu bị chặn → Rate limiting hoạt động ✅
```

### 3. Kiểm Tra IP Đã Ẩn
```bash
# Kiểm tra IP hiện tại
nslookup anonchat.com

# Nếu thấy IP Cloudflare (104.x.x.x hoặc 172.67.x.x) → Đã ẩn ✅
```

### 4. Xem Analytics
1. Vào **Analytics & Logs** → **Traffic**
2. Xem:
   - Total requests
   - Blocked requests
   - Countries
   - Top paths

### 5. Xem Security Events
1. Vào **Security** → **Events**
2. Xem các request bị chặn:
   - IP bị chặn
   - Lý do chặn
   - Firewall rule nào chặn

---

## 🎯 Checklist Hoàn Thành

Sau khi setup xong, kiểm tra:

- [ ] DNS đã trỏ về Cloudflare (nameservers đã đổi)
- [ ] Proxy status = **Proxied** (🟠)
- [ ] SSL/TLS = **Full (strict)**
- [ ] Always Use HTTPS = **Bật**
- [ ] Security Level = **High**
- [ ] Bot Fight Mode = **Bật**
- [ ] Firewall Rules đã tạo (ít nhất 3-5 rules)
- [ ] Rate Limiting đã cấu hình
- [ ] Page Rules đã tạo (cache static files)
- [ ] Security Headers đã thêm
- [ ] IP server đã ẩn (ping domain thấy IP Cloudflare)

---

## 🚨 Khi Bị Tấn Công DDoS

### Bước 1: Bật "Under Attack Mode"
1. Vào **Overview**
2. Bật **"I'm Under Attack Mode"**
3. User sẽ thấy challenge 5 giây trước khi vào site

### Bước 2: Xem Security Events
1. Vào **Security** → **Events**
2. Xem IP nào đang tấn công
3. Tạo Firewall Rule chặn IP đó:
```
Rule name: Block Attacker IP

When incoming requests match:
- IP Address equals: [IP của attacker]

Then take action: Block
```

### Bước 3: Tăng Rate Limiting
Giảm số request cho phép:
```
- Requests: 50 per 1 minute (thay vì 300)
- Block duration: 1 hour (thay vì 10 minutes)
```

### Bước 4: Liên Hệ Cloudflare Support
Nếu tấn công quá lớn (> 1M requests/phút):
- Email: support@cloudflare.com
- Hoặc chat trực tiếp trong dashboard

---

## 💡 Tips Bổ Sung

### 1. Sử dụng Cloudflare Workers (Nâng Cao)
Tạo custom logic chặn request:
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const ip = request.headers.get('CF-Connecting-IP')
  
  // Chặn IP cụ thể
  if (ip === '123.45.67.89') {
    return new Response('Blocked', { status: 403 })
  }
  
  return fetch(request)
}
```

### 2. Bật Email Alerts
1. Vào **Notifications**
2. Bật alerts cho:
   - DDoS attacks
   - High error rates
   - SSL certificate expiration

### 3. Sử dụng Cloudflare Access (Bảo Vệ Admin)
1. Vào **Zero Trust** → **Access**
2. Tạo policy bảo vệ `/admin`:
   - Chỉ cho phép IP của bạn
   - Hoặc yêu cầu email verification

---

## 📚 Tài Liệu Tham Khảo

- Cloudflare Docs: https://developers.cloudflare.com/
- DDoS Protection: https://www.cloudflare.com/ddos/
- WAF Rules: https://developers.cloudflare.com/waf/
- Rate Limiting: https://developers.cloudflare.com/waf/rate-limiting-rules/

---

## ✅ Kết Luận

Sau khi setup Cloudflare đúng cách, website của bạn sẽ có:

1. ✅ **IP Server Ẩn** → Không ai tấn công trực tiếp được
2. ✅ **DDoS Protection** → Tự động chặn tấn công DDoS
3. ✅ **Rate Limiting** → Giới hạn request từ 1 IP
4. ✅ **Bot Protection** → Chặn bot độc hại
5. ✅ **Firewall Rules** → Chặn SQL injection, XSS, etc.
6. ✅ **SSL/TLS** → HTTPS miễn phí
7. ✅ **Analytics** → Theo dõi traffic & tấn công

**Kết hợp với các biện pháp bảo mật đã implement trong code (rate limiting, IP limiting, payload validation, encryption), website của bạn giờ đã có bảo mật CỰC CAO! 🔒🛡️**

---

**Lưu ý**: Cloudflare Free Plan đã đủ mạnh cho hầu hết website. Nếu cần thêm tính năng (Advanced DDoS, Image Optimization, etc.), có thể nâng cấp lên Pro ($20/tháng) hoặc Business ($200/tháng).
