import React, { useState } from 'react';
import { Flame, Sandwich, Salad, Upload, Loader2, CheckCircle, XCircle, Sparkles, Calendar, AlertTriangle, FileText, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATIONS = [
  { id: 'grill', label: 'Grill', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', activeBg: 'bg-orange-600' },
  { id: 'deli', label: 'Deli', icon: Sandwich, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-700' },
  { id: 'salad-bar', label: 'Salad Bar', icon: Salad, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-700' },
];

function StationSync({ station, onItemsPublished }) {
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, allergen: null, ingredients: null });
  const [isSyncing, setIsSyncing] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');

  const uploadFile = async (file) => {
    if (!file) throw new Error('No file provided');
    if (file.size > 15 * 1024 * 1024) throw new Error(`File too large (max 15MB).`);
    const result = await base44.integrations.Core.UploadFile({ file });
    if (!result?.file_url) throw new Error('Upload failed - no URL returned');
    return result.file_url;
  };

  const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSyncing(type);
    try {
      if (type === 'ingredients') {
        const text = await readFileAsText(file);
        setUploadedFiles(prev => ({ ...prev, ingredients: text }));
      } else {
        const url = await uploadFile(file);
        setUploadedFiles(prev => ({ ...prev, [type]: url }));
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsSyncing(null);
      e.target.value = '';
    }
  };

  const invokeLLMWithRetry = async (params, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await base44.integrations.Core.InvokeLLM(params);
      } catch (err) {
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      }
    }
  };

  const handleProcessAndPublish = async () => {
    if (!uploadedFiles.weekMenu && !uploadedFiles.fda && !uploadedFiles.allergen && !uploadedFiles.ingredients) {
      alert('Please upload at least one file to process'); return;
    }
    setIsPublishing(true); setProgress(0);

    let finalItems = [];

    try {
      if (uploadedFiles.weekMenu) {
        setProgressStep('Step 1: Parsing menu PDF...'); setProgress(20);
        const weekResult = await invokeLLMWithRetry({
          prompt: `Extract ALL food item names from this ${station.label} menu document. For each item return: name, recipe_number (or empty string), description (or empty string). Return as JSON array of all items found.`,
          file_urls: [uploadedFiles.weekMenu],
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, description: { type: "string" } } } } } }
        });
        if (weekResult?.items) finalItems = weekResult.items;
      }
      setProgress(35);

      if (uploadedFiles.fda && finalItems.length > 0) {
        setProgressStep('Step 2: Matching FDA nutrition data...'); setProgress(50);
        const fdaResult = await invokeLLMWithRetry({
          prompt: `Extract nutrition data: name, recipe_number, calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, cholesterol, vitamin_a, vitamin_c, vitamin_d, calcium, iron, potassium. Return as JSON.`,
          file_urls: [uploadedFiles.fda],
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, saturated_fat: { type: "number" }, sodium: { type: "number" }, fiber: { type: "number" }, sugar: { type: "number" }, cholesterol: { type: "number" }, vitamin_a: { type: "number" }, vitamin_c: { type: "number" }, vitamin_d: { type: "number" }, calcium: { type: "number" }, iron: { type: "number" }, potassium: { type: "number" } } } } } }
        });
        if (fdaResult?.items) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const itemNameLower = item.name?.toLowerCase().trim() || '';
            const match = fdaResult.items.find(f =>
              (norm(f.recipe_number) && norm(f.recipe_number) === norm(item.recipe_number)) ||
              f.name?.toLowerCase().trim() === itemNameLower ||
              f.name?.toLowerCase().includes(itemNameLower.slice(0, 12)) ||
              itemNameLower.includes(f.name?.toLowerCase().trim().slice(0, 12))
            );
            if (match) {
              const sat = match.saturated_fat || 0; const total = match.fat || 0;
              return { ...item, calories: match.calories || 0, protein: match.protein || 0, carbs: match.carbs || 0, fat: total, saturated_fat: sat, unsaturated_fat: total > sat ? total - sat : 0, sodium: match.sodium || 0, fiber: match.fiber || 0, sugar: match.sugar || 0, cholesterol: match.cholesterol || 0, vitamin_a: match.vitamin_a || 0, vitamin_c: match.vitamin_c || 0, vitamin_d: match.vitamin_d || 0, calcium: match.calcium || 0, iron: match.iron || 0, potassium: match.potassium || 0 };
            }
            return item;
          });
        }
      }
      setProgress(65);

      if (uploadedFiles.allergen && finalItems.length > 0) {
        setProgressStep('Step 3: Matching allergen data...'); setProgress(70);
        const allergenResult = await invokeLLMWithRetry({
          prompt: `Extract allergen and dietary tag information for each menu item. Return recipe_number, allergens (array), tags (array like Vegetarian, Vegan, Fit, Dairy Free) as JSON.`,
          file_urls: [uploadedFiles.allergen],
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { recipe_number: { type: "string" }, allergens: { type: "array", items: { type: "string" } }, tags: { type: "array", items: { type: "string" } } } } } } }
        });
        if (allergenResult?.items) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const match = allergenResult.items.find(a => norm(a.recipe_number) === norm(item.recipe_number));
            if (match) return { ...item, allergens: match.allergens || [], tags: match.tags || [] };
            return item;
          });
        }
      }
      setProgress(80);

      if (uploadedFiles.ingredients && finalItems.length > 0) {
        setProgressStep('Step 4: Matching ingredients...'); setProgress(85);
        const csvChunk = uploadedFiles.ingredients.slice(0, 8000);
        const ingResult = await invokeLLMWithRetry({
          prompt: `Parse this CSV. Extract recipe_number, ingredients, is_vegan, is_vegetarian, is_fit for each row. Return ALL rows as JSON.\n\n${csvChunk}`,
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { recipe_number: { type: "string" }, ingredients: { type: "string" }, is_vegan: { type: "boolean" }, is_vegetarian: { type: "boolean" }, is_fit: { type: "boolean" } } } } } }
        });
        if (ingResult?.items) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '');
          finalItems = finalItems.map(item => {
            const match = ingResult.items.find(i => norm(i.recipe_number) === norm(item.recipe_number));
            if (match?.ingredients?.length > 5) {
              const csvTags = [];
              if (match.is_vegan) csvTags.push('Vegan');
              if (match.is_vegetarian) csvTags.push('Vegetarian');
              if (match.is_fit) csvTags.push('Fit');
              return { ...item, ingredients: match.ingredients.trim(), tags: [...new Set([...(item.tags || []), ...csvTags])] };
            }
            return item;
          });
        }
      }
      setProgress(95);

      // Add station and day to items
      finalItems = finalItems.map(item => ({
        ...item,
        station: station.label,
        day: 'Daily Special',
        meal_period: 'Lunch',
      }));

      setProgressStep('Saving to database...'); setProgress(97);

      // Delete existing CoreMenuItems for this station, then bulk-create new ones
      const existing = await base44.entities.CoreMenuItem.list();
      const stationExisting = existing.filter(i => i.station === station.label);
      if (stationExisting.length > 0) {
        await Promise.all(stationExisting.map(item => base44.entities.CoreMenuItem.delete(item.id)));
      }

      // Strip day/meal_period — CoreMenuItems are permanent, not day-specific
      const coreItems = finalItems.map(({ day, meal_period, unsaturated_fat, ...rest }) => ({
        ...rest,
        station: station.label,
      }));
      await base44.entities.CoreMenuItem.bulkCreate(coreItems);

      setProgress(100);
      setProgressStep('');
      setUploadedFiles({ weekMenu: null, fda: null, allergen: null, ingredients: null });
      alert(`✅ Published ${coreItems.length} ${station.label} items to the Core Menu popup!`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsPublishing(false);
      setProgress(0);
    }
  };

  const syncOptions = [
    { key: 'weekMenu', label: '1. Week Menu PDF', icon: Calendar, accept: '.pdf', desc: 'Menu items with recipe #s' },
    { key: 'fda', label: '2. FDA Nutrition File', icon: Sparkles, accept: '.pdf,.xlsx,.xls', desc: 'Match by recipe #' },
    { key: 'allergen', label: '3. Allergen PDF', icon: AlertTriangle, accept: '.pdf', desc: 'Match by recipe #' },
    { key: 'ingredients', label: '4. Ingredients CSV', icon: FileText, accept: '.csv', desc: 'Match by recipe #' },
  ];

  const hasAnyFile = Object.values(uploadedFiles).some(Boolean);

  return (
    <div className={`bg-white rounded-2xl border-2 ${station.border} p-5 space-y-4`}>
      {/* Station header */}
      <div className={`flex items-center gap-3 pb-3 border-b ${station.border}`}>
        <div className={`p-2 rounded-xl ${station.bg} border ${station.border}`}>
          <station.icon className={`w-5 h-5 ${station.color}`} />
        </div>
        <div>
          <h4 className={`font-bold text-sm uppercase tracking-widest ${station.color}`}>{station.label} Matrix Sync</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Upload station-specific files</p>
        </div>
      </div>

      {/* File upload buttons */}
      <div className="space-y-2">
        {syncOptions.map(opt => (
          <div key={opt.key}>
            <input type="file" accept={opt.accept} id={`core-${station.id}-${opt.key}`} className="hidden" onChange={(e) => handleFileUpload(e, opt.key)} />
            <label htmlFor={`core-${station.id}-${opt.key}`} className={`w-full p-4 border-2 border-dashed rounded-xl flex items-center gap-3 hover:${station.bg} transition cursor-pointer ${uploadedFiles[opt.key] ? `${station.border} ${station.bg}` : 'border-gray-100'}`}>
              {isSyncing === opt.key
                ? <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
                : uploadedFiles[opt.key]
                  ? <CheckCircle className={`w-5 h-5 ${station.color}`} />
                  : <Upload className="w-5 h-5 text-gray-300" />
              }
              <div className="flex-1 text-left">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-700">{opt.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
              </div>
              {uploadedFiles[opt.key] && <span className={`text-[10px] font-bold ${station.color} uppercase`}>✓ Ready</span>}
            </label>
          </div>
        ))}
      </div>

      {/* File status */}
      <div className={`${station.bg} border ${station.border} rounded-xl p-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Info className={`w-3.5 h-3.5 ${station.color}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${station.color}`}>Files Ready</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[['weekMenu', 'Week Menu'], ['fda', 'FDA Nutrition'], ['allergen', 'Allergen Data'], ['ingredients', 'Ingredients']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              {uploadedFiles[key] ? <CheckCircle className={`w-3 h-3 ${station.color}`} /> : <XCircle className="w-3 h-3 text-gray-300" />}
              <span className="text-[10px] text-gray-500 font-bold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Publish button */}
      {isPublishing ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className={`${station.activeBg} h-full transition-all duration-500 rounded-full`} style={{ width: `${progress}%` }} />
          </div>
          <div className={`flex items-center justify-center gap-2 text-xs ${station.color}`}>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-bold">{progressStep}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleProcessAndPublish}
          disabled={!hasAnyFile}
          className={`w-full py-3 ${station.activeBg} text-white rounded-xl font-bold uppercase text-xs tracking-widest disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 hover:opacity-90`}
        >
          <Sparkles className="w-4 h-4" /> Process & Publish {station.label}
        </button>
      )}
    </div>
  );
}

export default function CoreMenusSync({ onCoreItemsPublished }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Core Menu Station Sync</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {STATIONS.map(station => (
          <StationSync
            key={station.id}
            station={station}
            onItemsPublished={onCoreItemsPublished}
          />
        ))}
      </div>
    </div>
  );
}