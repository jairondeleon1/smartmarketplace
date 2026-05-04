import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ScanLine, Camera, Search, Loader2, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp, Barcode } from 'lucide-react';

// --- Health scoring (Nutri-Score inspired) ---
function calcHealthScore(product) {
  const { nutriments = {} } = product;
  const per100 = (key) => nutriments[`${key}_100g`] ?? nutriments[key] ?? null;

  let score = 100;
  const negatives = [];
  const positives = [];

  const sugar = per100('sugars');
  const satFat = per100('saturated-fat');
  const sodium = per100('sodium') ?? (per100('salt') != null ? per100('salt') / 2.5 : null);
  const calories = per100('energy-kcal') ?? (per100('energy') != null ? per100('energy') / 4.184 : null);
  const fiber = per100('fiber');
  const protein = per100('proteins');

  // Negatives
  if (calories != null) {
    if (calories > 400) { score -= 25; negatives.push({ label: 'High in calories', value: `${Math.round(calories)} kcal/100g`, level: 'bad' }); }
    else if (calories > 250) { score -= 10; negatives.push({ label: 'Moderate calories', value: `${Math.round(calories)} kcal/100g`, level: 'moderate' }); }
  }
  if (sugar != null) {
    if (sugar > 22.5) { score -= 25; negatives.push({ label: 'High in sugar', value: `${sugar}g/100g`, level: 'bad' }); }
    else if (sugar > 12) { score -= 10; negatives.push({ label: 'Moderate sugar', value: `${sugar}g/100g`, level: 'moderate' }); }
  }
  if (satFat != null) {
    if (satFat > 10) { score -= 20; negatives.push({ label: 'High in saturated fat', value: `${satFat}g/100g`, level: 'bad' }); }
    else if (satFat > 5) { score -= 8; negatives.push({ label: 'Moderate saturated fat', value: `${satFat}g/100g`, level: 'moderate' }); }
  }
  if (sodium != null) {
    if (sodium > 0.6) { score -= 20; negatives.push({ label: 'High in salt', value: `${(sodium * 2.5).toFixed(2)}g salt/100g`, level: 'bad' }); }
    else if (sodium > 0.3) { score -= 8; negatives.push({ label: 'Moderate salt', value: `${(sodium * 2.5).toFixed(2)}g salt/100g`, level: 'moderate' }); }
  }

  // Positives
  if (fiber != null && fiber >= 3) { score += 5; positives.push({ label: 'Good source of fiber', value: `${fiber}g/100g` }); }
  if (protein != null && protein >= 5) { score += 5; positives.push({ label: 'Good source of protein', value: `${protein}g/100g` }); }

  // Additives penalty
  const additives = product.additives_tags ?? [];
  if (additives.length > 3) { score -= 15; negatives.push({ label: `Contains ${additives.length} additives`, value: 'Check ingredients', level: 'bad' }); }
  else if (additives.length > 0) { score -= 5; negatives.push({ label: `Contains ${additives.length} additive${additives.length > 1 ? 's' : ''}`, value: 'Check ingredients', level: 'moderate' }); }

  return { score: Math.max(0, Math.min(100, score)), negatives, positives };
}

function ScoreRing({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : score >= 25 ? '#ea580c' : '#dc2626';
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : score >= 25 ? 'Poor' : 'Bad';
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}</text>
        <text x="50" y="62" textAnchor="middle" fontSize="11" fill="#6b7280">/100</text>
      </svg>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

function NutrientRow({ label, value, unit, per }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-xs font-bold text-gray-800">{value != null ? `${value}${unit}` : '—'} <span className="text-gray-400 font-normal">{per}</span></span>
    </div>
  );
}

function ProductResult({ product, onClose }) {
  const [showIngredients, setShowIngredients] = useState(false);
  const { score, negatives, positives } = calcHealthScore(product);
  const n = product.nutriments ?? {};
  const per = (key) => n[`${key}_100g`] ?? n[key] ?? null;
  const fmt = (v, d = 1) => v != null ? +v.toFixed(d) : null;

  const allergens = (product.allergens_hierarchy ?? []).map(a => a.replace('en:', ''));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {product.image_front_small_url && (
            <img src={product.image_front_small_url} alt={product.product_name} className="w-12 h-12 rounded-xl object-contain bg-white p-1" />
          )}
          <div>
            <p className="text-white font-bold text-sm leading-tight">{product.product_name || 'Unknown Product'}</p>
            <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">{product.brands || ''}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5 text-white" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Score */}
        <div className="flex items-center justify-center gap-8 bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <ScoreRing score={score} />
          <div className="space-y-1.5">
            {negatives.length === 0 && positives.length === 0 && (
              <p className="text-xs text-gray-400 italic">Insufficient data to score</p>
            )}
            {negatives.slice(0, 3).map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${n.level === 'bad' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="text-xs text-gray-700 font-medium">{n.label}</span>
              </div>
            ))}
            {positives.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs text-gray-700 font-medium">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition Facts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-3">Nutrition Facts (per 100g)</p>
          <NutrientRow label="Calories" value={fmt(per('energy-kcal') ?? (per('energy') != null ? per('energy') / 4.184 : null), 0)} unit=" kcal" />
          <NutrientRow label="Total Fat" value={fmt(per('fat'))} unit="g" />
          <NutrientRow label="Saturated Fat" value={fmt(per('saturated-fat'))} unit="g" />
          <NutrientRow label="Carbohydrates" value={fmt(per('carbohydrates'))} unit="g" />
          <NutrientRow label="Sugars" value={fmt(per('sugars'))} unit="g" />
          <NutrientRow label="Fiber" value={fmt(per('fiber'))} unit="g" />
          <NutrientRow label="Protein" value={fmt(per('proteins'))} unit="g" />
          <NutrientRow label="Salt" value={fmt(per('salt'))} unit="g" />
        </div>

        {/* Allergens */}
        {allergens.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Allergens</p>
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((a, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {product.ingredients_text && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button onClick={() => setShowIngredients(v => !v)} className="w-full flex items-center justify-between p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Ingredients</span>
              {showIngredients ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showIngredients && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-600 leading-relaxed">{product.ingredients_text}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-[9px] text-gray-400 text-center">Data from Open Food Facts · Score is an estimate only</p>
      </div>
    </div>
  );
}

// --- Barcode Scanner using camera + BarcodeDetector ---
function CameraScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setError('Camera access denied. Please allow camera permission or use the manual entry below.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });

    const scan = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !scanning) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          setScanning(false);
          stopCamera();
          onDetected(barcodes[0].rawValue);
          return;
        }
      } catch {}
      rafRef.current = requestAnimationFrame(scan);
    };
    rafRef.current = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scanning, onDetected, stopCamera]);

  return (
    <div className="flex flex-col items-center gap-4 p-5">
      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 text-center">{error}</div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {/* Viewfinder overlay */}
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
      {!error && !window.BarcodeDetector && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 text-center">
          Auto-detection not supported in this browser. Use the manual barcode entry below.
        </div>
      )}
      {!error && window.BarcodeDetector && (
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center">Point camera at barcode</p>
      )}
    </div>
  );
}

export default function ScanLabel({ onClose }) {
  const [phase, setPhase] = useState('scan'); // scan | loading | result | error | manual
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
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header (shown when not in result view) */}
        {phase !== 'result' && (
          <div className="bg-slate-900 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Barcode className="w-5 h-5 text-teal-400" />
              <h3 className="text-white font-bold text-base uppercase tracking-widest">Scan Barcode</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5 text-white" /></button>
          </div>
        )}

        {/* Camera scan phase */}
        {phase === 'scan' && (
          <div className="overflow-y-auto">
            <CameraScanner onDetected={lookup} onClose={onClose} />
            {/* Manual entry */}
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

        {/* Loading */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Looking up product...</p>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && product && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ProductResult product={product} onClose={onClose} />
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button onClick={() => { setPhase('scan'); setProduct(null); }} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition flex items-center justify-center gap-2">
                <ScanLine className="w-4 h-4" /> Scan Another
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-sm font-bold text-gray-700">{errorMsg}</p>
            <button onClick={() => setPhase('scan')} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}