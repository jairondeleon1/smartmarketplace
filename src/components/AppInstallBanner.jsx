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

    // Check if already installed or running inside a native app wrapper
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      // Android WebView (TWA / native app wrapper)
      /wv|WebView/.test(ua) ||
      // iOS WKWebView inside native app
      (ua.includes('iPhone') && !ua.includes('Safari')) ||
      (ua.includes('iPad') && !ua.includes('Safari'));
    if (isStandalone) return;

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

  const handleBannerClick = () => {
    if (isIOS) { handleAppStore(); return; }
    if (deferredPrompt) { handleInstall(); return; }
    handlePlayStore();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleBannerClick}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleBannerClick()}
        className="bg-slate-900 text-white border-b border-teal-500/30 flex items-center gap-3 px-4 py-3 active:bg-white/5 transition cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm uppercase tracking-widest text-white leading-tight">Get the App</p>
          <p className="text-[10px] text-slate-400 leading-tight">Tap to download SmartMenu IQ</p>
        </div>
        <div className="shrink-0">
          {isIOS ? (
            <img
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
              alt="Download on the App Store"
              className="h-9"
            />
          ) : (
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              alt="Get it on Google Play"
              className="h-9"
            />
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="p-2 hover:bg-white/10 transition shrink-0 rounded-full"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}