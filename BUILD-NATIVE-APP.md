# 📱 Build Native App cho Google Play & App Store

Hướng dẫn wrap web Nope thành native app để publish lên Google Play Store và Apple App Store.

---

## 🎯 Chọn phương pháp

### **Khuyên dùng: Capacitor** ⭐
- ✅ Dễ setup, maintain
- ✅ Hỗ trợ native features (camera, notifications, etc.)
- ✅ Performance tốt
- ✅ Cộng đồng lớn
- ❌ Cần Mac để build iOS

### **Thay thế: React Native WebView**
- ✅ Full control
- ❌ Phức tạp hơn
- ❌ Cần viết thêm code native

---

## 🚀 Phương pháp 1: Capacitor (Khuyên dùng)

### **Bước 1: Cài đặt Capacitor**

```bash
cd anon-chat/client

# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init "Nope" "com.yennhie.nope" --web-dir=dist
```

### **Bước 2: Build web app**

```bash
npm run build
```

### **Bước 3: Add platforms**

```bash
# Add Android
npx cap add android

# Add iOS (chỉ trên Mac)
npx cap add ios
```

### **Bước 4: Sync code**

```bash
npx cap sync
```

### **Bước 5: Cấu hình**

Sửa file `capacitor.config.json`:

```json
{
  "appId": "com.yennhie.nope",
  "appName": "Nope",
  "webDir": "dist",
  "server": {
    "url": "https://nhie.yennhie.site",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0a0b0f",
      "showSpinner": false
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

### **Bước 6: Build Android APK**

```bash
# Open Android Studio
npx cap open android

# Trong Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Chọn APK hoặc AAB (cho Play Store)
# 3. Create keystore (lần đầu)
# 4. Build Release
```

**Tạo Keystore:**
```bash
keytool -genkey -v -keystore nope-release.keystore -alias nope -keyalg RSA -keysize 2048 -validity 10000
```

### **Bước 7: Build iOS (trên Mac)**

```bash
# Open Xcode
npx cap open ios

# Trong Xcode:
# 1. Chọn team (Apple Developer Account)
# 2. Product → Archive
# 3. Distribute App → App Store Connect
```

---

## 📦 Phương pháp 2: PWABuilder (Nhanh nhất)

Nếu không muốn code, dùng PWABuilder:

### **Bước 1: Truy cập PWABuilder**
https://www.pwabuilder.com/

### **Bước 2: Nhập URL**
```
https://nhie.yennhie.site
```

### **Bước 3: Generate packages**
- Chọn Android → Download APK
- Chọn iOS → Download package

### **Bước 4: Upload lên stores**
- Google Play Console
- Apple App Store Connect

**Ưu điểm:**
- ✅ Không cần code
- ✅ Nhanh (5-10 phút)

**Nhược điểm:**
- ❌ Ít control
- ❌ Không có native features

---

## 🎨 Chuẩn bị Assets

### **Icons cần thiết:**

**Android:**
- 512x512 PNG (Play Store listing)
- 192x192 PNG (launcher icon)
- 96x96 PNG (notification icon)

**iOS:**
- 1024x1024 PNG (App Store)
- 180x180 PNG (iPhone)
- 167x167 PNG (iPad)

**Tạo icons:**
```bash
# Dùng tool online:
# https://icon.kitchen/
# https://appicon.co/

# Hoặc ImageMagick:
convert avatar.png -resize 512x512 icon-512.png
convert avatar.png -resize 192x192 icon-192.png
```

### **Screenshots:**

**Android:**
- 1080x1920 (phone)
- 1200x1920 (tablet)
- Tối thiểu 2 ảnh

**iOS:**
- 1242x2688 (iPhone 11 Pro Max)
- 2048x2732 (iPad Pro)
- Tối thiểu 3 ảnh

**Chụp screenshots:**
- Dùng Chrome DevTools → Device Mode
- Hoặc dùng tool: https://screenshots.pro/

---

## 📝 Publish lên Stores

### **Google Play Store**

**Yêu cầu:**
- Google Play Developer Account ($25 một lần)
- APK hoặc AAB file
- Icons, screenshots
- Privacy policy URL

**Bước publish:**

1. **Tạo app mới:**
   - https://play.google.com/console
   - Create app → Fill info

2. **Upload APK/AAB:**
   - Production → Create release
   - Upload file
   - Fill release notes

3. **Store listing:**
   - App name: "Nope - Anonymous Chat"
   - Short description: "Anonymous E2E encrypted chat"
   - Full description: (xem template bên dưới)
   - Screenshots, icons
   - Category: Communication
   - Content rating: Fill questionnaire

4. **Privacy policy:**
   - URL: `https://nhie.yennhie.site/privacy.html`

5. **Submit for review:**
   - Review takes 1-7 days

### **Apple App Store**

**Yêu cầu:**
- Apple Developer Account ($99/năm)
- Mac với Xcode
- IPA file
- Icons, screenshots

**Bước publish:**

1. **App Store Connect:**
   - https://appstoreconnect.apple.com/
   - My Apps → + → New App

2. **Fill info:**
   - Name: "Nope - Anonymous Chat"
   - Bundle ID: com.yennhie.nope
   - SKU: nope-chat-001

3. **Upload build:**
   - Xcode → Archive → Upload to App Store

4. **Store listing:**
   - Screenshots, description
   - Privacy policy URL
   - Age rating

5. **Submit for review:**
   - Review takes 1-3 days
   - Có thể bị reject nếu:
     - Thiếu privacy policy
     - App chỉ là web wrapper (cần thêm native features)
     - Nội dung không phù hợp

---

## 📄 Store Listing Templates

### **Short Description (80 chars):**
```
Anonymous E2E encrypted chat. No account. No trace. Privacy first.
```

### **Full Description:**

```
🔒 NOPE - ANONYMOUS CHAT

Chat ẩn danh với mã hóa đầu cuối (E2EE). Không cần tài khoản, không lưu vết.

✨ TÍNH NĂNG:

• 🔐 Mã hóa E2E (ECDH P-256 + AES-GCM)
• 👻 Hoàn toàn ẩn danh
• 💨 Tin nhắn tự xóa sau 24h
• 🚫 Không cần đăng ký
• 📱 Gửi ảnh, file, emoji
• 🔗 Tạo phòng riêng với mật khẩu
• 🌐 Phòng chat công khai
• ⚡ Real-time messaging
• 🎨 Giao diện đẹp, nhiều theme

🛡️ BẢO MẬT:

• Server không đọc được tin nhắn
• Không lưu logs
• Không tracking
• Open source

🎯 CÁCH DÙNG:

1. Chọn nickname (hoặc random)
2. Vào Global Room hoặc tạo phòng riêng
3. Chia sẻ link với bạn bè
4. Chat an toàn!

📞 HỖ TRỢ:
Email: honguyenhung2010@gmail.com
Website: https://nhie.yennhie.site

Privacy Policy: https://nhie.yennhie.site/privacy.html
Terms: https://nhie.yennhie.site/terms.html
```

---

## ⚠️ Lưu ý quan trọng

### **Apple App Store:**

1. **Guideline 4.2 - Minimum Functionality:**
   - App không được chỉ là web wrapper
   - Cần thêm native features:
     - Push notifications
     - Camera integration
     - Biometric authentication
     - Offline mode

2. **Cách pass review:**
   - Thêm Capacitor plugins:
     ```bash
     npm install @capacitor/push-notifications
     npm install @capacitor/camera
     npm install @capacitor/local-notifications
     ```
   - Implement native features
   - Tối ưu performance

### **Google Play Store:**

1. **Dễ pass hơn Apple**
2. **Cần:**
   - Privacy policy
   - Content rating
   - Target API level 33+

---

## 🔧 Troubleshooting

**Build Android failed?**
```bash
# Update Gradle
cd android
./gradlew wrapper --gradle-version=8.0

# Clean build
./gradlew clean
```

**iOS build failed?**
- Check provisioning profile
- Update Xcode
- Check bundle ID

**App rejected?**
- Read rejection reason carefully
- Add requested features
- Resubmit with explanation

---

## 💰 Chi phí

- **Google Play:** $25 (một lần)
- **Apple App Store:** $99/năm
- **Total năm đầu:** $124
- **Năm sau:** $99/năm

---

## 🎯 Timeline ước tính

- Setup Capacitor: 2-4 giờ
- Build & test: 2-3 giờ
- Prepare assets: 1-2 giờ
- Submit to stores: 1 giờ
- **Review time:**
  - Google Play: 1-7 ngày
  - Apple: 1-3 ngày

**Total: ~1-2 tuần** (bao gồm review)

---

## 📚 Resources

- Capacitor Docs: https://capacitorjs.com/
- PWABuilder: https://www.pwabuilder.com/
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com/
- Icon Generator: https://icon.kitchen/
- Screenshot Tool: https://screenshots.pro/

---

**Good luck! 🚀**
