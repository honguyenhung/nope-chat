# 📱 Cài đặt Nope như App trên điện thoại

Web Nope đã hỗ trợ PWA (Progressive Web App) - có thể cài đặt như app native trên điện thoại!

## ✨ Tính năng khi cài app:

- 🚀 Mở nhanh từ home screen
- 📴 Hoạt động offline (cache cơ bản)
- 🎨 Giao diện fullscreen (không có thanh địa chỉ)
- 🔔 Nhận thông báo (nếu bật)
- ⚡ Tốc độ nhanh hơn

---

## 📲 Hướng dẫn cài đặt

### **Android (Chrome/Edge)**

1. Mở web: `https://nhie.yennhie.site`
2. Nhấn vào menu **⋮** (3 chấm) ở góc trên
3. Chọn **"Add to Home screen"** hoặc **"Install app"**
4. Nhấn **"Install"** hoặc **"Add"**
5. App sẽ xuất hiện trên home screen! 🎉

**Hoặc:**
- Popup cài đặt sẽ tự động hiện sau vài giây
- Nhấn **"Install"** trong popup

### **iPhone/iPad (Safari)**

1. Mở web: `https://nhie.yennhie.site`
2. Nhấn nút **Share** (biểu tượng chia sẻ) ở dưới cùng
3. Cuộn xuống và chọn **"Add to Home Screen"**
4. Đặt tên (mặc định: "Nope")
5. Nhấn **"Add"** ở góc trên phải
6. App sẽ xuất hiện trên home screen! 🎉

**Lưu ý iOS:**
- Phải dùng Safari (không phải Chrome)
- iOS 11.3 trở lên

### **Desktop (Chrome/Edge)**

1. Mở web: `https://nhie.yennhie.site`
2. Nhấn icon **⊕** (Install) ở thanh địa chỉ
3. Hoặc menu **⋮** → **"Install Nope"**
4. Nhấn **"Install"**
5. App sẽ mở như ứng dụng độc lập!

---

## 🔧 Gỡ cài đặt

### Android:
- Giữ icon app → **"Uninstall"** hoặc **"Remove"**

### iPhone:
- Giữ icon app → **"Remove App"** → **"Delete App"**

### Desktop:
- Mở app → Menu **⋮** → **"Uninstall Nope"**

---

## ❓ Troubleshooting

**Không thấy nút "Add to Home Screen"?**
- Đảm bảo đang dùng HTTPS (không phải HTTP)
- Thử reload trang (F5)
- Xóa cache và thử lại

**App không hoạt động offline?**
- Service Worker cần thời gian để cache
- Mở app lần đầu cần internet
- Sau đó sẽ hoạt động offline (giới hạn)

**Popup cài đặt không hiện?**
- Có thể đã dismiss trước đó
- Xóa localStorage: `localStorage.removeItem('install_prompt_dismissed')`
- Hoặc cài thủ công qua menu

---

## 🎯 Shortcuts

Sau khi cài app, bạn có thể:
- Long press icon → **"Global Room"** để vào phòng global nhanh

---

## 🛠️ Technical Details

- **Manifest**: `/manifest.json`
- **Service Worker**: `/sw.js`
- **Cache Strategy**: Network first, fallback to cache
- **Offline**: Basic HTML/CSS/JS cached
- **Icons**: 512x512 PNG + SVG

---

**Enjoy chatting! 🚀**
