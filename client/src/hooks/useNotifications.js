import { useEffect, useRef, useCallback, useState } from 'react';

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
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Load sound preference from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (permissionRef.current === 'default') {
      Notification.requestPermission()
        .then((p) => { permissionRef.current = p; })
        .catch(() => { permissionRef.current = 'denied'; });
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('soundEnabled', String(newValue));
      return newValue;
    });
  }, []);

  const notify = useCallback((title, body) => {
    // Âm thanh ping khi có tin nhắn mới (nếu bật)
    if (soundEnabled) {
      createPingSound();
    }

    // Push notification chỉ khi tab ẩn
    if (document.visibilityState === 'visible') return;
    if (typeof Notification === 'undefined') return;
    if (permissionRef.current !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/avatar.png',
      silent: true,
    });
    setTimeout(() => n.close(), 4000);
    n.onclick = () => { window.focus(); n.close(); };
  }, [soundEnabled]);

  return { notify, soundEnabled, toggleSound };
}
