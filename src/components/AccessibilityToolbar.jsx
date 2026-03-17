import React, { useState } from 'react';
import { useA11y } from '@/lib/AccessibilityContext';
import { Globe, Type, ChevronUp, ChevronDown } from 'lucide-react';

export default function AccessibilityToolbar() {
  const { t, lang, largeText, toggleLang, toggleLargeText } = useA11y();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed right-3 z-[200] flex flex-col items-end gap-1"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.5rem)' }}
      role="toolbar"
      aria-label={t.a11yToolbar}
    >
      {open && (
        <div className="flex flex-col gap-1 items-end animate-in slide-in-from-bottom-2 duration-200">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            aria-pressed={lang === 'es'}
            aria-label={lang === 'en' ? 'Switch to Spanish' : 'Switch to English'}
            className="flex items-center gap-2 bg-white border-2 border-teal-500 text-teal-700 rounded-full px-3 py-2 text-xs font-bold shadow-lg hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition active:scale-95"
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            {t.language}
          </button>

          {/* Large text toggle */}
          <button
            onClick={toggleLargeText}
            aria-pressed={largeText}
            aria-label={largeText ? 'Switch to normal text size' : 'Switch to large text size'}
            className="flex items-center gap-2 bg-white border-2 border-indigo-500 text-indigo-700 rounded-full px-3 py-2 text-xs font-bold shadow-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition active:scale-95"
          >
            <Type className="w-4 h-4" aria-hidden="true" />
            {largeText ? t.normalText : t.largeText}
          </button>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={t.a11yToolbar}
        className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 transition active:scale-95"
      >
        {open
          ? <ChevronDown className="w-4 h-4" aria-hidden="true" />
          : <ChevronUp className="w-4 h-4" aria-hidden="true" />
        }
      </button>
    </div>
  );
}