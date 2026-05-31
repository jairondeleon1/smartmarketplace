import React, { useState, useEffect } from 'react';
import { X, Download, Apple } from 'lucide-react';

export default function AppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    if (localStorage.getItem('appInstallBannerDismissed')) return;

    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    if (!isMobile) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;

    // iOS detection (Safari)
    const ios = /iPhone|iPad|iPod/i.test(ua) && !window.MSStream;
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss();
    }
  };

  const handleAppStore = () => {
    window.location.href = 'https://apps.apple.com/us/app/smartmenuiq/id6759359011';
  };

  const handlePlayStore = () => {
    window.location.href = 'https://play.google.com/store/apps/details?id=com.smartmenuiq';
  };

  const dismiss = () => {
    localStorage.setItem('appInstallBannerDismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-3 z-[60]" style={{ maxWidth: '200px' }}>
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-3 flex flex-col gap-2 border border-teal-500/30">
        <div className="flex items-center justify-between">
          <p className="font-bold text-xs uppercase tracking-widest text-white leading-tight">Get the App</p>
          <button onClick={dismiss} className="p-0.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        {isIOS ? (
          <button onClick={handleAppStore} className="transition hover:opacity-80 active:scale-95">
            <img 
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
              alt="Download on the App Store"
              className="h-9 w-full object-contain"
            />
          </button>
        ) : (
          <button onClick={handlePlayStore} className="transition hover:opacity-80 active:scale-95">
            <img 
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
              alt="Get it on Google Play"
              className="h-9 w-full object-contain"
            />
          </button>
        )}
      </div>
    </div>
  );
}