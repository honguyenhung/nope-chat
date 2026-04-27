# 🚀 QUICK START - BẢO VỆ SOURCE CODE

## ⚡ 5 PHÚT SETUP

### Bước 1: Install Dependencies (Client)

```bash
cd anon-chat/client
npm install
```

### Bước 2: Generate Secure Secrets

```bash
cd ..
node generate-secrets.js
```

Copy output và paste vào `server/.env`

### Bước 3: Test Build Client

```bash
cd client
npm run build:obfuscated
```

Xem kết quả:
```bash
ls -lh dist/assets/*.js
cat dist/assets/index-*.js | head -n 20
# Phải thấy code dạng _0x1a2b3c
```

### Bước 4: Test Docker Server

```bash
cd ..
docker-compose up -d
```

Kiểm tra:
```bash
docker-compose logs -f server
curl http://localhost:3001/health
```

### Bước 5: Deploy

#### Client (Vercel):
```bash
cd client
vercel --prod
```

#### Server (Docker):
```bash
# Đã chạy ở bước 4
docker-compose ps
```

---

## ✅ CHECKLIST

- [ ] Client dependencies installed
- [ ] Secrets generated và paste vào .env
- [ ] Build client thành công
- [ ] Docker container chạy OK
- [ ] Health check pass
- [ ] Deploy client lên Vercel/Netlify
- [ ] Server accessible từ internet

---

## 📚 CHI TIẾT

Xem file `CODE-PROTECTION-GUIDE.md` để biết thêm chi tiết.

---

## 🆘 TROUBLESHOOTING

### "Cannot find module 'javascript-obfuscator'"
```bash
cd client
npm install
```

### "Docker build failed"
```bash
# Check .env exists
ls -la server/.env

# Check Docker running
docker ps
```

### "Port 3001 already in use"
```bash
# Kill process
lsof -ti:3001 | xargs kill -9

# Or use different port in .env
PORT=3002
```

---

## 🎯 KẾT QUẢ

Sau khi hoàn thành:

✅ **Client code:** Obfuscated, khó đọc, khó reverse  
✅ **Server code:** Ẩn trong Docker, không expose  
✅ **Credentials:** Random, secure, trong .env  
✅ **Legal:** License file bảo vệ  

**🏆 CODE CỦA BẠN ĐÃ ĐƯỢC BẢO VỆ!**
