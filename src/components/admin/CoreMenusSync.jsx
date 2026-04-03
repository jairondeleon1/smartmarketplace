import React, { useState } from 'react';
import { Flame, Sandwich, Salad, Upload, Loader2, CheckCircle, XCircle, Sparkles, Calendar, AlertTriangle, FileText, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATIONS = [
  { id: 'grill', label: 'Grill', dbStation: 'Grill', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', activeBg: 'bg-orange-600' },
  { id: 'deli', label: 'Deli', dbStation: 'Deli', icon: Sandwich, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-700' },
  { id: 'salad-bar', label: 'Salad Bar', dbStation: 'Salad Bar', icon: Salad, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-700' },
];

function StationSync({ station }) {
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, allergen: null });
  const [isSyncing, setIsSyncing] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [publishedCount, setPublishedCount] = useState(null);

  const uploadFile = async (file) => {
    const result = await base44.integrations.Core.UploadFile({ file });
    if (!result?.file_url) throw new Error('Upload failed - no URL returned');
    return result.file_url;
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSyncing(type);
    try {
      const url = await uploadFile(file);
      setUploadedFiles(prev => ({ ...prev, [type]: url }));
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsSyncing(null);
      e.target.value = '';
    }
  };

  const callBackend = async (fileUrl, fileType) => {
    const res = await base44.functions.invoke('processCoreMenu', {
      fileUrl,
      station: station.label,
      fileType
    });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data?.data;
  };

  const clearStation = async () => {
    const existing = await base44.entities.CoreMenuItem.filter({ station: station.dbStation });
    if (existing.length > 0) {
      await Promise.all(existing.map(i => base44.entities.CoreMenuItem.delete(i.id)));
    }
  };

  const handleProcessAndPublish = async () => {
    if (!uploadedFiles.weekMenu) {
      alert('Please upload the Week Menu PDF first.');
      return;
    }

    setIsPublishing(true);
    setPublishedCount(null);
    let finalItems = [];

    try {
      // STEP 1: Parse week menu via backend
      setProgressStep('Parsing menu PDF...');
      setProgress(20);

      const menuData = await callBackend(uploadedFiles.weekMenu, 'weekMenu');
      if (!menuData?.items?.length) {
        alert('No items found in the menu PDF. Please check the file and try again.');
        return;
      }

      finalItems = menuData.items;
      setProgressStep(`Found ${finalItems.length} items. Saving to database...`);
      setProgress(40);

      // Clear old and save basic items immediately
      await clearStation();
      const toSave = finalItems.map(item => ({
        name: item.name,
        station: station.dbStation,
        description: item.description || '',
        recipe_number: item.recipe_number || '',
        calories: 0, protein: 0, carbs: 0, fat: 0,
        saturated_fat: 0, sodium: 0, fiber: 0, sugar: 0, cholesterol: 0,
        tags: [], allergens: []
      }));
      await base44.entities.CoreMenuItem.bulkCreate(toSave);
      setProgressStep(`✓ ${finalItems.length} items saved!`);
      setProgress(55);

      // STEP 2: FDA nutrition (optional)
      if (uploadedFiles.fda) {
        setProgressStep('Adding nutrition data...');
        setProgress(65);
        const fdaData = await callBackend(uploadedFiles.fda, 'fda');

        if (fdaData?.items?.length > 0) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const match = fdaData.items.find(f =>
              (norm(f.recipe_number) && norm(f.recipe_number) === norm(item.recipe_number)) ||
              f.name?.toLowerCase().trim() === item.name?.toLowerCase().trim()
            );
            if (match) return { ...item, ...match };
            return item;
          });

          // Re-save with nutrition
          await clearStation();
          await base44.entities.CoreMenuItem.bulkCreate(finalItems.map(item => ({
            name: item.name,
            station: station.dbStation,
            description: item.description || '',
            recipe_number: item.recipe_number || '',
            calories: item.calories || 0, protein: item.protein || 0,
            carbs: item.carbs || 0, fat: item.fat || 0,
            saturated_fat: item.saturated_fat || 0, sodium: item.sodium || 0,
            fiber: item.fiber || 0, sugar: item.sugar || 0, cholesterol: item.cholesterol || 0,
            tags: item.tags || [], allergens: item.allergens || []
          })));
        }
      }

      // STEP 3: Allergens (optional)
      if (uploadedFiles.allergen) {
        setProgressStep('Adding allergen data...');
        setProgress(82);
        const allergenData = await callBackend(uploadedFiles.allergen, 'allergen');

        if (allergenData?.items?.length > 0) {
          const norm = (n) => String(n || '').trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const match = allergenData.items.find(a => norm(a.recipe_number) === norm(item.recipe_number));
            if (match) return { ...item, allergens: match.allergens || [], tags: [...new Set([...(item.tags || []), ...(match.tags || [])])] };
            return item;
          });

          // Re-save with allergens
          await clearStation();
          await base44.entities.CoreMenuItem.bulkCreate(finalItems.map(item => ({
            name: item.name,
            station: station.dbStation,
            description: item.description || '',
            recipe_number: item.recipe_number || '',
            calories: item.calories || 0, protein: item.protein || 0,
            carbs: item.carbs || 0, fat: item.fat || 0,
            saturated_fat: item.saturated_fat || 0, sodium: item.sodium || 0,
            fiber: item.fiber || 0, sugar: item.sugar || 0, cholesterol: item.cholesterol || 0,
            tags: item.tags || [], allergens: item.allergens || []
          })));
        }
      }

      setProgress(100);
      setPublishedCount(finalItems.length);
      setProgressStep('');
      setUploadedFiles({ weekMenu: null, fda: null, allergen: null });
      alert(`✅ ${finalItems.length} ${station.label} items published! Open the ${station.label} popup on the menu page to see them.`);

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
  ];

  return (
    <div className={`bg-white rounded-2xl border-2 ${station.border} p-5 space-y-4`}>
      {/* Header */}
      <div className={`flex items-center gap-3 pb-3 border-b ${station.border}`}>
        <div className={`p-2 rounded-xl ${station.bg} border ${station.border}`}>
          <station.icon className={`w-5 h-5 ${station.color}`} />
        </div>
        <div>
          <h4 className={`font-bold text-sm uppercase tracking-widest ${station.color}`}>{station.label} Station Sync</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            {publishedCount !== null ? `${publishedCount} items published` : 'Upload station-specific files'}
          </p>
        </div>
      </div>

      {/* File upload buttons */}
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

      {/* Status */}
      <div className={`${station.bg} border ${station.border} rounded-xl p-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Info className={`w-3.5 h-3.5 ${station.color}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${station.color}`}>Files Ready</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[['weekMenu', 'Week Menu'], ['fda', 'Nutrition'], ['allergen', 'Allergens']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              {uploadedFiles[key]
                ? <CheckCircle className={`w-3 h-3 ${station.color}`} />
                : <XCircle className="w-3 h-3 text-gray-300" />}
              <span className="text-[10px] text-gray-500 font-bold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Publish button / progress */}
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
          disabled={!uploadedFiles.weekMenu}
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