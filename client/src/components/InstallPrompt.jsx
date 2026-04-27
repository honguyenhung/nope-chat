import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem('install_prompt_dismissed');
    if (dismissed) return;

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  }

  function handleDismiss() {
    localStorage.setItem('install_prompt_dismissed', 'true');
    setShowPrompt(false);
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="glass p-4 rounded-2xl"
            style={{ border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                style={{ boxShadow: '0 4px 16px var(--accent-glow)' }}>
                <img src="/avatar.png" alt="Nope" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-1)' }}>
                  📱 Install Nope App
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                  Add to home screen for quick access and offline support
                </p>
                <div className="flex gap-2">
                  <button onClick={handleInstall}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: '#fff' }}>
                    Install
                  </button>
                  <button onClick={handleDismiss}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
