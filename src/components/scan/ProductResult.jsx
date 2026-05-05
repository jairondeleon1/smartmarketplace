import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function GradientBar({ value, min, max, thresholds, markerColor }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="mt-3 mb-1">
      <div className="relative h-2.5 rounded-full overflow-visible" style={{ background: 'linear-gradient(to right, #22c55e 0%, #22c55e 30%, #f59e0b 55%, #ef4444 80%, #dc2626 100%)' }}>
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
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {value != null && <span className="text-sm text-gray-500">{value}{unit}</span>}
          <div className={`w-3.5 h-3.5 rounded-full ${dotColor} shrink-0`} />
          {expandContent && (open ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />)}
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

export default function ProductResult({ product }) {
  const [showIngredients, setShowIngredients] = useState(false);
  const score = product.health_score ?? 0;
  const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : score >= 25 ? '#ea580c' : '#dc2626';
  const scoreLabel = product.score_label || (score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : score >= 25 ? 'Poor' : 'Bad');

  const { calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, additives = [], allergens = [] } = product;

  const negatives = [];
  const positives = [];

  if (additives.length > 0) {
    negatives.push({ icon: '🧪', label: 'Additives', subtitle: additives.length > 3 ? 'Contains additives to avoid' : 'Contains some additives', value: additives.length, unit: '', level: additives.length > 3 ? 'bad' : 'moderate' });
  }
  if (sugar != null && sugar > 12) negatives.push({ icon: '🍬', label: 'Sugar', subtitle: sugar > 22.5 ? 'Too sweet' : 'Moderately sweet', value: sugar, unit: 'g', level: sugar > 22.5 ? 'bad' : 'moderate', expandContent: ({ markerColor }) => <GradientBar value={sugar} min={0} max={30} markerColor={markerColor} thresholds={[{label:'0'},{label:'7'},{label:'15'},{label:'22'},{label:'30+'}]} /> });
  if (calories != null && calories > 250) negatives.push({ icon: '🔥', label: 'Calories', subtitle: calories > 400 ? 'Very caloric' : 'A bit too caloric', value: calories, unit: ' Cal', level: calories > 400 ? 'bad' : 'moderate', expandContent: ({ markerColor }) => <GradientBar value={calories} min={0} max={500} markerColor={markerColor} thresholds={[{label:'0'},{label:'125'},{label:'250'},{label:'375'},{label:'500'}]} /> });
  if (sodium != null && sodium > 300) negatives.push({ icon: '🧂', label: 'Sodium', subtitle: sodium > 600 ? 'Too salty' : 'Moderately salty', value: sodium, unit: 'mg', level: sodium > 600 ? 'bad' : 'moderate', expandContent: ({ markerColor }) => <GradientBar value={sodium} min={0} max={700} markerColor={markerColor} thresholds={[{label:'0'},{label:'175'},{label:'350'},{label:'525'},{label:'700'}]} /> });
  if (saturated_fat != null && saturated_fat > 5) negatives.push({ icon: '🥩', label: 'Saturated fat', subtitle: saturated_fat > 10 ? 'High saturated fat' : 'Moderate saturated fat', value: saturated_fat, unit: 'g', level: saturated_fat > 10 ? 'bad' : 'moderate' });

  if (sodium != null && sodium <= 300) positives.push({ icon: '🧂', label: 'Sodium', subtitle: 'Low sodium', value: sodium, unit: 'mg', level: 'good' });
  if (fiber != null && fiber >= 3) positives.push({ icon: '🌾', label: 'Fiber', subtitle: 'Good fiber content', value: fiber, unit: 'g', level: 'good' });
  if (protein != null && protein >= 5) positives.push({ icon: '💪', label: 'Protein', subtitle: 'Good protein source', value: protein, unit: 'g', level: 'good' });
  if (saturated_fat != null && saturated_fat <= 5) positives.push({ icon: '💧', label: 'Saturated fat', subtitle: 'Low impact', value: saturated_fat, unit: 'g', level: 'good' });

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-5 flex items-start gap-4">
        {product.front_image_url && (
          <img src={product.front_image_url} alt={product.name}
            className="w-24 h-24 rounded-2xl object-contain bg-gray-50 border border-gray-100 p-1 shrink-0" />
        )}
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-xl font-black text-gray-900 leading-tight">{product.name || 'Unknown Product'}</p>
          <p className="text-sm text-gray-400 mt-1">{product.brand || ''}</p>
          {product.category && <p className="text-xs text-teal-600 font-bold mt-1 uppercase tracking-widest">{product.category}</p>}
          <div className="flex items-center gap-2 mt-3">
            <div className="w-5 h-5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: scoreColor }} />
            <span className="text-3xl font-black text-gray-900">{score}/100</span>
          </div>
          <span className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
        </div>
      </div>

      {/* AI Analysis */}
      {product.ai_analysis && (
        <div className="mx-5 mb-4 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
          <p className="text-xs font-black uppercase tracking-widest text-teal-700 mb-1">AI Analysis</p>
          <p className="text-sm text-teal-900 leading-relaxed">{product.ai_analysis}</p>
        </div>
      )}

      <div className="border-t border-gray-100" />

      {negatives.length > 0 && (
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl font-black text-gray-900">Negatives</p>
            <span className="text-xs text-gray-400">per serving</span>
          </div>
          {negatives.map((item, i) => <NutrientRow key={i} {...item} />)}
        </div>
      )}

      {positives.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl font-black text-gray-900">Positives</p>
            <span className="text-xs text-gray-400">per serving</span>
          </div>
          {positives.map((item, i) => <NutrientRow key={i} {...item} />)}
        </div>
      )}

      {/* Nutrition Facts */}
      <div className="mx-5 mt-5 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 px-4 py-3">
          <p className="text-white font-black text-sm uppercase tracking-widest">Nutrition Facts</p>
          <p className="text-gray-400 text-xs">per serving</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Calories', value: calories, unit: ' kcal' },
            { label: 'Total Fat', value: fat, unit: 'g' },
            { label: 'Saturated Fat', value: saturated_fat, unit: 'g' },
            { label: 'Carbohydrates', value: carbs, unit: 'g' },
            { label: 'Sugars', value: sugar, unit: 'g' },
            { label: 'Fiber', value: fiber, unit: 'g' },
            { label: 'Protein', value: protein, unit: 'g' },
            { label: 'Sodium', value: sodium, unit: 'mg' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2.5">
              <span className="text-sm text-gray-700">{row.label}</span>
              <span className="text-sm font-bold text-gray-900">{row.value != null && row.value > 0 ? `${row.value}${row.unit}` : '—'}</span>
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

      {/* Additives */}
      {additives.length > 0 && (
        <div className="mx-5 mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">🧪 Additives ({additives.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {additives.map((a, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">{a}</span>
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
        Score computed by AI from label photos · Not medical advice
      </p>
    </div>
  );
}