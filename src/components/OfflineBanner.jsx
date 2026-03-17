import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner({ isOnline, cacheAge }) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg"
      role="status" aria-live="polite">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Offline — showing cached menu
        {cacheAge ? ` (saved ${cacheAge})` : ''}
      </span>
    </div>
  );
}