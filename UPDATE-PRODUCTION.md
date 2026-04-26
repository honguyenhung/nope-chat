# Cập Nhật Production với Admin Panel

## Bước 1: Cập nhật Environment Variables trên Render

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Chọn service "nope-chat" (backend)
3. Vào tab **Environment**
4. Thêm các biến môi trường sau:

```
ADMIN_KEY=nope-admin-secret-key-2024
ADMIN_USERNAME=Nhie
ADMIN_PASSWORD=Hungnguyen@1515
CLIENT_URL=https://nhie.yennhie.site
```

## Bước 2: Deploy Code mới

1. Commit và push code mới:
```bash
cd anon-chat
git add .
git commit -m "Add admin panel system"
git push origin main
```

2. Render sẽ tự động deploy lại backend

## Bước 3: Deploy Frontend mới

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project "nope-chat"
3. Vào tab **Deployments**
4. Click **Redeploy** hoặc push code mới sẽ tự động deploy

## Bước 4: Truy cập Admin Panel

- URL: `https://nhie.yennhie.site/admin`
- Username: `Nhie`
- Password: `Hungnguyen@1515`

## Tính năng Admin Panel

✅ **Đã hoàn thành:**
- Đăng nhập admin với username/password
- Dashboard với thống kê real-time
- Ban/Unban IP addresses
- Xem server stats (uptime, memory, connections)
- Session-based authentication với token

🔄 **Có thể mở rộng thêm:**
- Quản lý rooms (xem, xóa rooms)
- Quản lý users (kick, ban users)
- Xem và xóa messages
- Logs và monitoring chi tiết hơn
- Backup và restore data

## Bảo mật

- Chỉ username "Nhie" với password "Hungnguyen@1515" mới truy cập được
- Session token expires sau 24 giờ
- Rate limiting cho admin login
- HTTPS required trong production