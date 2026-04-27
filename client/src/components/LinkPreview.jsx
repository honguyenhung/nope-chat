import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Extract URLs from text
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Simple link preview (client-side only - no external API)
function LinkCard({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, just show domain and path
    try {
      const urlObj = new URL(url);
      setPreview({
        domain: urlObj.hostname,
        path: urlObj.pathname,
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
      });
    } catch {
      setPreview(null);
    }
    setLoading(false);
  }, [url]);

  if (loading || !preview) return null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl mt-2 transition-all hover:scale-[1.02]"
      style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
    >
      <img src={preview.favicon} alt="" className="w-6 h-6 rounded" onError={(e) => e.target.style.display = 'none'} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>
          {preview.domain}
        </p>
        <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
          {preview.path || '/'}
        </p>
      </div>
      <div className="text-sm">🔗</div>
    </motion.a>
  );
}

export default function LinkPreview({ text }) {
  const urls = extractUrls(text);
  if (urls.length === 0) return null;

  return (
    <div className="space-y-2">
      {urls.slice(0, 2).map((url, i) => (
        <LinkCard key={i} url={url} />
      ))}
    </div>
  );
}
