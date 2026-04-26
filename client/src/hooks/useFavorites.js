import { useState, useCallback } from 'react';

const KEY = 'anon_favorites';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

// Persist favorite room names in localStorage (max 10)
export function useFavorites() {
  const [favorites, setFavorites] = useState(load);

  const add = useCallback((roomId) => {
    setFavorites((prev) => {
      if (prev.includes(roomId)) return prev;
      const next = [roomId, ...prev].slice(0, 10);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((roomId) => {
    setFavorites((prev) => {
      const next = prev.filter((r) => r !== roomId);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggle = useCallback((roomId) => {
    setFavorites((prev) => {
      const has = prev.includes(roomId);
      const next = has ? prev.filter((r) => r !== roomId) : [roomId, ...prev].slice(0, 10);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, add, remove, toggle };
}
