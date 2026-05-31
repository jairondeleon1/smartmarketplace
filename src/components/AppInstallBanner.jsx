import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

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

  const dismiss = () => {
    localStorage.setItem('appInstallBannerDismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[60] px-3 pb-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-teal-500/30">
        <div className="bg-teal-600 p-2.5 rounded-xl shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm uppercase tracking-widest text-white leading-tight">Add to Home Screen</p>
          {isIOS ? (
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Tap <span className="font-bold text-teal-400">Share</span> then <span className="font-bold text-teal-400">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">Get the full app experience</p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition shrink-0"
          >
            Install
          </button>
        )}
        <button onClick={dismiss} className="p-1.5 hover:bg-white/10 rounded-lg transition shrink-0">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}