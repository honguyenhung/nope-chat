import { useState, useEffect } from 'react';

// Persists theme in localStorage, defaults to system preference
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('anon_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('anon_theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
