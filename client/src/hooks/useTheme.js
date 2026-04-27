import { useState, useEffect } from 'react';

export const THEMES = [
  { id: 'dark',    label: 'Dark',     icon: '🌙' },
  { id: 'light',   label: 'Light',    icon: '☀️' },
  { id: 'soft',    label: 'Soft',     icon: '🌸' },
  { id: 'vibrant', label: 'Vibrant',  icon: '🎨' },
  { id: 'premium', label: 'Premium',  icon: '💎' },
];

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // toggle chỉ dùng để switch dark/light (giữ backward compat)
  function toggle() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  function setThemeById(id) {
    setTheme(id);
  }

  return { theme, toggle, setThemeById };
}
