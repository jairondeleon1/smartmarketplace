import React, { useState } from 'react';
import { Flame, Sandwich, Salad, Upload, Loader2, CheckCircle, XCircle, Sparkles, Calendar, AlertTriangle, FileText, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATIONS = [
  { id: 'grill', label: 'Grill', dbStation: 'Grill', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', activeBg: 'bg-orange-600' },
  { id: 'deli', label: 'Deli', dbStation: 'Deli', icon: Sandwich, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-700' },
  { id: 'salad-bar', label: 'Salad Bar', dbStation: 'Salad Bar', icon: Salad, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-700' },
];

function StationSync({ station }) {
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, allergen: null, ingredients: null });
  const [isSyncing, setIsSyncing] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');

  const uploadFile = async (file) => {
    if (!file) throw new Error('No file provided');
    if (file.size > 20 * 1024 * 1024) throw new Error('File too large (max 20MB).');
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

  const callLLM = async (params) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await base44.integrations.Core.InvokeLLM(params);
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  };

  const clearStation = async () => {
    const existing = await base44.entities.CoreMenuItem.filter({ station: station.dbStation });
    if (existing.length > 0) {
      await Promise.all(existing.map(i => base44.entities.CoreMenuItem.delete(i.id)));
    }
  };

  const saveItems = async (items) => {
    const toSave = items.map(({ day, meal_period, unsaturated_fat, id, ...rest }) => ({
      ...rest,
      station: station.dbStation,
    }));
    await base44.entities.CoreMenuItem.bulkCreate(toSave);
    return toSave;
  };

  const handleProcessAndPublish = async () => {
    if (!uploadedFiles.weekMenu && !uploadedFiles.fda) {
      alert('Please upload at least the Week Menu PDF to continue.');
      return;
    }

    setIsPublishing(true);
    setProgress(5);
    let finalItems = [];

    try {
      if (uploadedFiles.weekMenu) {
        setProgressStep('Parsing menu PDF...');
        setProgress(15);

        const result = await callLLM({
          prompt: `Extract EVERY food item from this ${station.label} station menu PDF. For each item provide: name, recipe_number (numeric code in parentheses or empty string), description (brief if available). Return ALL items as JSON.`,
          file_urls: [uploadedFiles.weekMenu],
          response_json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    recipe_number: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });

        if (!result?.items?.length) {
          alert('No items found in the menu PDF. Please check the file and try again.');
          return;
        }

        finalItems = result.items;
        setProgressStep(`Found ${finalItems.length} items. Saving...`);
        setProgress(35);
        await clearStation();
        await saveItems(finalItems);
        setProgress(40);
      }

      if (uploadedFiles.fda && finalItems.length > 0) {
        setProgressStep('Adding nutrition data...');
        setProgress(50);

        const fdaResult = await callLLM({
          prompt: `Extract nutrition data for menu items: name, recipe_number, calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, cholesterol. Return as JSON.`,
          file_urls: [uploadedFiles.fda],
          response_json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    recipe_number: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    saturated_fat: { type: "number" },
                    sodium: { type: "number" },
                    fiber: { type: "number" },
                    sugar: { type: "number" },
                    cholesterol: { type: "number" }
                  }
                }
              }
            }
          }
        });

        if (fdaResult?.items?.length > 0) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const itemName = item.name?.toLowerCase().trim() || '';
            const match = fdaResult.items.find(f =>
              (norm(f.recipe_number) && norm(f.recipe_number) === norm(item.recipe_number)) ||
              f.name?.toLowerCase().trim() === itemName
            );
            if (match) {
              return { ...item, calories: match.calories || 0, protein: match.protein || 0, carbs: match.carbs || 0, fat: match.fat || 0, saturated_fat: match.saturated_fat || 0, sodium: match.sodium || 0, fiber: match.fiber || 0, sugar: match.sugar || 0, cholesterol: match.cholesterol || 0 };
            }
            return item;
          });
          setProgress(62);
          await clearStation();
          await saveItems(finalItems);
        }
      }

      if (uploadedFiles.allergen && finalItems.length > 0) {
        setProgressStep('Adding allergen data...');
        setProgress(70);

        const allergenResult = await callLLM({
          prompt: `Extract allergen info: recipe_number, allergens (array), tags (array like Vegetarian, Vegan, Fit, Dairy Free). Return as JSON.`,
          file_urls: [uploadedFiles.allergen],
          response_json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    recipe_number: { type: "string" },
                    allergens: { type: "array", items: { type: "string" } },
                    tags: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          }
        });

        if (allergenResult?.items?.length > 0) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const match = allergenResult.items.find(a => norm(a.recipe_number) === norm(item.recipe_number));
            if (match) return { ...item, allergens: match.allergens || [], tags: match.tags || [] };
            return item;
          });
          setProgress(82);
          await clearStation();
          await saveItems(finalItems);
        }
      }

      if (uploadedFiles.ingredients && finalItems.length > 0) {
        setProgressStep('Adding ingredients...');
        setProgress(88);

        const csvChunk = uploadedFiles.ingredients.slice(0, 8000);
        const ingResult = await callLLM({
          prompt: `Parse this CSV and extract: recipe_number, ingredients, is_vegan, is_vegetarian, is_fit for each row. Return ALL rows as JSON.\n\n${csvChunk}`,
          response_json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    recipe_number: { type: "string" },
                    ingredients: { type: "string" },
                    is_vegan: { type: "boolean" },
                    is_vegetarian: { type: "boolean" },
                    is_fit: { type: "boolean" }
                  }
                }
              }
            }
          }
        });

        if (ingResult?.items?.length > 0) {
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
          setProgress(95);
          await clearStation();
          await saveItems(finalItems);
        }
      }

      setProgress(100);
      setProgressStep('');
      setUploadedFiles({ weekMenu: null, fda: null, allergen: null, ingredients: null });
      alert(`✅ ${finalItems.length} ${station.label} items published!`);

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsPublishing(false);
      setProgress(0);
      setProgressStep('');
    }
  };

  const syncOptions = [
    { key: 'weekMenu', label: '1. Week Menu PDF', icon: Calendar, accept: '.pdf', desc: 'Required — menu items with recipe #s' },
    { key: 'fda', label: '2. FDA Nutrition File', icon: Sparkles, accept: '.pdf,.xlsx,.xls', desc: 'Optional — match by recipe #' },
    { key: 'allergen', label: '3. Allergen PDF', icon: AlertTriangle, accept: '.pdf', desc: 'Optional — match by recipe #' },
    { key: 'ingredients', label: '4. Ingredients CSV', icon: FileText, accept: '.csv', desc: 'Optional — match by recipe #' },
  ];

  const hasRequiredFile = Boolean(uploadedFiles.weekMenu || uploadedFiles.fda);

  return (
    <div className={`bg-white rounded-2xl border-2 ${station.border} p-5 space-y-4`}>
      <div className={`flex items-center gap-3 pb-3 border-b ${station.border}`}>
        <div className={`p-2 rounded-xl ${station.bg} border ${station.border}`}>
          <station.icon className={`w-5 h-5 ${station.color}`} />
        </div>
        <div>
          <h4 className={`font-bold text-sm uppercase tracking-widest ${station.color}`}>{station.label} Matrix Sync</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Upload station-specific files</p>
        </div>
      </div>

      <div className="space-y-2">
        {syncOptions.map(opt => (
          <div key={opt.key}>
            <input type="file" accept={opt.accept} id={`core-${station.id}-${opt.key}`} className="hidden" onChange={(e) => handleFileUpload(e, opt.key)} />
            <label
              htmlFor={`core-${station.id}-${opt.key}`}
              className={`w-full p-3 border-2 border-dashed rounded-xl flex items-center gap-3 transition cursor-pointer ${
                uploadedFiles[opt.key] ? `${station.border} ${station.bg}` : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isSyncing === opt.key
                ? <Loader2 className="animate-spin w-4 h-4 text-gray-400 shrink-0" />
                : uploadedFiles[opt.key]
                  ? <CheckCircle className={`w-4 h-4 ${station.color} shrink-0`} />
                  : <Upload className="w-4 h-4 text-gray-300 shrink-0" />
              }
              <div className="flex-1 text-left">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-700">{opt.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
              </div>
              {uploadedFiles[opt.key] && <span className={`text-[10px] font-bold ${station.color} uppercase shrink-0`}>✓ Ready</span>}
            </label>
          </div>
        ))}
      </div>

      <div className={`${station.bg} border ${station.border} rounded-xl p-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Info className={`w-3.5 h-3.5 ${station.color}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${station.color}`}>Files Status</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[['weekMenu', 'Week Menu'], ['fda', 'FDA Nutrition'], ['allergen', 'Allergen Data'], ['ingredients', 'Ingredients']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              {uploadedFiles[key]
                ? <CheckCircle className={`w-3 h-3 ${station.color}`} />
                : <XCircle className="w-3 h-3 text-gray-300" />}
              <span className="text-[10px] text-gray-500 font-bold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {isPublishing ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className={`${station.activeBg} h-full transition-all duration-500 rounded-full`} style={{ width: `${progress}%` }} />
          </div>
          <div className={`flex items-center justify-center gap-2 text-xs ${station.color}`}>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-bold">{progressStep || 'Processing...'}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleProcessAndPublish}
          disabled={!hasRequiredFile}
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
          <StationSync key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
}