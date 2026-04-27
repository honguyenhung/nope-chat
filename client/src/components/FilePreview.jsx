import { motion } from 'framer-motion';

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type) {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  if (type.includes('text')) return '📃';
  return '📎';
}

export default function FilePreview({ file, onSend, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mb-2 p-3 rounded-xl flex items-center gap-3"
      style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: 'var(--input-bg)' }}>
        {getFileIcon(file.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
          {file.name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {formatFileSize(file.size)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onSend}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: '#fff' }}>
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">✓</span>
        </button>
        <button onClick={onCancel}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(237,66,69,0.15)'; e.currentTarget.style.color = '#ed4245'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}>
          ✕
        </button>
      </div>
    </motion.div>
  );
}
