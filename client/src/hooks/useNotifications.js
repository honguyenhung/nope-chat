import { useEffect, useRef, useCallback } from 'react';

// Tạo âm thanh ping nhỏ bằng Web Audio API (không cần file)
function createPingSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

export function useNotifications() {
  const permissionRef = useRef(Notification.permission);

  useEffect(() => {
    if (permissionRef.current === 'default') {
      Notification.requestPermission()
        .then((p) => { permissionRef.current = p; })
        .catch(() => { permissionRef.current = 'denied'; });
    }
  }, []);

  const notify = useCallback((title, body) => {
    // Âm thanh ping khi có tin nhắn mới (kể cả khi tab đang active)
    createPingSound();

    // Push notification chỉ khi tab ẩn
    if (document.visibilityState === 'visible') return;
    if (permissionRef.current !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/avatar.png',
      silent: true, // Dùng âm thanh custom thay vì system sound
    });
    setTimeout(() => n.close(), 4000);
    n.onclick = () => { window.focus(); n.close(); };
  }, []);

  return { notify };
}
