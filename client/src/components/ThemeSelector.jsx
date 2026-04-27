import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEMES } from '../hooks/useTheme.js';

export default function ThemeSelector({ theme, onSelect }) {
  const [open, setOpen] = useState(false);
  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
        style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        title="Change theme"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-10 z-50 p-2 rounded-2xl min-w-[160px]"
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)'
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest px-2 pb-2"
                style={{ color: 'var(--text-3)' }}>Theme</p>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onSelect(t.id); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] text-left"
                  style={{
                    background: theme === t.id ? 'var(--accent-glow)' : 'transparent',
                    color: theme === t.id ? 'var(--accent)' : 'var(--text-2)',
                    fontWeight: theme === t.id ? 700 : 500,
                  }}
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                  {theme === t.id && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
