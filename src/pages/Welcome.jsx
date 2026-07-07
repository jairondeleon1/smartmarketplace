import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, ArrowRight, Building2, Navigation } from 'lucide-react';
import {
  getSubdomain,
  getSavedLocation,
  saveLocation,
  redirectToSubdomain,
  getApexDomain,
  isDevHost,
} from '@/utils/location';

export default function Welcome() {
  const [search, setSearch] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [redirectLabel, setRedirectLabel] = useState('');

  // Routing guard: if on a subdomain, go to the menu; if apex + saved, auto-redirect.
  useEffect(() => {
    const sub = getSubdomain();
    if (sub) {
      // Already on a location subdomain — go straight to the menu.
      window.location.href = '/';
      return;
    }
    // Apex domain — auto-redirect if a location was previously saved.
    const saved = getSavedLocation();
    if (saved?.subdomain && !isDevHost()) {
      setRedirecting(true);
      setRedirectLabel(saved.name || saved.subdomain);
      // Small delay so the user sees confirmation before the cross-domain redirect.
      setTimeout(() => {
        window.location.href = `https://${saved.subdomain}.${getApexDomain()}`;
      }, 600);
    }
  }, []);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const MAX_BEFORE_SEARCH = 3;
  const q = search.toLowerCase().trim();
  const matched = q
    ? locations.filter((l) => {
        return (
          (l.name || '').toLowerCase().includes(q) ||
          (l.zip_code || '').toLowerCase().includes(q) ||
          (l.address || '').toLowerCase().includes(q) ||
          (l.city || '').toLowerCase().includes(q) ||
          (l.state || '').toLowerCase().includes(q)
        );
      })
    : locations;
  // Show only 3 locations before the user searches; show all matches once they type.
  const filtered = q ? matched : matched.slice(0, MAX_BEFORE_SEARCH);

  const handleSelect = (loc) => {
    saveLocation({ subdomain: loc.subdomain, name: loc.name });
    setRedirecting(true);
    setRedirectLabel(loc.name);
    setTimeout(() => redirectToSubdomain(loc.subdomain), 400);
  };

  if (redirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-stone-50 font-sans">
        <div className="text-center space-y-4 px-6">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm font-bold uppercase tracking-widest text-slate-700">
            Taking you to {redirectLabel}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-teal-50/30 flex flex-col items-center justify-center p-6 font-sans font-bold">
      <div className="w-full max-w-lg space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4 pt-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/5f703ba08_SmartMenuIQ38x10.png"
            alt="SmartMenu IQ"
            className="max-w-xs w-full mx-auto"
          />
          <p className="text-slate-600 text-sm uppercase tracking-widest">
            Find your location to see the menu
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ZIP code…"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm tracking-tight"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs uppercase tracking-widest">
                {locations.length === 0
                  ? 'No locations available yet'
                  : 'No matches found'}
              </div>
            ) : (
              filtered.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="bg-teal-100 p-2.5 rounded-xl">
                    <MapPin className="w-5 h-5 text-teal-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm uppercase tracking-tight truncate">
                      {loc.name}
                    </p>
                    {(loc.address || loc.city || loc.state || loc.zip_code) && (
                      <p className="text-[11px] text-gray-500 font-medium truncate">
                        {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">
          We'll remember your choice next time
        </p>
      </div>
    </div>
  );
}