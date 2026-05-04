import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ScanLine, Search, Loader2, AlertCircle, ChevronDown, ChevronUp, Barcode } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

// --- Health scoring ---
function calcHealthScore(product) {
  const { nutriments = {} } = product;
  const per100 = (key) => nutriments[`${key}_100g`] ?? nutriments[key] ?? null;

  let score = 100;

  const sugar = per100('sugars');
  const satFat = per100('saturated-fat');
  const sodium = per100('sodium') ?? (per100('salt') != null ? per100('salt') / 2.5 : null);
  const calories = per100('energy-kcal') ?? (per100('energy') != null ? per100('energy') / 4.184 : null);
  const fiber = per100('fiber');
  const protein = per100('proteins');
  const additives = product.additives_tags ?? [];

  if (calories != null) { if (calories > 400) score -= 25; else if (calories > 250) score -= 10; }
  if (sugar != null) { if (sugar > 22.5) score -= 25; else if (sugar > 12) score -= 10; }
  if (satFat != null) { if (satFat > 10) score -= 20; else if (satFat > 5) score -= 8; }
  if (sodium != null) { if (sodium > 0.6) score -= 20; else if (sodium > 0.3) score -= 8; }
  if (fiber != null && fiber >= 3) score += 5;
  if (protein != null && protein >= 5) score += 5;
  if (additives.length > 3) score -= 15; else if (additives.length > 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// --- Gradient bar (like Yuka) ---
function GradientBar({ value, min, max, thresholds, unit, markerColor }) {
  // thresholds: [{at: number, color: string}] — color stops
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="mt-3 mb-1">
      <div className="relative h-2.5 rounded-full overflow-visible" style={{ background: 'linear-gradient(to right, #22c55e 0%, #22c55e 30%, #f59e0b 55%, #ef4444 80%, #dc2626 100%)' }}>
        {/* Marker triangle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none" style={{ left: `${pct}%` }}>
          <div className="w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `8px solid ${markerColor || '#374151'}`, marginTop: '-10px' }} />
        </div>
      </div>
      <div className="flex justify-between mt-1.5">
        {thresholds.map((t, i) => (
          <span key={i} className="text-[9px] text-gray-400">{t.label}</span>
        ))}
      </div>
    </div>
  );
}

// --- Single expandable row ---
function NutrientRow({ icon, label, subtitle, value, unit, level, expandContent }) {
  const [open, setOpen] = useState(false);
  const dotColor = level === 'bad' ? 'bg-red-500' : level === 'moderate' ? 'bg-amber-400' : level === 'good' ? 'bg-green-500' : 'bg-gray-300';
  const markerColor = level === 'bad' ? '#ef4444' : level === 'moderate' ? '#f59e0b' : '#22c55e';

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => expandContent ? setOpen(v => !v) : null}
        className={`w-full flex items-center gap-4 py-4 text-left ${expandContent ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base shrink-0">
          {icon}
        </div>
        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {/* Value + dot + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {value != null && <span className="text-sm text-gray-500">{value}{unit}</span>}
          <div className={`w-3.5 h-3.5 rounded-full ${dotColor} shrink-0`} />
          {expandContent && (
            open ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />
          )}
        </div>
      </button>
      {open && expandContent && (
        <div className="pb-4 pl-13">
          {expandContent({ markerColor })}
        </div>
      )}
    </div>
  );
}

// --- Additives expanded view ---
function AdditivesExpanded({ additives }) {
  const highRisk = additives.filter(a => {
    const name = a.replace('en:', '').toLowerCase();
    return name.includes('e1') || name.includes('e2') || name.includes('e3') || name.includes('red') || name.includes('yellow') || name.includes('caramel');
  });
  const limitedRisk = additives.filter(a => !highRisk.includes(a)).slice(0, Math.ceil(additives.length / 3));
  const riskFree = additives.filter(a => !highRisk.includes(a) && !limitedRisk.includes(a));

  return (
    <div className="pl-13 pb-2 space-y-2">
      {highRisk.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{highRisk.length}</div>
          <span className="text-xs text-gray-600">High-risk</span>
        </div>
      )}
      {limitedRisk.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{limitedRisk.length}</div>
          <span className="text-xs text-gray-600">Limited risk</span>
        </div>
      )}
      {riskFree.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{riskFree.length}</div>
          <span className="text-xs text-gray-600">Risk-free</span>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {additives.map((a, i) => (
          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
            {a.replace('en:', '').toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Full product result (Yuka-style) ---
function ProductResult({ product }) {
  const [showIngredients, setShowIngredients] = useState(false);
  const score = calcHealthScore(product);
  const n = product.nutriments ?? {};
  const per = (key) => n[`${key}_100g`] ?? n[key] ?? null;
  const fmt = (v, d = 1) => v != null ? +v.toFixed(d) : null;

  const additives = product.additives_tags ?? [];
  const allergens = (product.allergens_hierarchy ?? []).map(a => a.replace('en:', ''));

  const calories = fmt(per('energy-kcal') ?? (per('energy') != null ? per('energy') / 4.184 : null), 0);
  const sugar = fmt(per('sugars'));
  const satFat = fmt(per('saturated-fat'));
  const sodiumRaw = per('sodium') ?? (per('salt') != null ? per('salt') / 2.5 : null);
  const sodiumMg = sodiumRaw != null ? fmt(sodiumRaw * 1000, 0) : null;
  const protein = fmt(per('proteins'));
  const fiber = fmt(per('fiber'));
  const totalFat = fmt(per('fat'));
  const carbs = fmt(per('carbohydrates'));
  const salt = fmt(per('salt'));

  const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : score >= 25 ? '#ea580c' : '#dc2626';
  const scoreLabel = score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : score >= 25 ? 'Poor' : 'Bad';

  // Build negatives list
  const negatives = [];

  if (additives.length > 0) {
    const level = additives.length > 3 ? 'bad' : 'moderate';
    negatives.push({
      icon: '🧪', label: 'Additives',
      subtitle: additives.length > 3 ? 'Contains additives to avoid' : 'Contains some additives',
      value: additives.length, unit: '', level,
      expandContent: () => <AdditivesExpanded additives={additives} />
    });
  }

  if (sugar != null && sugar > 12) {
    const level = sugar > 22.5 ? 'bad' : 'moderate';
    negatives.push({
      icon: '🍬', label: 'Sugar',
      subtitle: sugar > 22.5 ? 'Too sweet' : 'Moderately sweet',
      value: sugar, unit: 'g', level,
      expandContent: ({ markerColor }) => (
        <GradientBar value={sugar} min={0} max={14} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '2.5' }, { label: '5.5' }, { label: '9.5' }, { label: '14+' }]} />
      )
    });
  }

  if (calories != null && calories > 250) {
    const level = calories > 400 ? 'bad' : 'moderate';
    negatives.push({
      icon: '🔥', label: 'Calories',
      subtitle: calories > 400 ? 'Very caloric' : 'A bit too caloric',
      value: calories, unit: ' Cal', level,
      expandContent: ({ markerColor }) => (
        <GradientBar value={calories} min={0} max={400} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '100' }, { label: '200' }, { label: '300' }, { label: '400' }]} />
      )
    });
  }

  if (sodiumRaw != null && sodiumRaw > 0.3) {
    const level = sodiumRaw > 0.6 ? 'bad' : 'moderate';
    negatives.push({
      icon: '🧂', label: 'Sodium',
      subtitle: sodiumRaw > 0.6 ? 'A bit too salty' : 'Moderately salty',
      value: sodiumMg, unit: 'mg', level,
      expandContent: ({ markerColor }) => (
        <GradientBar value={sodiumMg} min={0} max={600} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '150' }, { label: '300' }, { label: '450' }, { label: '600' }]} />
      )
    });
  }

  if (satFat != null && satFat > 5) {
    const level = satFat > 10 ? 'bad' : 'moderate';
    negatives.push({
      icon: '🥩', label: 'Saturated fat',
      subtitle: satFat > 10 ? 'High saturated fat' : 'Moderate saturated fat',
      value: satFat, unit: 'g', level,
      expandContent: ({ markerColor }) => (
        <GradientBar value={satFat} min={0} max={15} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '3' }, { label: '6' }, { label: '10' }, { label: '15' }]} />
      )
    });
  }

  // Build positives list
  const positives = [];

  if (sodiumRaw != null && sodiumRaw <= 0.3) {
    positives.push({
      icon: '🧂', label: 'Sodium',
      subtitle: 'Low sodium',
      value: sodiumMg, unit: 'mg', level: 'good',
      expandContent: ({ markerColor }) => (
        <GradientBar value={sodiumMg ?? 0} min={0} max={270} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '55' }, { label: '110' }, { label: '190' }, { label: '270' }]} />
      )
    });
  }

  if (satFat != null && satFat <= 5) {
    positives.push({
      icon: '💧', label: 'Saturated fat',
      subtitle: 'Low impact',
      value: satFat, unit: 'g', level: 'good',
      expandContent: ({ markerColor }) => (
        <GradientBar value={satFat} min={0} max={5} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '1.2' }, { label: '2.5' }, { label: '3.8' }, { label: '5' }]} />
      )
    });
  }

  if (fiber != null && fiber >= 3) {
    positives.push({
      icon: '🌾', label: 'Fiber',
      subtitle: 'Excellent amount of fiber',
      value: fiber, unit: 'g', level: 'good',
      expandContent: ({ markerColor }) => (
        <GradientBar value={fiber} min={0} max={10} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '2.5' }, { label: '5' }, { label: '7.5' }, { label: '10' }]} />
      )
    });
  }

  if (protein != null && protein >= 5) {
    positives.push({
      icon: '🐟', label: 'Protein',
      subtitle: protein >= 10 ? 'Excellent source of protein' : 'Good source of protein',
      value: protein, unit: 'g', level: 'good',
      expandContent: ({ markerColor }) => (
        <GradientBar value={protein} min={0} max={30} markerColor={markerColor}
          thresholds={[{ label: '0' }, { label: '7' }, { label: '15' }, { label: '22' }, { label: '30' }]} />
      )
    });
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-5 flex items-start gap-4">
        {product.image_front_small_url && (
          <img src={product.image_front_small_url} alt={product.product_name}
            className="w-24 h-24 rounded-2xl object-contain bg-gray-50 border border-gray-100 p-1 shrink-0" />
        )}
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-xl font-black text-gray-900 leading-tight">{product.product_name || 'Unknown Product'}</p>
          <p className="text-sm text-gray-400 mt-1">{product.brands || ''}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-5 h-5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: scoreColor }} />
            <span className="text-3xl font-black text-gray-900">{score}/100</span>
          </div>
          <span className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Negatives */}
      {negatives.length > 0 && (
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl font-black text-gray-900">Negatives</p>
            <span className="text-xs text-gray-400">per 100g</span>
          </div>
          <div>
            {negatives.map((item, i) => (
              <NutrientRow key={i} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Positives */}
      {positives.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl font-black text-gray-900">Positives</p>
            <span className="text-xs text-gray-400">per 100g</span>
          </div>
          <div>
            {positives.map((item, i) => (
              <NutrientRow key={i} {...item} />
            ))}
          </div>
        </div>
      )}

      {negatives.length === 0 && positives.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-8 px-5">Insufficient nutritional data to analyze</p>
      )}

      {/* Full Nutrition Facts */}
      <div className="mx-5 mt-5 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 px-4 py-3">
          <p className="text-white font-black text-sm uppercase tracking-widest">Nutrition Facts</p>
          <p className="text-gray-400 text-xs">per 100g</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Energy', value: calories, unit: ' kcal' },
            { label: 'Total Fat', value: totalFat, unit: 'g' },
            { label: 'Saturated Fat', value: satFat, unit: 'g' },
            { label: 'Carbohydrates', value: carbs, unit: 'g' },
            { label: 'Sugars', value: sugar, unit: 'g' },
            { label: 'Fiber', value: fiber, unit: 'g' },
            { label: 'Protein', value: protein, unit: 'g' },
            { label: 'Salt', value: salt, unit: 'g' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2.5">
              <span className="text-sm text-gray-700">{row.label}</span>
              <span className="text-sm font-bold text-gray-900">{row.value != null ? `${row.value}${row.unit}` : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Allergens */}
      {allergens.length > 0 && (
        <div className="mx-5 mt-5 bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-2">⚠ Allergens</p>
          <div className="flex flex-wrap gap-1.5">
            {allergens.map((a, i) => (
              <span key={i} className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold capitalize">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      {product.ingredients_text && (
        <div className="mx-5 mt-5 rounded-2xl border border-gray-100 overflow-hidden">
          <button onClick={() => setShowIngredients(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white">
            <span className="text-sm font-bold text-gray-800">Ingredients</span>
            {showIngredients ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showIngredients && (
            <div className="px-4 pb-4 bg-gray-50">
              <p className="text-xs text-gray-600 leading-relaxed">{product.ingredients_text}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] text-gray-300 text-center mt-6 pb-2 px-5">
        Data sourced from Open Food Facts · Score is an estimate only and not medical advice
      </p>
    </div>
  );
}


// --- Barcode Scanner using ZXing ---
function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current,
      (result, err) => {
        if (result) {
          codeReader.reset();
          onDetected(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          setError('Camera error: ' + err.message);
        }
      }
    ).catch(() => {
      setError('Camera access denied. Please allow camera permission or use manual entry below.');
    });

    return () => { codeReader.reset(); };
  }, [onDetected]);

  return (
    <div className="flex flex-col items-center gap-4 p-5">
      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 text-center">{error}</div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-32">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-teal-400/60 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      {!error && (
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center">Point camera at barcode</p>
      )}
    </div>
  );
}

export default function ScanLabel({ onClose }) {
  const [phase, setPhase] = useState('scan');
  const [manualBarcode, setManualBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const lookup = useCallback(async (barcode) => {
    setPhase('loading');
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        setProduct(json.product);
        setPhase('result');
      } else {
        setErrorMsg(`No product found for barcode ${barcode}. Try another or check the number.`);
        setPhase('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setPhase('error');
    }
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) lookup(manualBarcode.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ height: '92dvh', maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between shrink-0 rounded-t-[2.5rem] sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Barcode className="w-5 h-5 text-teal-400" />
            <h3 className="text-white font-bold text-base uppercase tracking-widest">
              {phase === 'result' ? 'Product Info' : 'Scan Barcode'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

          {phase === 'scan' && (
            <div>
              <CameraScanner onDetected={lookup} />
              <div className="px-5 pb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">or enter barcode manually</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 0123456789012"
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                    value={manualBarcode}
                    onChange={e => setManualBarcode(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition">
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Looking up product...</p>
            </div>
          )}

          {phase === 'result' && product && (
            <div className="pb-6">
              <ProductResult product={product} />
              <div className="px-5 pt-2">
                <button onClick={() => { setPhase('scan'); setProduct(null); }}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition flex items-center justify-center gap-2">
                  <ScanLine className="w-4 h-4" /> Scan Another
                </button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-sm font-bold text-gray-700">{errorMsg}</p>
              <button onClick={() => setPhase('scan')}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}