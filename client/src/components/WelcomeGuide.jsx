import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HIDE_KEY = 'guide_hidden_until';

export default function WelcomeGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(HIDE_KEY);
    if (!hiddenUntil || Date.now() > Number(hiddenUntil)) {
      setShow(true);
    }
  }, []);

  function closeFor1Hour() {
    localStorage.setItem(HIDE_KEY, Date.now() + 60 * 60 * 1000);
    setShow(false);
  }

  function closePermanent() {
    localStorage.setItem(HIDE_KEY, Date.now() + 365 * 24 * 60 * 60 * 1000);
    setShow(false);
  }

  const steps = [
    { icon: '👤', title: 'Chọn nickname', desc: 'Đặt tên hiển thị hoặc dùng tên ngẫu nhiên. Hoàn toàn ẩn danh, không cần tài khoản.' },
    { icon: '🌐', title: 'Vào Global Room', desc: 'Phòng chat công khai cho tất cả mọi người. Bấm nút "Global" để vào ngay.' },
    { icon: '🔒', title: 'Tạo phòng riêng', desc: 'Tạo phòng chat riêng tư với mã UUID độc nhất. Có thể đặt mật khẩu bảo vệ.' },
    { icon: '🔗', title: 'Chia sẻ phòng', desc: 'Copy link hoặc quét QR code để mời bạn bè vào phòng của bạn.' },
    { icon: '📎', title: 'Gửi file & ảnh', desc: 'Upload ảnh (max 2MB) và file (max 10MB). Kéo thả file vào chat để gửi nhanh.' },
    { icon: '😊', title: 'Tính năng chat', desc: 'Reply tin nhắn, reaction emoji, search, link preview, và bật/tắt âm thanh thông báo.' },
    { icon: '🛡️', title: 'Bảo mật E2EE', desc: 'Mọi tin nhắn đều được mã hóa đầu cuối. Server không đọc được nội dung.' },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ border: '1px solid var(--glass-border)' }}
          >
            {/* Header */}
            <div className="p-6 pb-4 text-center"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3"
                style={{ boxShadow: '0 8px 32px var(--accent-glow)' }}>
                <img src="/avatar.png" alt="Nope" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: 'var(--text-1)' }}>
                Chào mừng đến với <span className="grad-text">Nope Privacy</span>
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                Chat ẩn danh · Bảo mật tuyệt đối · Không lưu vết
              </p>
            </div>

            {/* Steps */}
            <div className="p-6 grid grid-cols-1 gap-3">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'var(--accent-glow)' }}>
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-1)' }}>{step.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Buttons */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={closeFor1Hour}
                className="btn btn-grad w-full py-3"
              >
                ✅ Đã hiểu — Bắt đầu chat!
              </button>
              <button
                onClick={closePermanent}
                className="text-xs text-center py-2 transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-3)' }}
              >
                Không hiện lại nữa
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
