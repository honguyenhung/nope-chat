import { motion } from 'framer-motion';

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      className="relative w-12 h-6 rounded-full shrink-0 transition-colors duration-300"
      style={{ background: dark ? 'var(--accent)' : 'var(--glass-border)', boxShadow: dark ? '0 0 12px var(--accent-glow)' : 'none' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-md bg-white"
        style={{ left: dark ? 'calc(100% - 1.375rem)' : '0.125rem' }}
      >
        {dark ? '🌙' : '☀️'}
      </motion.span>
    </button>
  );
}
