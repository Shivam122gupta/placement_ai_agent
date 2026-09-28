import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-sm rounded-2xl border border-[#FAF8F5]/25 bg-[#121214]/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora App"
            className="h-10 w-10 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
          />
          <div>
            <h4 className="text-xs font-semibold text-white">Install Hirxora App</h4>
            <p className="text-[11px] text-[#E8E2D6]/70 leading-tight mt-0.5">
              {isIOS
                ? 'Tap the Share icon & select "Add to Home Screen"'
                : 'Fast access, offline mode & native experience'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-neutral-400 hover:text-white transition p-1"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowPrompt(false)}
            className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white transition"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-xs font-medium text-white shadow-md shadow-[#FF6B6B]/20 transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
