import React, { useState } from 'react';
import { Shield, Loader2, ToggleLeft, ToggleRight, MapPin, Plus, ChevronDown } from 'lucide-react';
import { useAppSettings, useAllLocationSettings } from '@/hooks/useAppSettings';
import { getCurrentLocationId } from '@/utils';

const FEATURES = [
  {
    key: 'allergen_display_enabled',
    label: 'Allergen Information',
    description: 'Show "Contains:" allergen warnings on each menu item card and allow users to set dietary restrictions in their profile.',
  },
  {
    key: 'scan_label_enabled',
    label: 'Scan Food Label',
    description: 'Show the barcode scanner button so users can scan packaged food labels for nutritional analysis.',
  },
  {
    key: 'wellness_corner_enabled',
    label: "Dietitian's Wellness Corner",
    description: "Show the Wellness Corner tab in the navigation so users can access dietitian resources and content.",
  },
];

function LocationSettings({ locationId, label }) {
  const { settings, isLoading, updateSettings, isSaving } = useAppSettings(locationId);

  const toggle = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-3">
      {FEATURES.map((feature) => {
        const enabled = !!settings[feature.key];
        return (
          <div key={feature.key} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${enabled ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex-1 pr-4">
              <p className="font-bold text-sm text-slate-800 uppercase tracking-wide">{feature.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
            </div>
            <button
              onClick={() => toggle(feature.key)}
              disabled={isSaving}
              className="shrink-0 focus:outline-none disabled:opacity-50"
              aria-label={`Toggle ${feature.label}`}
            >
              {enabled
                ? <ToggleRight className="w-10 h-10 text-teal-600" />
                : <ToggleLeft className="w-10 h-10 text-gray-400" />}
            </button>
            <span className={`ml-3 text-[10px] font-bold uppercase tracking-widest min-w-[3rem] text-right ${enabled ? 'text-teal-700' : 'text-gray-400'}`}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function FeatureFlags() {
  const currentLocationId = getCurrentLocationId();
  const { data: allSettings = [] } = useAllLocationSettings();

  // Collect all known location IDs (excluding 'global')
  const existingLocations = [...new Set(
    allSettings.map(s => s.key).filter(k => k && k !== 'global')
  )];

  // Always include current location
  const allLocations = [...new Set([currentLocationId, ...existingLocations])];

  const [activeLocation, setActiveLocation] = useState(currentLocationId);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAddLocation = () => {
    const loc = newLocationInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (loc && !allLocations.includes(loc)) {
      setActiveLocation(loc);
    }
    setNewLocationInput('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Feature Flags</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition"
        >
          <Plus className="w-3 h-3" /> Add Location
        </button>
      </div>

      <p className="text-xs text-gray-500">Each subdomain/location can have its own feature settings. Admins configure per-location.</p>

      {showAdd && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. cafe1, hq-office, building-b"
            value={newLocationInput}
            onChange={e => setNewLocationInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddLocation()}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={handleAddLocation}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition"
          >
            Add
          </button>
        </div>
      )}

      {/* Location tabs */}
      <div className="flex flex-wrap gap-2">
        {allLocations.map(loc => (
          <button
            key={loc}
            onClick={() => setActiveLocation(loc)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
              activeLocation === loc
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {loc === currentLocationId ? `${loc} (current)` : loc}
          </button>
        ))}
      </div>

      {/* Settings for active location */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">{activeLocation}</span>
        </div>
        <LocationSettings key={activeLocation} locationId={activeLocation} label={activeLocation} />
      </div>
    </div>
  );
}