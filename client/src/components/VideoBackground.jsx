import { useEffect, useRef } from 'react';
import { THEMES } from '../hooks/useTheme.js';

export default function VideoBackground({ theme }) {
  const videoRef = useRef(null);
  const current = THEMES.find(t => t.id === theme);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [theme]);

  if (!current?.video && !current?.bg) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Overlay để text vẫn đọc được */}
      <div className="absolute inset-0 z-10"
        style={{ background: 'rgba(0,0,0,0.45)' }} />

      {/* Video background */}
      {current.video && (
        <video
          ref={videoRef}
          key={current.video}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={current.video} type="video/webm" />
        </video>
      )}

      {/* Image background */}
      {current.bg && !current.video && (
        <img
          src={current.bg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
