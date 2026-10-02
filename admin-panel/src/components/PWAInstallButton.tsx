import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'sidebar' }> = ({ variant = 'header' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed app)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('PWA App is ready! On Chrome/Edge, click the install icon in your browser address bar. On iOS/Safari, tap Share -> Add to Home Screen.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="p-2.5 rounded-sm bg-[#00ea64]/10 border border-[#00ea64]/30 text-[#00ea64] font-mono text-xs flex items-center justify-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#00ea64]" />
          <span>APP INSTALLED</span>
        </div>
      );
    }
    return (
      <div className="hidden lg:flex items-center space-x-1.5 bg-[#00ea64]/10 text-[#00ea64] border border-[#00ea64]/30 px-2.5 py-1 rounded-sm font-mono text-[11px] font-bold uppercase">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#00ea64]" />
        <span>APP INSTALLED</span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-sm bg-[#00ea64] hover:bg-[#00c854] text-[#0e141e] font-mono font-extrabold text-xs uppercase tracking-wider transition-all border border-[#00ea64] shadow-md shadow-[#00ea64]/20"
      >
        <Download className="w-4 h-4 text-[#0e141e]" />
        <span>1-CLICK INSTALL APP</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      title="Download & Install HireXora Admin App in 1-Click"
      className="flex items-center space-x-1.5 bg-[#00ea64] hover:bg-[#00c854] text-[#0e141e] border border-[#00ea64] px-3 py-1 rounded-sm text-[11px] font-mono font-extrabold uppercase tracking-wider transition-all shadow-sm shadow-[#00ea64]/20"
    >
      <Download className="w-3.5 h-3.5 text-[#0e141e]" />
      <span>INSTALL APP</span>
    </button>
  );
};
