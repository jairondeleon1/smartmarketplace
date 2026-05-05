import React, { useState, useRef } from 'react';
import { Loader2, CheckCircle, Camera, ChevronRight, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = ['promise', 'general', 'front_photo', 'ingredients_photo', 'nutrition_photo', 'category', 'analyzing', 'done'];

const CATEGORIES = [
  'Cookies & Biscuits', 'Cereals', 'Chips & Snacks', 'Candy & Chocolate',
  'Beverages', 'Dairy', 'Bread & Bakery', 'Frozen Foods',
  'Sauces & Condiments', 'Canned Foods', 'Protein Bars', 'Other'
];

function PhotoStep({ title, instruction, icon, onPhoto, photoUrl, onNext }) {
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturing(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onPhoto(result.file_url);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Instruction modal feel */}
      {!photoUrl && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 gap-5 text-center">
          <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center text-4xl">
            {icon}
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{title}</p>
            <p className="text-sm text-gray-500 mt-2">{instruction}</p>
          </div>
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={capturing}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {capturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {capturing ? 'Uploading...' : 'Take Photo'}
          </button>
        </div>
      )}

      {photoUrl && (
        <div className="flex flex-col flex-1 px-5 py-6 gap-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-teal-200">
            <img src={photoUrl} alt={title} className="w-full object-contain max-h-72" />
            <button
              onClick={() => onPhoto(null)}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <p className="text-xs text-teal-700 font-bold text-center">✓ Photo captured</p>
          <button
            onClick={onNext}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddProductFlow({ barcode, onComplete, onCancel }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState({
    name: '',
    brand: '',
    category: '',
    frontImageUrl: null,
    ingredientsImageUrl: null,
    nutritionImageUrl: null,
  });
  const [error, setError] = useState('');

  const step = STEPS[stepIndex];
  const next = () => setStepIndex(i => i + 1);

  const handleAnalyze = async () => {
    setStepIndex(STEPS.indexOf('analyzing'));
    try {
      const response = await base44.functions.invoke('analyzeProduct', {
        barcode,
        name: data.name,
        brand: data.brand,
        category: data.category,
        frontImageUrl: data.frontImageUrl,
        ingredientsImageUrl: data.ingredientsImageUrl,
        nutritionImageUrl: data.nutritionImageUrl,
      });

      const result = response.data;
      if (!result.success) throw new Error(result.error);

      const ai = result.data;

      // Save to our database
      const saved = await base44.entities.ScannedProduct.create({
        barcode,
        name: data.name,
        brand: data.brand,
        category: data.category,
        front_image_url: data.frontImageUrl,
        ingredients_image_url: data.ingredientsImageUrl,
        nutrition_image_url: data.nutritionImageUrl,
        ingredients_text: ai.ingredients_text || '',
        allergens: ai.allergens || [],
        additives: ai.additives || [],
        calories: ai.calories || 0,
        protein: ai.protein || 0,
        carbs: ai.carbs || 0,
        fat: ai.fat || 0,
        saturated_fat: ai.saturated_fat || 0,
        sodium: ai.sodium || 0,
        fiber: ai.fiber || 0,
        sugar: ai.sugar || 0,
        health_score: ai.health_score || 0,
        score_label: ai.score_label || 'Unknown',
        ai_analysis: ai.ai_analysis || '',
      });

      setStepIndex(STEPS.indexOf('done'));
      setTimeout(() => onComplete(saved), 1800);
    } catch (err) {
      setError(err.message);
      setStepIndex(STEPS.indexOf('category'));
    }
  };

  // Progress bar
  const progressSteps = ['general', 'front_photo', 'ingredients_photo', 'nutrition_photo', 'category'];
  const progressPct = Math.round(((progressSteps.indexOf(step) + 1) / progressSteps.length) * 100);

  return (
    <div className="flex flex-col min-h-full">
      {/* Progress bar (only during data entry) */}
      {progressSteps.includes(step) && (
        <div className="px-5 pt-4 pb-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* STEP: Promise */}
      {step === 'promise' && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 gap-6 text-center">
          <div className="text-6xl">🥕</div>
          <div>
            <p className="text-2xl font-black text-gray-900">We value your contribution</p>
            <div className="mt-4 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">Make sure the information is accurate. It will be shared with the community.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">Only add food products.</p>
              </div>
            </div>
          </div>
          <button onClick={next} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition">
            I Promise!
          </button>
        </div>
      )}

      {/* STEP: General info */}
      {step === 'general' && (
        <div className="flex flex-col flex-1 px-5 py-6 gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">General Information</p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center border-b border-gray-100 px-4 py-3.5">
              <span className="text-sm font-bold text-gray-700 w-16 shrink-0">Name</span>
              <input
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-300 font-medium"
                placeholder="Product name"
                value={data.name}
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center px-4 py-3.5">
              <span className="text-sm font-bold text-gray-700 w-16 shrink-0">Brand</span>
              <input
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-300 font-medium"
                placeholder="Brand name"
                value={data.brand}
                onChange={e => setData(d => ({ ...d, brand: e.target.value }))}
              />
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
          <button
            onClick={next}
            disabled={!data.name.trim()}
            className="mt-auto w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* STEP: Front photo */}
      {step === 'front_photo' && (
        <PhotoStep
          title="Front of pack"
          instruction="Take a photo of the front of the product and crop if necessary"
          icon="📦"
          photoUrl={data.frontImageUrl}
          onPhoto={url => setData(d => ({ ...d, frontImageUrl: url }))}
          onNext={next}
        />
      )}

      {/* STEP: Ingredients photo */}
      {step === 'ingredients_photo' && (
        <PhotoStep
          title="List of ingredients"
          instruction="Take a photo of the ingredients and crop if necessary"
          icon="🏷️"
          photoUrl={data.ingredientsImageUrl}
          onPhoto={url => setData(d => ({ ...d, ingredientsImageUrl: url }))}
          onNext={next}
        />
      )}

      {/* STEP: Nutrition photo */}
      {step === 'nutrition_photo' && (
        <PhotoStep
          title="Nutrition facts"
          instruction="Take a photo of the nutrition chart and crop if necessary"
          icon="📊"
          photoUrl={data.nutritionImageUrl}
          onPhoto={url => setData(d => ({ ...d, nutritionImageUrl: url }))}
          onNext={next}
        />
      )}

      {/* STEP: Category */}
      {step === 'category' && (
        <div className="flex flex-col flex-1 px-5 py-6 gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Product Category</p>
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 font-bold">{error}</div>
          )}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setData(d => ({ ...d, category: cat }))}
                className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${data.category === cat ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!data.category}
            className="mt-auto w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition disabled:opacity-40"
          >
            Analyze with AI
          </button>
        </div>
      )}

      {/* STEP: Analyzing */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-6">
          <Loader2 className="w-14 h-14 text-teal-500 animate-spin" />
          <div>
            <p className="text-lg font-black text-gray-900">Analyzing Product</p>
            <p className="text-sm text-gray-400 mt-2">AI is reading the labels and computing the health score...</p>
          </div>
        </div>
      )}

      {/* STEP: Done */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-6">
          <div className="w-24 h-24 rounded-full border-4 border-teal-500 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-teal-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">Perfect!</p>
            <p className="text-sm text-gray-400 mt-2">The product is now rated 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
}