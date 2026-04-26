import { useRef } from 'react';
import imageCompression from 'browser-image-compression';

const MAX_MB = 2;
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function ImageUpload({ onImage, disabled }) {
  const ref = useRef(null);

  async function onChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { alert('Only JPEG, PNG, GIF, WebP allowed.'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('File is too large (max 20MB).'); return; }
    
    let compressedFile = file;
    // Không nén GIF vì làm mất hoạt ảnh
    if (file.type === 'image/gif') {
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(`GIF must be smaller than ${MAX_MB}MB.`);
        return;
      }
    } else {
      try {
        compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch (error) {
        console.error(error);
        alert('Image compression failed.');
        return;
      }
    }

    onImage(await readAsDataURL(compressedFile));
    e.target.value = '';
  }

  return (
    <>
      <input ref={ref} type="file" accept={ALLOWED.join(',')} className="hidden" onChange={onChange} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        title="Send image (max 2MB)"
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0 disabled:opacity-30"
        style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'var(--panel-hover)'; e.currentTarget.style.color = 'var(--text-1)'; }}}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--panel)'; e.currentTarget.style.color = 'var(--text-2)'; }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
    </>
  );
}
