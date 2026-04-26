import { useEffect, useRef, useCallback } from 'react';

// Web Notifications API — asks permission once, then fires on new messages
export function useNotifications() {
  const permissionRef = useRef(Notification.permission);

  useEffect(() => {
    if (permissionRef.current === 'default') {
      Notification.requestPermission()
        .then((p) => {
          permissionRef.current = p;
        })
        .catch((err) => {
          console.warn('Notification permission request failed:', err);
          permissionRef.current = 'denied';
        });
    }
  }, []);

  const notify = useCallback((title, body) => {
    // Only notify when tab is hidden
    if (document.visibilityState === 'visible') return;
    if (permissionRef.current !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/ghost.svg',
      silent: false,
    });
    // Auto-close after 4s
    setTimeout(() => n.close(), 4000);
    n.onclick = () => { window.focus(); n.close(); };
  }, []);

  return { notify };
}
