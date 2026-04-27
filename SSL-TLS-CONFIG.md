# 🔒 SSL/TLS CONFIGURATION - FIX CVE

## 🎯 VẤN ĐỀ PHÁT HIỆN

Từ SSL scan:
1. ⚠️ **BREACH (CVE-2013-3587)** - HTTP compression
2. ⚠️ **LUCKY13 (CVE-2013-0169)** - Obsolete CBC ciphers

---

## ✅ GIẢI PHÁP

### 1. FIX BREACH (Server-side)

**Đã fix trong code:**
```javascript
// Disable compression
res.setHeader('Content-Encoding', 'identity');
```

**Nếu dùng Nginx:**
```nginx
# Disable gzip for sensitive endpoints
location /api/ {
    gzip off;
}
```

**Nếu dùng Cloudflare:**
1. Dashboard → Speed → Optimization
2. Tắt **"Auto Minify"** cho HTML (giữ CSS/JS)
3. Hoặc tắt **"Brotli"** compression

---

### 2. FIX LUCKY13 (TLS Ciphers)

#### A. Cloudflare (Khuyến Nghị)

Cloudflare tự động dùng modern ciphers. Chỉ cần:

1. Dashboard → SSL/TLS → Edge Certificates
2. **Minimum TLS Version:** TLS 1.2 (hoặc TLS 1.3)
3. **TLS 1.3:** Enable

#### B. Nginx (Nếu Tự Host)

File: `/etc/nginx/sites-available/your-domain.com`

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # SSL/TLS HARDENING - FIX CVE
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    # Only TLS 1.2 and 1.3 (disable TLS 1.0, 1.1)
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Modern cipher suite (no CBC, no weak ciphers)
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    
    # Prefer server ciphers
    ssl_prefer_server_ciphers on;
    
    # DH parameters (4096-bit)
    ssl_dhparam /etc/nginx/dhparam.pem;
    
    # Session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # HSTS (1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Disable compression (BREACH)
    gzip off;
    
    # ... rest of config
}
```

**Generate DH parameters:**
```bash
sudo openssl dhparam -out /etc/nginx/dhparam.pem 4096
```

#### C. Render.com (Hosting Của Bạn)

Render tự động dùng modern TLS. Không cần config gì!

Nhưng có thể thêm headers trong code (đã làm rồi).

---

### 3. FIX BEAST (Bonus)

BEAST đã được mitigated bởi TLS 1.1+, nhưng để chắc:

**Nginx:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;  # Disable TLS 1.0, 1.1
```

**Cloudflare:**
- Minimum TLS Version: TLS 1.2

---

## 🔍 KIỂM TRA SAU KHI FIX

### Test SSL/TLS:

```bash
# Sử dụng testssl.sh
./testssl.sh https://your-domain.com

# Hoặc online tool
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

### Kết Quả Mong Đợi:

```
✅ BREACH: not vulnerable (compression disabled)
✅ LUCKY13: not vulnerable (no CBC ciphers)
✅ BEAST: not vulnerable (TLS 1.2+)
✅ Overall Rating: A+ (SSL Labs)
```

---

## 📊 CIPHER SUITE KHUYẾN NGHỊ

### Modern (TLS 1.3):
```
TLS_AES_128_GCM_SHA256
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
```

### Intermediate (TLS 1.2):
```
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-ECDSA-CHACHA20-POLY1305
ECDHE-RSA-CHACHA20-POLY1305
```

### ❌ KHÔNG DÙNG (Vulnerable):
```
❌ CBC ciphers (LUCKY13)
❌ RC4 (CVE-2013-2566)
❌ 3DES (SWEET32)
❌ Export ciphers (FREAK, LOGJAM)
❌ NULL ciphers
❌ Anonymous ciphers
```

---

## 🎯 CLOUDFLARE SETUP (DỄ NHẤT)

### Bước 1: SSL/TLS Settings

Dashboard → SSL/TLS:
- **SSL/TLS encryption mode:** Full (strict)
- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** Enabled
- **Automatic HTTPS Rewrites:** On
- **Always Use HTTPS:** On

### Bước 2: Edge Certificates

Dashboard → SSL/TLS → Edge Certificates:
- **Disable Universal SSL:** Off (keep it on)
- **TLS 1.3:** On
- **Minimum TLS Version:** TLS 1.2

### Bước 3: Disable Compression

Dashboard → Speed → Optimization:
- **Auto Minify:** Off (hoặc chỉ CSS/JS, không HTML)
- **Brotli:** Off (cho sensitive pages)

---

## ✅ CHECKLIST

### Server-side:
- [x] Disable HTTP compression (BREACH)
- [x] Add security headers
- [ ] Configure TLS 1.2+ only (Cloudflare/Nginx)
- [ ] Use modern cipher suite (no CBC)

### Cloudflare:
- [ ] Minimum TLS: 1.2
- [ ] TLS 1.3: Enabled
- [ ] Disable compression for sensitive pages
- [ ] HSTS: Enabled

### Testing:
- [ ] Run testssl.sh
- [ ] Check SSL Labs (A+ rating)
- [ ] Verify no CBC ciphers
- [ ] Verify compression disabled

---

## 🏆 KẾT QUẢ

### Trước:
- ⚠️ BREACH: potentially vulnerable
- ⚠️ LUCKY13: potentially vulnerable
- ⚠️ BEAST: vulnerable (mitigated)

### Sau:
- ✅ BREACH: not vulnerable
- ✅ LUCKY13: not vulnerable
- ✅ BEAST: not vulnerable
- ✅ SSL Labs Rating: A+

---

## 📚 TÀI LIỆU THAM KHẢO

- Mozilla SSL Configuration Generator: https://ssl-config.mozilla.org/
- SSL Labs Best Practices: https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices
- Cloudflare SSL/TLS: https://developers.cloudflare.com/ssl/
- OWASP TLS Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html

---

**🔒 QUAN TRỌNG:**

Nếu bạn đang dùng **Cloudflare + Render**, chỉ cần:
1. ✅ Code đã fix (disable compression)
2. ✅ Cloudflare: Minimum TLS 1.2, TLS 1.3 enabled
3. ✅ Render tự động dùng modern ciphers

**→ KHÔNG CẦN CONFIG NGINX!**

Cloudflare đã handle hết SSL/TLS cho bạn rồi! 🎉
