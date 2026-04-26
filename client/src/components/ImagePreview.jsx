import { motion } from 'framer-motion';

export default function ImagePreview({ src, onSend, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 mx-3 p-4 rounded-2xl z-20"
      style={{ background: 'var(--panel)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-3)' }}>
        Preview — send this image?
      </p>
      <div className="relative inline-block">
        <img src={src} alt="preview"
          className="max-h-40 max-w-full rounded-xl object-cover"
          style={{ border: '1px solid var(--border)' }}
        />
        <button onClick={onCancel}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center"
          style={{ background: '#ed4245', boxShadow: '0 2px 8px rgba(237,66,69,0.4)' }}
        >✕</button>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onCancel} className="btn btn-soft flex-1 py-2 text-sm">Cancel</button>
        <button onClick={onSend}   className="btn btn-grad flex-1 py-2 text-sm">Send Image</button>
      </div>
    </motion.div>
  );
}
