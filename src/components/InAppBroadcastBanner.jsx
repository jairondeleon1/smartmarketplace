import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getCurrentLocationId } from '@/utils';
import { X, Bell } from 'lucide-react';

export default function InAppBroadcastBanner() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]'); } catch { return []; }
  });
  const locationId = getCurrentLocationId();

  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const items = await base44.entities.Broadcast.filter({ active: true });
        const relevant = items.filter(b => !b.location_id || b.location_id === locationId);
        setBroadcasts(relevant);
      } catch (_e) {
        setBroadcasts([]);
      }
    };
    fetchBroadcasts();
    const interval = setInterval(fetchBroadcasts, 60000);
    return () => clearInterval(interval);
  }, [locationId]);

  const visibleBroadcasts = broadcasts.filter(b => !dismissed.includes(b.id));

  if (visibleBroadcasts.length === 0) return null;

  const dismiss = (id) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedBroadcasts', JSON.stringify(newDismissed));
  };

  return (
    <div className="space-y-2">
      {visibleBroadcasts.map(b => (
        <div key={b.id} className="bg-teal-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <Bell className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm uppercase tracking-tight">{b.title}</p>
            <p className="text-xs text-teal-50">{b.message}</p>
          </div>
          <button onClick={() => dismiss(b.id)} className="p-1 hover:bg-white/20 rounded-full transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}