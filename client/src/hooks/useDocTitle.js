import { useEffect } from 'react';

const APP_NAME = 'Nope Privacy';

export function useDocTitle(roomName, unreadCount) {
  const baseTitle = roomName ? `${roomName} — ${APP_NAME}` : APP_NAME;

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;

    // Reset về tên app khi unmount (rời khỏi room)
    return () => { document.title = APP_NAME; };
  }, [unreadCount, baseTitle]);

  useEffect(() => {
    function onFocus() { document.title = baseTitle; }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [baseTitle]);
}
