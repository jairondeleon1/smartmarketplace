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

  const saveToDatabase = async (items) => {
    // Delete existing for this station first
    const existing = await base44.entities.CoreMenuItem.filter({ station: station.label });
    if (existing.length > 0) {
      await Promise.all(existing.map(item => base44.entities.CoreMenuItem.delete(item.id)));
    }
    // Strip fields not in CoreMenuItem schema
    const coreItems = items.map(({ day, meal_period, unsaturated_fat, id, ...rest }) => ({
      ...rest,
      station: station.label,
    }));
    await base44.entities.CoreMenuItem.bulkCreate(coreItems);
    return coreItems;
  };

  const handleProcessAndPublish = async () => {
    if (!uploadedFiles.weekMenu && !uploadedFiles.fda && !uploadedFiles.allergen && !uploadedFiles.ingredients) {
      alert('Please upload at least one file to process'); return;
    }
    setIsPublishing(true); setProgress(0);

    let finalItems = [];

    try {
      // STEP 1: Parse menu PDF — save immediately so data is never lost
      if (uploadedFiles.weekMenu) {
        setProgressStep('Step 1: Parsing menu PDF...'); setProgress(15);
        const weekResult = await invokeLLMWithRetry({
          prompt: `Extract ALL food item names from this ${station.label} station menu document. Return every dish/item listed. For each: name (full dish name), recipe_number (number/code if shown, else empty string), description (brief description if available, else empty string). Return as JSON.`,
          file_urls: [uploadedFiles.weekMenu],
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, description: { type: "string" } } } } } }
        });
        if (weekResult?.items?.length > 0) {
          finalItems = weekResult.items;
          // Save basic items to DB immediately — even without nutrition data
          setProgressStep(`Saving ${finalItems.length} items...`); setProgress(30);
          await saveToDatabase(finalItems);
        }
      }

      // STEP 2: Enrich with FDA nutrition
      if (uploadedFiles.fda && finalItems.length > 0) {
        setProgressStep('Step 2: Adding nutrition data...'); setProgress(45);
        const fdaResult = await invokeLLMWithRetry({
          prompt: `Extract nutrition info per item: name, recipe_number, calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, cholesterol. Return as JSON.`,
          file_urls: [uploadedFiles.fda],
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, saturated_fat: { type: "number" }, sodium: { type: "number" }, fiber: { type: "number" }, sugar: { type: "number" }, cholesterol: { type: "number" } } } } } }
        });
        if (fdaResult?.items) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const itemNameLower = item.name?.toLowerCase().trim() || '';
            const match = fdaResult.items.find(f =>
              (norm(f.recipe_number) && norm(f.recipe_number) === norm(item.recipe_number)) ||
              f.name?.toLowerCase().trim() === itemNameLower ||
              f.name?.toLowerCase().includes(itemNameLower.slice(0, 12)) ||
              itemNameLower.includes((f.name?.toLowerCase().trim() || '').slice(0, 12))
            );
            if (match) {
              return { ...item, calories: match.calories || 0, protein: match.protein || 0, carbs: match.carbs || 0, fat: match.fat || 0, saturated_fat: match.saturated_fat || 0, sodium: match.sodium || 0, fiber: match.fiber || 0, sugar: match.sugar || 0, cholesterol: match.cholesterol || 0 };
            }
            return item;
          });
          setProgressStep('Saving nutrition data...'); setProgress(60);
          await saveToDatabase(finalItems);
        }
      }

      // STEP 3: Allergens
      if (uploadedFiles.allergen && finalItems.length > 0) {
        setProgressStep('Step 3: Adding allergen data...'); setProgress(70);
        const allergenResult = await invokeLLMWithRetry({
          prompt: `Extract allergen info for each menu item: recipe_number, allergens (array of strings), tags (array like Vegetarian, Vegan, Fit, Dairy Free). Return as JSON.`,
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
          setProgressStep('Saving allergen data...'); setProgress(80);
          await saveToDatabase(finalItems);
        }
      }

      // STEP 4: Ingredients CSV
      if (uploadedFiles.ingredients && finalItems.length > 0) {
        setProgressStep('Step 4: Adding ingredients...'); setProgress(88);
        const csvChunk = uploadedFiles.ingredients.slice(0, 20000);
        const ingResult = await invokeLLMWithRetry({
          prompt: `Parse this CSV file and extract ingredient information for each row. For each row return: name (dish/item name), recipe_number (recipe number or code, as a string), ingredients (full ingredients list as a single string), is_vegan (boolean), is_vegetarian (boolean), is_fit (boolean). Return ALL rows. If a column doesn't exist set it to empty string or false.\n\nCSV DATA:\n${csvChunk}`,
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, ingredients: { type: "string" }, is_vegan: { type: "boolean" }, is_vegetarian: { type: "boolean" }, is_fit: { type: "boolean" } } } } } }
        });
        if (ingResult?.items?.length > 0) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const itemName = item.name?.toLowerCase().trim() || '';
            const itemRecipe = norm(item.recipe_number);
            // Match by recipe_number first, then fall back to name matching
            const match = ingResult.items.find(i => {
              if (itemRecipe && norm(i.recipe_number) === itemRecipe) return true;
              const iName = i.name?.toLowerCase().trim() || '';
              return iName && (iName === itemName || iName.includes(itemName.slice(0, 15)) || itemName.includes(iName.slice(0, 15)));
            });
            if (match?.ingredients?.length > 3) {
              const csvTags = [];
              if (match.is_vegan) csvTags.push('Vegan');
              if (match.is_vegetarian) csvTags.push('Vegetarian');
              if (match.is_fit) csvTags.push('Fit');
              return { ...item, ingredients: match.ingredients.trim(), tags: [...new Set([...(item.tags || []), ...csvTags])] };
            }
            return item;
          });
          setProgressStep('Saving ingredients...'); setProgress(95);
          await saveToDatabase(finalItems);
        }
      }

      setProgress(100);
      setProgressStep('');
      setUploadedFiles({ weekMenu: null, fda: null, allergen: null, ingredients: null });
      alert(`✅ Published ${finalItems.length} ${station.label} items to the Core Menu popup!`);
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