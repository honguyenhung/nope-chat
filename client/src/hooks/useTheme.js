import { useState, useEffect } from 'react';

export const THEMES = [
  { id: 'sky',        label: 'Sky',       icon: '☁️', video: null,                    bg: '/themes/background.jpg' },
  { id: 'darkblue',   label: 'Dark Blue', icon: '🌃', video: '/themes/darkblue.webm', bg: null },
  { id: 'dracula',    label: 'Dracula',   icon: '🧛', video: '/themes/dracula.webm',  bg: null },
  { id: 'monokai',    label: 'Monokai',   icon: '🌿', video: '/themes/monokai.webm',  bg: null },
  { id: 'nord',       label: 'Nord',      icon: '❄️', video: '/themes/nord.webm',     bg: null },
  { id: 'pink',       label: 'Pink',      icon: '🌷', video: '/themes/pink.webm',     bg: null },
];

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'sky');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggle() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  function setThemeById(id) {
    setTheme(id);
  }

  return { theme, toggle, setThemeById };
}
