import { useEffect, useRef } from 'react';

// Updates browser tab title with unread count + restores on focus
export function useDocTitle(roomName, unreadCount) {
  const baseTitle = roomName ? `${roomName} — AnonChat` : 'AnonChat';

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;
  }, [unreadCount, baseTitle]);

  // Restore title and clear unread when tab is focused
  useEffect(() => {
    function onFocus() {
      document.title = baseTitle;
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [baseTitle]);
}
