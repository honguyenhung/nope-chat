import { useRef } from 'react';

export default function FileUpload({ onFile, onImage, disabled }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      // Max 2MB for images
      if (file.size > 2 * 1024 * 1024) {
        alert('Image too large! Max 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        onImage(reader.result); // base64 image
        if (inputRef.current) inputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } else {
      // Other files
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large! Max 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onFile({
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result, // base64
        });
        if (inputRef.current) inputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
      <label
        htmlFor="file-upload"
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
          disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
        }`}
        style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        title="Upload image or file"
      >
        📎
      </label>
    </>
  );
}
