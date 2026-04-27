import { useEffect, useRef } from 'react';
import { THEMES } from '../hooks/useTheme.js';

// Lưu blob URL trong memory (không dùng localStorage vì quá lớn)
export let customBlobUrl = null;
export let customBlobType = 'image';

export function setCustomBlob(url, type) {
  customBlobUrl = url;
  customBlobType = type;
}

export default function VideoBackground({ theme }) {
  const videoRef = useRef(null);
  const current = THEMES.find(t => t.id === theme);

  const isCustom = theme === 'custom';
  const videoSrc = isCustom
    ? (customBlobType === 'video' ? customBlobUrl : null)
    : current?.video;
  const imgSrc = isCustom
    ? (customBlobType === 'image' ? customBlobUrl : null)
    : current?.bg;

  useEffect(() => {
    if (videoRef.current) videoRef.current.load();
  }, [videoSrc]);

  if (!videoSrc && !imgSrc) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 z-10" style={{ background: 'rgba(0,0,0,0.15)' }} />
      {videoSrc && (
        <video ref={videoRef} key={videoSrc} autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(1.4) contrast(1.15) saturate(1.1)' }}>
          <source src={videoSrc} />
        </video>
      )}
      {imgSrc && !videoSrc && (
        <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(1.4) contrast(1.15) saturate(1.1)' }} />
      )}
    </div>
  );
}
