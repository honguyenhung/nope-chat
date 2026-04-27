import { useEffect, useRef } from 'react';
import { THEMES } from '../hooks/useTheme.js';

export default function VideoBackground({ theme }) {
  const videoRef = useRef(null);

  // Custom theme từ localStorage
  const isCustom = theme === 'custom';
  const customUrl = isCustom ? localStorage.getItem('custom_bg_url') : null;
  const customType = isCustom ? localStorage.getItem('custom_bg_type') : null;

  const current = THEMES.find(t => t.id === theme);

  const videoSrc = isCustom
    ? (customType === 'video' ? customUrl : null)
    : current?.video;

  const imgSrc = isCustom
    ? (customType === 'image' ? customUrl : null)
    : current?.bg;

  // Detect type từ base64 hoặc URL
  const isVideo = videoSrc || (isCustom && customUrl?.startsWith('data:video'));
  const isImg = !isVideo && (imgSrc || (isCustom && customUrl?.startsWith('data:image')));

  const finalVideoSrc = isVideo ? (videoSrc || customUrl) : null;
  const finalImgSrc = isImg ? (imgSrc || customUrl) : null;

  useEffect(() => {
    if (videoRef.current) videoRef.current.load();
  }, [theme, videoSrc]);

  if (!finalVideoSrc && !finalImgSrc) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 z-10" style={{ background: 'rgba(0,0,0,0.45)' }} />

      {finalVideoSrc && (
        <video ref={videoRef} key={finalVideoSrc} autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover">
          <source src={finalVideoSrc} />
        </video>
      )}

      {finalImgSrc && !finalVideoSrc && (
        <img src={finalImgSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
    </div>
  );
}
