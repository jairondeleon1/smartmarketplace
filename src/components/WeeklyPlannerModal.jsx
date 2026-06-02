import React, { useState } from 'react';
import { X, Wand, Loader2, RefreshCw, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Derive a display slot label like "Lunch Grill", "Lunch Deli Side", "Breakfast Entree"
function getSlotLabel(item) {
  const station = (item.station || '').trim();
  const s = station.toLowerCase();
  const meal = s.startsWith('breakfast') ? 'Breakfast' : 'Lunch';
  return `${meal} ${station}`;
}

// Group menu items by slot label
function buildSlots(menuItems) {
  const map = {};
  menuItems.forEach(item => {
    const label = getSlotLabel(item);
    if (!map[label]) map[label] = [];
    map[label].push(item);
  });
  return map;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function WeeklyPlannerModal({ isOpen, onClose, menuItems, addToPlate, user }) {
  const [goal, setGoal] = useState('High Protein');
  const [plan, setPlan] = useState(null); // { Monday: { "Lunch Grill": item, "Lunch Deli": item, ... }, ... }
  const [isLoading, setIsLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(null); // "Monday|Lunch Grill"
  const [swappingSlot, setSwappingSlot] = useState(null); // { day, slotLabel }

  // Build a unique list of slot labels across all items
  const slotMap = buildSlots(menuItems);
  const allSlotLabels = Object.keys(slotMap).sort();

  const generatePlan = async () => {
    setIsLoading(true);

    let userContext = '';
    if (user) {
      if (user.dietary_restrictions?.length > 0) userContext += `User avoids: ${user.dietary_restrictions.join(', ')}. `;
      if (user.dietary_preferences?.length > 0) userContext += `User prefers: ${user.dietary_preferences.join(', ')}. `;
      if (user.health_goals?.length > 0) userContext += `User goals: ${user.health_goals.join(', ')}. `;
    }

    const goalCriteria = {
      'Low Carb Plan': 'select items with 10–40g of carbohydrates per serving.',
      'Heart Healthy': 'select items low in saturated fat (≤5g), sodium (≤600mg), and sugar (≤10g). Prioritize lean proteins and vegetables.',
    };
    const criteriaNote = goalCriteria[goal] ? `IMPORTANT: ${goalCriteria[goal]} ` : '';

    // Slim menu data keyed by slot label
    const slimBySlot = {};
    Object.entries(slotMap).forEach(([label, items]) => {
      slimBySlot[label] = items.map(i => ({ id: i.id, name: i.name, day: i.day, calories: i.calories, protein: i.protein, carbs: i.carbs, fat: i.fat, saturated_fat: i.saturated_fat, sodium: i.sodium, sugar: i.sugar, tags: i.tags, allergens: i.allergens }));
    });

    // Build schema properties for each day × slot
    const dayProps = {};
    DAYS.forEach(day => {
      const slotProps = {};
      allSlotLabels.forEach(label => { slotProps[label] = { type: 'string' }; });
      dayProps[day] = { type: 'object', properties: slotProps };
    });

    const prompt = `Plan a 5-day (Monday–Friday) meal selection for goal: "${goal}". ${criteriaNote}${userContext}
For each day, pick ONE item per station slot if available for that day OR "Daily Special".
Station slots: ${allSlotLabels.join(', ')}.
Menu items grouped by slot (use the exact string IDs):
${JSON.stringify(slimBySlot, null, 1)}

Rules:
- Only pick an item from a slot if it has items available for that day OR day="Daily Special".
- Use the exact item id string as the value.
- If no suitable item exists for a slot on a day, omit that key.

Return JSON: {"Monday":{"Lunch Grill":"ITEM_ID",...},"Tuesday":{...},...}`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: 'object', properties: dayProps }
      });

      if (response) {
        const planData = {};
        DAYS.forEach(day => {
          planData[day] = {};
          const daySelections = response[day] || {};
          Object.entries(daySelections).forEach(([slotLabel, itemId]) => {
            if (!itemId) return;
            const slotItems = slotMap[slotLabel] || [];
            const item = slotItems.find(i => i.id === itemId || i.id === String(itemId));
            if (item && (item.day === day || item.day === 'Daily Special')) {
              planData[day][slotLabel] = item;
            }
          });
        });
        setPlan(planData);
      }
    } catch (e) {
      console.error('Plan generation failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateMeal = async (day, slotLabel) => {
    const key = `${day}|${slotLabel}`;
    setRegenerating(key);
    const currentItem = plan[day]?.[slotLabel];
    const slotItems = slotMap[slotLabel] || [];
    const candidates = slotItems.filter(i => (i.day === day || i.day === 'Daily Special') && i.id !== currentItem?.id);
    if (candidates.length === 0) { setRegenerating(null); return; }

    let userContext = '';
    if (user?.health_goals?.length > 0) userContext = `User goals: ${user.health_goals.join(', ')}. `;

    const prompt = `Pick the best item for slot "${slotLabel}" on ${day} for goal "${goal}". ${userContext}Candidates: ${JSON.stringify(candidates.map(i => ({ id: i.id, name: i.name, calories: i.calories, protein: i.protein, tags: i.tags })))}. Return JSON: {"item_id": "ID"}`;
    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: 'object', properties: { item_id: { type: 'string' } } } });
      if (response?.item_id) {
        const newItem = candidates.find(i => i.id === response.item_id || i.id === String(response.item_id));
        if (newItem) {
          setPlan(prev => ({ ...prev, [day]: { ...prev[day], [slotLabel]: newItem } }));
        }
      }
    } catch (e) {} finally { setRegenerating(null); }
  };

  const handleRemoveMeal = (day, slotLabel) => {
    setPlan(prev => {
      const updated = { ...prev, [day]: { ...prev[day] } };
      delete updated[day][slotLabel];
      return updated;
    });
  };

  const handleSwapMeal = (day, slotLabel, newItem) => {
    setPlan(prev => ({ ...prev, [day]: { ...prev[day], [slotLabel]: newItem } }));
    setSwappingSlot(null);
  };

  if (!isOpen) return null;

  // For swap picker — items available in this slot for this day
  const swapCandidates = swappingSlot
    ? (slotMap[swappingSlot.slotLabel] || []).filter(i => i.day === swappingSlot.day || i.day === 'Daily Special')
    : [];

  // Slot color coding
  const slotColors = {
    Breakfast: 'bg-amber-50 border-amber-200 text-amber-800',
    Lunch: 'bg-teal-50 border-teal-200 text-teal-800',
  };
  const getSlotColor = (label) => label.startsWith('Breakfast') ? slotColors.Breakfast : slotColors.Lunch;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 dark:bg-slate-800 text-white flex justify-between items-center border-b border-white/5 shrink-0">
          <h3 className="font-bold text-xl flex items-center gap-2 uppercase tracking-tight">
            <Wand className="w-5 h-5 text-teal-400" /> AI Strategy
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: Goal Selection */}
          {!plan ? (
            <>
              <div className="grid grid-cols-1 gap-2">
                {['High Protein', 'Balanced Strategy', 'Vegan Meal Prep', 'Vegetarian', 'Pescatarian', 'Low Carb Plan', 'Heart Healthy'].map(g => (
                  <button key={g} onClick={() => setGoal(g)}
                    className={`p-4 rounded-xl border-2 text-left transition-all font-bold ${goal === g ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-300' : 'border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400'}`}>
                    <span className="uppercase text-xs tracking-widest font-bold">{g}</span>
                  </button>
                ))}
              </div>
              <button onClick={generatePlan} disabled={isLoading}
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isLoading ? <><Loader2 className="animate-spin w-4 h-4" /> Optimizing...</> : 'Optimize Week'}
              </button>
            </>

          /* STEP 2: Swap picker */
          ) : swappingSlot ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm uppercase text-slate-800 dark:text-slate-200">
                  Pick for {swappingSlot.slotLabel} — {swappingSlot.day}
                </h4>
                <button onClick={() => setSwappingSlot(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {swapCandidates.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No items available for this slot on {swappingSlot.day}.</p>
                ) : swapCandidates.map(item => (
                  <button key={item.id} onClick={() => handleSwapMeal(swappingSlot.day, swappingSlot.slotLabel, item)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-teal-200 text-left transition-all">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.calories} cal • {item.protein}g protein</div>
                  </button>
                ))}
              </div>
            </div>

          /* STEP 3: Plan display */
          ) : (
            <div className="space-y-4">
              {DAYS.map(day => {
                const dayPlan = plan[day] || {};
                const slots = Object.entries(dayPlan);
                if (slots.length === 0) return null;
                return (
                  <div key={day} className="bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {/* Day header */}
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700">
                      <span className="text-teal-700 dark:text-teal-400 text-[11px] uppercase font-bold tracking-widest">{day}</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                      {slots.map(([slotLabel, item]) => {
                        const key = `${day}|${slotLabel}`;
                        const isRegen = regenerating === key;
                        return (
                          <div key={slotLabel} className="p-3 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1 ${getSlotColor(slotLabel)}`}>
                                {slotLabel}
                              </span>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                              <div className="text-[10px] text-gray-400">{item.calories} cal • {item.protein}g protein</div>
                            </div>
                            <div className="flex gap-1 shrink-0 mt-1">
                              <button
                                onClick={() => handleRegenerateMeal(day, slotLabel)}
                                disabled={isRegen}
                                className="p-1.5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition border border-purple-100 dark:border-purple-800 disabled:opacity-50"
                                title="AI pick another">
                                {isRegen ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => setSwappingSlot({ day, slotLabel })}
                                className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg transition border border-blue-100 dark:border-blue-800"
                                title="Pick manually">
                                Pick
                              </button>
                              <button
                                onClick={() => handleRemoveMeal(day, slotLabel)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Remove">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Totals summary */}
              {(() => {
                let totalCal = 0, totalProt = 0;
                DAYS.forEach(day => Object.values(plan[day] || {}).forEach(item => { totalCal += item.calories || 0; totalProt += item.protein || 0; }));
                return (
                  <div className="grid grid-cols-2 gap-2 py-2">
                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 text-center border border-teal-100 dark:border-teal-800">
                      <div className="font-bold text-teal-800 dark:text-teal-300 text-base">{totalCal}</div>
                      <div className="text-[9px] text-teal-600 uppercase tracking-widest font-bold">Total Cals (Week)</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center border border-purple-100 dark:border-purple-800">
                      <div className="font-bold text-purple-800 dark:text-purple-300 text-base">{totalProt}g</div>
                      <div className="text-[9px] text-purple-600 uppercase tracking-widest font-bold">Total Protein (Week)</div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setPlan(null)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold uppercase text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all tracking-widest">
                  Clear Plan
                </button>
                <button
                  onClick={() => {
                    DAYS.forEach(day => Object.entries(plan[day] || {}).forEach(([slotLabel, item]) => addToPlate({ ...item, _planDay: day, _planMealType: slotLabel })));
                    onClose();
                  }}
                  className="flex-1 py-3 bg-slate-900 dark:bg-teal-600 text-white font-bold uppercase text-xs rounded-xl active:scale-95 transition-all tracking-widest">
                  Add All to Tray
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}