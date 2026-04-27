import { motion, AnimatePresence } from 'framer-motion';

export default function KeyboardShortcutsModal({ show, onClose }) {
  const shortcuts = [
    { key: 'Esc', desc: 'Clear reply or close search', icon: '⎋' },
    { key: 'Ctrl+F', desc: 'Toggle search', icon: '🔍' },
    { key: 'Ctrl+/', desc: 'Show this help', icon: '❓' },
    { key: 'Enter', desc: 'Send message', icon: '✉️' },
    { key: 'Shift+Enter', desc: 'New line', icon: '↵' },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass w-full max-w-md"
            style={{ border: '1px solid var(--glass-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 text-center"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', boxShadow: '0 8px 32px var(--accent-glow)' }}>
                ⌨️
              </div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: 'var(--text-1)' }}>
                Keyboard Shortcuts
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                Boost your productivity with these shortcuts
              </p>
            </div>

            {/* Shortcuts list */}
            <div className="p-6 space-y-2">
              {shortcuts.map((shortcut, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{shortcut.icon}</span>
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                      {shortcut.desc}
                    </span>
                  </div>
                  <kbd className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
                    style={{ background: 'var(--input-bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    {shortcut.key}
                  </kbd>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="btn btn-grad w-full py-3"
              >
                Got it! 🚀
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
