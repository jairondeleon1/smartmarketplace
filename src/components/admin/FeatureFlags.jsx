import React from 'react';
import { Shield, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function FeatureFlags() {
  const { settings, isLoading, updateSettings, isSaving } = useAppSettings();

  const toggle = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const features = [
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
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-teal-600" />
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Feature Flags</h3>
      </div>
      <p className="text-xs text-gray-500 -mt-4 mb-6">Control which features are visible to end users on the front end.</p>

      {features.map((feature) => {
        const enabled = !!settings[feature.key];
        return (
          <div key={feature.key} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${enabled ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex-1 pr-4">
              <p className="font-bold text-sm text-slate-800 uppercase tracking-wide">{feature.label}</p>
              <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
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