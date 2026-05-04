import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, ScanLine, RotateCcw, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NUTRITION_SCHEMA = {
  type: "object",
  properties: {
    product_name: { type: "string" },
    serving_size: { type: "string" },
    calories: { type: "number" },
    total_fat: { type: "number" },
    saturated_fat: { type: "number" },
    trans_fat: { type: "number" },
    cholesterol: { type: "number" },
    sodium: { type: "number" },
    total_carbs: { type: "number" },
    dietary_fiber: { type: "number" },
    total_sugar: { type: "number" },
    added_sugar: { type: "number" },
    protein: { type: "number" },
    vitamin_d: { type: "number" },
    calcium: { type: "number" },
    iron: { type: "number" },
    potassium: { type: "number" },
    ingredients: { type: "string" },
    allergens: { type: "string" },
    health_notes: { type: "string" }
  }
};

function NutritionResult({ data, onReset }) {
  const macros = [
    { label: 'Calories', value: data.calories, unit: '', highlight: true },
    { label: 'Total Fat', value: data.total_fat, unit: 'g' },
    { label: 'Saturated Fat', value: data.saturated_fat, unit: 'g', indent: true },
    { label: 'Trans Fat', value: data.trans_fat, unit: 'g', indent: true },
    { label: 'Cholesterol', value: data.cholesterol, unit: 'mg' },
    { label: 'Sodium', value: data.sodium, unit: 'mg' },
    { label: 'Total Carbs', value: data.total_carbs, unit: 'g' },
    { label: 'Dietary Fiber', value: data.dietary_fiber, unit: 'g', indent: true },
    { label: 'Total Sugar', value: data.total_sugar, unit: 'g', indent: true },
    { label: 'Added Sugar', value: data.added_sugar, unit: 'g', indent: true },
    { label: 'Protein', value: data.protein, unit: 'g' },
  ];

  const micros = [
    { label: 'Vitamin D', value: data.vitamin_d, unit: 'mcg' },
    { label: 'Calcium', value: data.calcium, unit: 'mg' },
    { label: 'Iron', value: data.iron, unit: 'mg' },
    { label: 'Potassium', value: data.potassium, unit: 'mg' },
  ].filter(m => m.value != null && m.value > 0);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-1">Scanned Product</p>
          <h3 className="text-lg font-bold uppercase tracking-tight leading-snug">{data.product_name || 'Food Item'}</h3>
          {data.serving_size && (
            <p className="text-slate-400 text-xs mt-1">Serving size: {data.serving_size}</p>
          )}
        </div>
        <button onClick={onReset} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Macros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nutrition Facts</p>
        </div>
        <div className="divide-y divide-gray-50">
          {macros.map(({ label, value, unit, highlight, indent }) => {
            if (value == null) return null;
            return (
              <div key={label} className={`flex justify-between items-center px-5 py-2.5 ${highlight ? 'bg-teal-50' : ''}`}>
                <span className={`text-sm font-bold text-gray-700 ${indent ? 'pl-4 font-medium text-gray-500' : ''}`}>{label}</span>
                <span className={`text-sm font-bold ${highlight ? 'text-teal-700 text-base' : 'text-gray-800'}`}>
                  {value}{unit}
                </span>
              </div>
            );
          })}
        </div>

        {micros.length > 0 && (
          <>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Micronutrients</p>
            </div>
            <div className="divide-y divide-gray-50">
              {micros.map(({ label, value, unit }) => (
                <div key={label} className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm font-bold text-gray-700">{label}</span>
                  <span className="text-sm font-bold text-gray-800">{value}{unit}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ingredients */}
      {data.ingredients && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-2">Ingredients</p>
          <p className="text-xs text-teal-900 leading-relaxed">{data.ingredients}</p>
        </div>
      )}

      {/* Allergens */}
      {data.allergens && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">Allergens</p>
            <p className="text-xs text-red-800">{data.allergens}</p>
          </div>
        </div>
      )}

      {/* Health notes */}
      {data.health_notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Health Notes</p>
          <p className="text-xs text-amber-900 leading-relaxed">{data.health_notes}</p>
        </div>
      )}

      <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        ⚠️ AI estimates only — not medical advice
      </p>
    </div>
  );
}

export default function ScanLabel({ onClose }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setImage(URL.createObjectURL(file));
    setLoading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      const data = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `You are a nutrition label reader. Look at this food product image and extract ALL nutritional information visible on the label. If this is a food product, extract every nutrient listed. If values are not visible or not applicable, omit them. Also provide a brief health_notes field (1 sentence) summarizing whether this is a healthy or indulgent choice. Return as JSON only.`,
        file_urls: [file_url],
        response_json_schema: NUTRITION_SCHEMA
      });

      setResult(data);
    } catch (err) {
      setError('Could not read the label. Try a clearer photo of the nutrition facts panel.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-50 rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/20 p-2 rounded-xl">
              <ScanLine className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-white font-bold uppercase tracking-widest text-sm">Scan Food Label</h2>
              <p className="text-slate-400 text-[10px]">Upload a photo for instant nutrition info</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!image && !loading && !result && (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-500 font-medium pt-2">
                Take a photo or upload an image of any food label, snack, or drink to get instant nutritional info.
              </p>

              {/* Camera capture (mobile) */}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full p-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm transition active:scale-95 shadow-lg"
              >
                <Camera className="w-5 h-5" /> Take a Photo
              </button>

              {/* File upload */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-5 bg-white border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-600 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm transition active:scale-95"
              >
                <Upload className="w-5 h-5 text-teal-500" /> Upload from Library
              </button>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">Tip: For best results, photograph the nutrition facts panel directly</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {image && <img src={image} alt="Scanning" className="w-32 h-32 object-cover rounded-2xl shadow-md opacity-60" />}
              <div className="flex items-center gap-3 text-teal-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-bold uppercase tracking-widest text-sm">Analyzing label with AI...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              {image && <img src={image} alt="Uploaded" className="w-full rounded-2xl shadow-md max-h-48 object-cover" />}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                <p className="text-red-700 font-bold text-sm">{error}</p>
                <button onClick={reset} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {result && <NutritionResult data={result} onReset={reset} />}
        </div>
      </div>
    </div>
  );
}