import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEMES } from '../hooks/useTheme.js';
import { setCustomBlob } from './VideoBackground.jsx';

export default function ThemeSelector({ theme, onSelect }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customType, setCustomType] = useState('image');
  const [selectedFile, setSelectedFile] = useState(null);

  const current = THEMES.find(t => t.id === theme) || { icon: '✏️', label: 'Custom' };

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  }

  function applyCustom() {
    if (!selectedFile) return;
    const blobUrl = URL.createObjectURL(selectedFile);
    setCustomBlob(blobUrl, customType);
    onSelect('custom');
    setShowCustom(false);
    setOpen(false);
  }

  function clearCustom() {
    setCustomBlob(null, 'image');
    setSelectedFile(null);
    onSelect('darkblue');
    setShowCustom(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
        style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowCustom(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 p-2 rounded-2xl"
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                minWidth: showCustom ? 260 : 180,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest px-2 pb-2"
                style={{ color: 'var(--text-3)' }}>Theme</p>

              {!showCustom ? (
                <>
                  {THEMES.map(t => (
                    <button key={t.id}
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

                  <div className="my-1 mx-2" style={{ borderTop: '1px solid var(--border)' }} />

                  <button onClick={() => setShowCustom(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] text-left"
                    style={{
                      background: theme === 'custom' ? 'var(--accent-glow)' : 'transparent',
                      color: theme === 'custom' ? 'var(--accent)' : 'var(--text-2)',
                    }}
                  >
                    <span className="text-base">✏️</span>
                    <span>Custom</span>
                    {theme === 'custom' && <span className="ml-auto text-xs">✓</span>}
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3 px-1"
                >
                  <button onClick={() => setShowCustom(false)}
                    className="flex items-center gap-1 text-xs mb-1"
                    style={{ color: 'var(--text-3)' }}>
                    ← Quay lại
                  </button>

                  <p className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>✏️ Custom Background</p>

                  <div className="flex gap-1">
                    {['image', 'video'].map(type => (
                      <button key={type} onClick={() => setCustomType(type)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: customType === type ? 'var(--accent)' : 'var(--panel-hover)',
                          color: customType === type ? '#fff' : 'var(--text-3)',
                        }}>
                        {type === 'image' ? '🖼️ Ảnh' : '🎬 Video'}
                      </button>
                    ))}
                  </div>

                  <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--panel-hover)', border: '2px dashed var(--border)' }}>
                    <span className="text-2xl">{customType === 'image' ? '🖼️' : '🎬'}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                      Bấm để chọn {customType === 'image' ? 'ảnh' : 'video'}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {customType === 'image' ? 'JPG, PNG, GIF, WebP' : 'MP4, WebM'}
                    </span>
                    <input
                      type="file"
                      accept={customType === 'image' ? 'image/*' : 'video/*'}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: 'rgba(59,165,93,0.1)', border: '1px solid rgba(59,165,93,0.3)' }}>
                      <span className="text-green-400 text-sm">✓</span>
                      <span className="text-xs truncate flex-1" style={{ color: '#3ba55d' }}>
                        {selectedFile.name}
                      </span>
                      <button onClick={() => setSelectedFile(null)}
                        className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>✕</button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={applyCustom} disabled={!selectedFile}
                      className="btn btn-grad flex-1 py-1.5 text-xs">
                      Áp dụng
                    </button>
                    {theme === 'custom' && (
                      <button onClick={clearCustom}
                        className="btn btn-soft px-3 py-1.5 text-xs">
                        Xóa
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
