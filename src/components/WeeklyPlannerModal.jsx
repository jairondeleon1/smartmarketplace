import React, { useState } from 'react';
import { X, Wand, Loader2, RefreshCw, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WeeklyPlannerModal({ isOpen, onClose, menuItems, addToPlate, user }) {
  const [goal, setGoal] = useState('High Protein');
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [changingMeal, setChangingMeal] = useState(null);
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);

  const generatePlan = async () => {
    setIsLoading(true);
    let userContext = '';
    if (user) {
      if (user.dietary_restrictions?.length > 0) userContext += `User avoids: ${user.dietary_restrictions.join(', ')}. `;
      if (user.dietary_preferences?.length > 0) userContext += `User prefers: ${user.dietary_preferences.join(', ')}. `;
      if (user.health_goals?.length > 0) userContext += `User goals: ${user.health_goals.join(', ')}. `;
    }

    const prompt = `Plan 5-day meal menu for goal: "${goal}". ${userContext}For each weekday (Monday-Friday), select BOTH a breakfast item AND a lunch item from the menu. Menu Data: ${JSON.stringify(menuItems.map(i => ({id: i.id, name: i.name, day: i.day, meal_period: i.meal_period, tags: i.tags, allergens: i.allergens})))}. Return ONLY JSON with structure: {"Monday": {"breakfast": ID, "lunch": ID}, "Tuesday": {"breakfast": ID, "lunch": ID}, ...}`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            Monday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Tuesday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Wednesday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Thursday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Friday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } }
          }
        }
      });
      if (response) {
        const planData = [];
        Object.entries(response).forEach(([day, meals]) => {
          if (meals.breakfast) { const item = menuItems.find(i => i.id === meals.breakfast); if (item) planData.push({ day, mealType: 'Breakfast', item }); }
          if (meals.lunch) { const item = menuItems.find(i => i.id === meals.lunch); if (item) planData.push({ day, mealType: 'Lunch', item }); }
        });
        setPlan(planData);
      }
    } catch (e) { setPlan(null); } finally { setIsLoading(false); }
  };

  const regenerateMeal = async (dayIndex) => {
    setRegeneratingMeal(dayIndex);
    const currentEntry = plan[dayIndex];
    let userContext = '';
    if (user) {
      if (user.dietary_restrictions?.length > 0) userContext += `User avoids: ${user.dietary_restrictions.join(', ')}. `;
      if (user.health_goals?.length > 0) userContext += `User goals: ${user.health_goals.join(', ')}. `;
    }
    const prompt = `Select a different ${currentEntry.mealType} item for ${currentEntry.day} that matches goal "${goal}". ${userContext}Avoid ID ${currentEntry.item.id}. Menu Data: ${JSON.stringify(menuItems.filter(i => (i.day === currentEntry.day || i.day === 'Daily Special')).map(i => ({id: i.id, name: i.name, tags: i.tags, allergens: i.allergens})))}. Return ONLY JSON with {"item_id": NUMBER}`;
    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: "object", properties: { item_id: { type: "number" } } } });
      if (response?.item_id) {
        const newItem = menuItems.find(i => i.id === response.item_id);
        if (newItem) { const updated = [...plan]; updated[dayIndex] = { ...currentEntry, item: newItem }; setPlan(updated); }
      }
    } catch (e) {} finally { setRegeneratingMeal(null); }
  };

  if (!isOpen) return null;

  const availableMeals = changingMeal !== null ? menuItems.filter(item => item.day === plan[changingMeal].day || item.day === 'Daily Special') : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="p-8 bg-slate-900 dark:bg-slate-800 text-white flex justify-between items-center border-b border-white/5 shrink-0">
          <h3 className="font-bold text-2xl flex items-center gap-2 uppercase tracking-tight"><Wand className="w-6 h-6 text-teal-400" /> AI Strategy</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {!plan ? (
            <>
              <div className="grid grid-cols-1 gap-2">
                {['High Protein', 'Balanced Strategy', 'Vegan Meal Prep', 'Vegetarian', 'Avoid Gluten', 'Low Carb Plan', 'Heart Healthy'].map(g => (
                  <button key={g} onClick={() => setGoal(g)} className={`p-4 rounded-xl border-2 text-left transition-all font-bold ${goal === g ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-300' : 'border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400'}`}>
                    <span className="uppercase text-xs tracking-widest font-bold">{g}</span>
                  </button>
                ))}
              </div>
              <button onClick={generatePlan} disabled={isLoading} className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Optimize Week'}
              </button>
            </>
          ) : changingMeal !== null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm uppercase text-slate-800 dark:text-slate-200">Select {plan[changingMeal].mealType} for {plan[changingMeal].day}</h4>
                <button onClick={() => setChangingMeal(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400">Cancel</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableMeals.map(item => (
                  <button key={item.id} onClick={() => { const updated = [...plan]; updated[changingMeal] = { ...updated[changingMeal], item }; setPlan(updated); setChangingMeal(null); }} className="w-full p-3 bg-gray-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-teal-200 text-left transition-all">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{item.calories} cal • {item.protein}g protein</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm font-bold">
              {plan.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-teal-700 dark:text-teal-400 text-[10px] uppercase font-bold">{entry.day.slice(0,3)}</span>
                      <span className="text-gray-400 text-[10px] uppercase">•</span>
                      <span className="text-gray-600 dark:text-slate-400 text-[10px] uppercase font-bold">{entry.mealType}</span>
                    </div>
                    <span className="text-sm truncate block">{entry.item.name}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => regenerateMeal(idx)} disabled={regeneratingMeal === idx} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition border border-purple-100 dark:border-purple-800 disabled:opacity-50">
                      {regeneratingMeal === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setChangingMeal(idx)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg transition border border-blue-100 dark:border-blue-800">Pick</button>
                    <button onClick={() => setPlan(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setPlan(null)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold uppercase text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all tracking-widest">Clear Plan</button>
                <button onClick={() => { plan.forEach(e => addToPlate(e.item)); onClose(); }} className="flex-1 py-3 bg-slate-900 dark:bg-teal-600 text-white font-bold uppercase text-xs rounded-xl active:scale-95 transition-all tracking-widest">Add All to Tray</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}