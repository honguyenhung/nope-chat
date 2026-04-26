import { useState, useRef, useEffect } from 'react';

const GROUPS = {
  '😀': ['😀','😂','🤣','😊','😍','🥰','😎','🤔','😅','😭','😤','🥺','😏','🤗','😴','🤯','🥳','😬','🫡','💀'],
  '👋': ['👋','🤝','👍','👎','👏','🙌','✌️','🤞','🫶','❤️','🔥','💯','✨','🎉','💪','🙏','👀','💔','🫠','⭐'],
  '🐶': ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵','🐔','🐧','🦆','🦅','🦉','🦋','🐝','🦄'],
  '🍕': ['🍕','🍔','🌮','🍜','🍣','🍦','🎂','🍩','🍪','☕','🧋','🍺','🥤','🍷','🥂','🍾','🧃','🥛','🍵','🧁'],
  '⚽': ['⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🥊','🎯','🎮','🕹️','🎲','🎭','🎨','🎬','🎤','🎧','🎸','🏆'],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [active, setActive] = useState(Object.keys(GROUPS)[0]);
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref}
      className="absolute bottom-14 left-0 w-72 rounded-2xl z-50 overflow-hidden"
      style={{ background: 'var(--panel)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(24px)', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        {Object.keys(GROUPS).map((g) => (
          <button key={g} onClick={() => setActive(g)}
            className="flex-1 py-2.5 text-lg transition-colors"
            style={{ background: active === g ? 'var(--panel-hover)' : 'transparent' }}
          >{g}</button>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-44 overflow-y-auto">
        {GROUPS[active].map((e) => (
          <button key={e} onClick={() => onSelect(e)}
            className="text-xl p-1.5 rounded-lg transition-all hover:scale-110"
            onMouseEnter={(el) => el.currentTarget.style.background = 'var(--panel-hover)'}
            onMouseLeave={(el) => el.currentTarget.style.background = 'transparent'}
          >{e}</button>
        ))}
      </div>
    </div>
  );
}
