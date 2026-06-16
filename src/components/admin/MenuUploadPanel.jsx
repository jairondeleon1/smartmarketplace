import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Upload, Loader2, CheckCircle, XCircle, Sparkles,
  Calendar, FileText, AlertTriangle, Info
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special', 'All Days'];

function normalizeStation(station) {
  const s = (station || '').toLowerCase().trim();
  if (s.includes('main') || s.includes('comfort') || s.includes('entree')) return 'Entree';
  return station;
}

function normalizeRecipeNum(num) {
  return String(num || '').trim().replace(/^'/, '').replace(/^0+/, '').toLowerCase();
}

// Simple but robust CSV parser that handles quoted fields with commas/newlines
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export default function MenuUploadPanel({ menuItems, onPublish }) {
  const [user, setUser] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, ingredients: null, allergens: null });
  const [uploading, setUploading] = useState(null); // which slot is uploading
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState('');
  const [progress, setProgress] = useState(0);

  // Check if user is Admin or Dietitian (roles that can see allergens)
  const canManageAllergens = user && (user.role === 'admin' || user.role === 'dietitian');

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Extract text from a PDF file client-side using pdfjs
  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileSelect = async (slotKey, file) => {
    if (!file) return;
    setUploading(slotKey);
    try {
      let text = '';
      if (file.name.endsWith('.csv')) {
        // CSV — read as text
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
      } else {
        // PDF — extract text client-side, no upload needed
        text = await extractPdfText(file);
      }
      if (!text || text.trim().length === 0) throw new Error('File is empty or could not be read');
      setUploadedFiles(prev => ({ ...prev, [slotKey]: { text, name: file.name } }));
    } catch (err) {
      alert(`❌ ${slotKey} upload failed: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleProcessAndPublish = async () => {
    const { weekMenu, fda, ingredients } = uploadedFiles;
    if (!weekMenu && !fda && !ingredients) {
      alert('Please upload at least one file first.');
      return;
    }

    // Verify user is still authenticated with a valid role before starting
    let currentUser;
    try {
      currentUser = await base44.auth.me();
    } catch {
      alert('❌ Error: You are not logged in. Please sign in and try again.');
      return;
    }
    const validRoles = ['admin', 'manager', 'dietitian'];
    if (!currentUser || !validRoles.includes(currentUser.role)) {
      alert(`❌ Permission denied: Your account role (${currentUser?.role || 'unknown'}) does not have permission to publish menus. Required: admin, manager, or dietitian.`);
      return;
    }

    setPublishing(true);
    setProgress(0);

    try {
      let finalItems = [];

      // --- STEP 1: Parse Week Menu PDF ---
      if (weekMenu) {
        setStep('Extracting menu items from Week Menu PDF...');
        setProgress(10);
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract ALL menu items from this weekly menu document. For each item extract:
- name (the dish name)
- recipe_number (the number shown in parentheses next to the dish name, e.g. "(12345)")
- station (the station or section it belongs to, e.g. "Entree", "Grill", "Deli", "Pizza", "Soup", "Dessert")
- day (exactly one of: Monday, Tuesday, Wednesday, Thursday, Friday, Daily Special)
- description (any description text if present)

Return as JSON with an "items" array.

Document text:
${weekMenu.text.slice(0, 15000)}`,
          response_json_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    recipe_number: { type: 'string' },
                    station: { type: 'string' },
                    day: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        });
        if (result?.items?.length > 0) {
          finalItems = result.items.map((item, idx) => ({
            ...item,
            station: normalizeStation(item.station),
            id: Date.now() + idx
          }));
        } else {
          throw new Error('No menu items found in Week Menu PDF');
        }
      } else {
        // Fall back to existing menu items
        finalItems = menuItems.map(item => ({ ...item }));
      }

      setProgress(30);
      await new Promise(r => setTimeout(r, 2000)); // avoid rate limit between LLM calls

      // --- STEP 2: FDA Nutrition Data ---
      if (fda) {
        setStep('Extracting nutrition data from FDA file...');
        setProgress(40);
        const fdaResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract ALL nutrition data from this FDA nutrition report. For each menu item extract:
- name
- recipe_number (the recipe/item number)
- calories (kcal)
- protein (grams)
- carbs (total carbohydrates, grams)
- fat (total fat, grams)
- saturated_fat (grams)
- sodium (milligrams)
- fiber (dietary fiber, grams)
- sugar (total sugars, grams)
- cholesterol (milligrams)
- vitamin_a (mcg or % - extract the number only)
- vitamin_c (mg or % - extract the number only)
- vitamin_d (mcg or % - extract the number only)
- calcium (mg or % - extract the number only)
- iron (mg or % - extract the number only)
- potassium (mg - extract the number only)

For values listed as "less than 1g" use 0.5, for "less than 5mg" use 2.
Return as JSON with an "items" array. Include ALL items found.

Document text:
${fda.text.slice(0, 20000)}`,
          response_json_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    recipe_number: { type: 'string' },
                    calories: { type: 'number' },
                    protein: { type: 'number' },
                    carbs: { type: 'number' },
                    fat: { type: 'number' },
                    saturated_fat: { type: 'number' },
                    sodium: { type: 'number' },
                    fiber: { type: 'number' },
                    sugar: { type: 'number' },
                    cholesterol: { type: 'number' },
                    vitamin_a: { type: 'number' },
                    vitamin_c: { type: 'number' },
                    vitamin_d: { type: 'number' },
                    calcium: { type: 'number' },
                    iron: { type: 'number' },
                    potassium: { type: 'number' }
                  }
                }
              }
            }
          }
        });

        if (fdaResult?.items?.length > 0) {
          // If we have no week menu items, build list from FDA directly
          if (finalItems.length === 0) {
            finalItems = fdaResult.items.map((item, idx) => ({
              ...item,
              station: 'Entree',
              day: 'Monday',
              id: Date.now() + idx
            }));
          } else {
            // Merge FDA nutrition into existing items by recipe_number
            finalItems = finalItems.map(item => {
              const match = fdaResult.items.find(
                fda => normalizeRecipeNum(fda.recipe_number) === normalizeRecipeNum(item.recipe_number)
              );
              if (match) {
                const totalFat = match.fat || 0;
                const satFat = match.saturated_fat || 0;
                return {
                  ...item,
                  calories: match.calories || 0,
                  protein: match.protein || 0,
                  carbs: match.carbs || 0,
                  fat: totalFat,
                  saturated_fat: satFat,
                  unsaturated_fat: totalFat > satFat ? totalFat - satFat : 0,
                  sodium: match.sodium || 0,
                  fiber: match.fiber || 0,
                  sugar: match.sugar || 0,
                  cholesterol: match.cholesterol || 0,
                  vitamin_a: match.vitamin_a || 0,
                  vitamin_c: match.vitamin_c || 0,
                  vitamin_d: match.vitamin_d || 0,
                  calcium: match.calcium || 0,
                  iron: match.iron || 0,
                  potassium: match.potassium || 0,
                };
              }
              return item;
            });
          }
        }
      }

      setProgress(65);
      await new Promise(r => setTimeout(r, 2000)); // avoid rate limit between LLM calls

      // --- STEP 3: Ingredients CSV (direct parse, no AI needed) ---
      if (ingredients) {
        setStep('Processing Ingredients CSV...');
        setProgress(70);

        // Parse CSV directly — no LLM needed
        const csvRows = parseCSV(ingredients.text);
        if (csvRows.length > 1) {
          const headers = csvRows[0].map(h => h.trim());
          const recipeNumIdx = headers.findIndex(h => h.toLowerCase().includes('recipe number'));
          const descIdx = headers.findIndex(h => h.toLowerCase().includes('enticing description'));
          const ingIdx = headers.findIndex(h => h.toLowerCase() === 'ingredients');
          const veganIdx = headers.findIndex(h => h.toLowerCase().includes('vegan tag'));
          const vegIdx = headers.findIndex(h => h.toLowerCase().includes('vegetarian tag'));
          const fitIdx = headers.findIndex(h => h.toLowerCase().includes('compass fit'));

          const ingMap = {};
          for (let i = 1; i < csvRows.length; i++) {
            const row = csvRows[i];
            if (!row || row.length < 2) continue;
            const rawNum = recipeNumIdx >= 0 ? (row[recipeNumIdx] || '').replace(/^'/, '').trim() : '';
            if (!rawNum) continue;
            const key = normalizeRecipeNum(rawNum);
            ingMap[key] = {
              description: descIdx >= 0 ? (row[descIdx] || '').trim() : '',
              ingredients: ingIdx >= 0 ? (row[ingIdx] || '').trim() : '',
              is_vegan: veganIdx >= 0 && (row[veganIdx] || '').toLowerCase().includes('vegan'),
              is_vegetarian: vegIdx >= 0 && (row[vegIdx] || '').toLowerCase().includes('vegetarian'),
              is_fit: fitIdx >= 0 && (row[fitIdx] || '').toLowerCase().includes('fit'),
            };
          }

          finalItems = finalItems.map(item => {
            const key = normalizeRecipeNum(item.recipe_number);
            const match = ingMap[key];
            if (match) {
              const extraTags = [];
              if (match.is_vegan) extraTags.push('Vegan');
              if (match.is_vegetarian) extraTags.push('Vegetarian');
              if (match.is_fit) extraTags.push('Fit');
              return {
                ...item,
                ...(match.ingredients?.length > 5 ? { ingredients: match.ingredients } : {}),
                ...(match.description?.length > 3 ? { description: match.description } : {}),
                tags: [...new Set([...(item.tags || []), ...extraTags])]
              };
            }
            return item;
          });
        }
      }

      setProgress(82);

      // --- STEP 4: Allergen Extraction (Admin/Dietitian only, direct from CSV columns) ---
      if (canManageAllergens && ingredients) {
        setStep('Extracting allergen information...');
        setProgress(85);
        const ALLERGEN_COLS = ['Egg', 'Fish', 'Milk', 'Peanuts', 'Sesame', 'Shellfish - Crustacean', 'Soy', 'Tree Nuts', 'Wheat'];
        const csvRows2 = parseCSV(ingredients.text);
        if (csvRows2.length > 1) {
          const headers2 = csvRows2[0].map(h => h.trim());
          const recipeNumIdx2 = headers2.findIndex(h => h.toLowerCase().includes('recipe number'));
          const allergenColIdxs = ALLERGEN_COLS.map(col => ({
            name: col,
            idx: headers2.findIndex(h => h.trim() === col)
          })).filter(c => c.idx >= 0);

          const allergenMap = {};
          for (let i = 1; i < csvRows2.length; i++) {
            const row = csvRows2[i];
            if (!row || row.length < 2) continue;
            const rawNum = recipeNumIdx2 >= 0 ? (row[recipeNumIdx2] || '').replace(/^'/, '').trim() : '';
            if (!rawNum) continue;
            const key = normalizeRecipeNum(rawNum);
            const found = allergenColIdxs
              .filter(c => (row[c.idx] || '').toLowerCase() === 'yes')
              .map(c => c.name);
            if (found.length > 0) allergenMap[key] = found;
          }

          finalItems = finalItems.map(item => {
            const key = normalizeRecipeNum(item.recipe_number);
            const found = allergenMap[key];
            if (found && found.length > 0) {
              return { ...item, allergens: [...new Set([...(item.allergens || []), ...found])] };
            }
            return item;
          });
        }
      }

      setProgress(95);
      setStep('Publishing menu...');

      // Remove temp ids before publishing
      const cleanItems = finalItems.map(({ id, ...rest }) => rest);
      await onPublish(cleanItems);

      setUploadedFiles({ weekMenu: null, fda: null, ingredients: null });
      setProgress(100);
      setStep('');
      alert(`✅ Published ${cleanItems.length} menu items successfully!`);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setPublishing(false);
      setProgress(0);
      setStep('');
    }
  };

  const baseSlots = [
    {
      key: 'weekMenu',
      label: '1. Week Menu PDF',
      desc: 'Menu items with recipe numbers',
      icon: Calendar,
      accept: '.pdf',
    },
    {
      key: 'fda',
      label: '2. FDA Nutrition File',
      desc: 'PDF with nutrition data',
      icon: Sparkles,
      accept: '.pdf',
    },
    {
      key: 'ingredients',
      label: '3. Ingredients CSV',
      desc: 'CSV matched by recipe number',
      icon: FileText,
      accept: '.csv',
    },
  ];

  const slots = canManageAllergens
    ? [
        ...baseSlots,
        {
          key: 'allergens',
          label: '4. Allergen Extraction',
          desc: 'Auto-extract from ingredients (Admin/Dietitian)',
          icon: AlertTriangle,
          accept: '.csv,.pdf',
        },
      ]
    : baseSlots;

  const anyUploaded = Object.values(uploadedFiles).some(Boolean);

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <Upload className="w-4 h-4 text-teal-600" /> Weekly Menu Sync
        </h3>
        <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
          {menuItems.length} Items Loaded
        </span>
      </div>

      {/* File slots */}
      <div className="space-y-3">
        {slots.map(slot => {
          const isUploading = uploading === slot.key;
          const uploaded = uploadedFiles[slot.key];
          return (
            <div key={slot.key}>
              <input
                type="file"
                accept={slot.accept}
                id={`upload-${slot.key}`}
                className="hidden"
                disabled={isUploading || publishing}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  handleFileSelect(slot.key, file);
                }}
              />
              <label
                htmlFor={`upload-${slot.key}`}
                className={`w-full p-5 border-2 border-dashed rounded-2xl flex items-center gap-4 transition cursor-pointer ${
                  uploaded
                    ? 'border-green-300 bg-green-50'
                    : 'border-teal-100 hover:bg-teal-50'
                } ${isUploading || publishing ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <Loader2 className="animate-spin w-6 h-6 text-teal-600 shrink-0" />
                ) : uploaded ? (
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-100 shrink-0">
                    {React.createElement(slot.icon, { className: "w-5 h-5 text-teal-600" })}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-800">
                    {slot.label}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {uploaded ? `✓ ${uploaded.name}` : slot.desc}
                  </div>
                </div>
                {uploaded && !isUploading && (
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setUploadedFiles(prev => ({ ...prev, [slot.key]: null })); }}
                    className="p-1 text-gray-400 hover:text-red-500 transition shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </label>
            </div>
          );
        })}
      </div>

      {/* Status / progress */}
      {publishing ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-teal-700">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-bold">{step}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleProcessAndPublish}
          disabled={!anyUploaded}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Process & Publish Menu
        </button>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
        <div className="font-bold mb-1 flex items-center gap-2">
          <Info className="w-4 h-4" /> How it works
        </div>
        <ul className="space-y-1 text-blue-700 list-disc list-inside">
          <li>Week Menu PDF extracts item names, recipe #s, stations, and days</li>
          <li>FDA file matches nutrition data by recipe number</li>
          <li>Ingredients CSV merges ingredient lists and dietary tags</li>
          <li>Missing descriptions are auto-generated by AI</li>
          {canManageAllergens && (
            <li>Allergen info auto-extracted from ingredients (Admin/Dietitian only)</li>
          )}
        </ul>
      </div>
    </div>
  );
}