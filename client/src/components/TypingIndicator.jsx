import { motion } from 'framer-motion';

export default function TypingIndicator({ users }) {
  const label =
    users.length === 1 ? `${users[0]} is typing` :
    users.length === 2 ? `${users[0]} & ${users[1]} are typing` :
    `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      className="flex items-center gap-2.5 px-2 py-1"
    >
      <div className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl rounded-bl-sm"
        style={{ background: 'var(--msg-other)', border: '1px solid var(--border)' }}>
        {[0, 1, 2].map((i) => (
          <motion.span key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--text-3)' }}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</span>
    </motion.div>
  );
}
