import React, { useState, useEffect } from 'react';
import { Flame, Sandwich, Salad, X, ChevronRight, ChefHat, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CORE_STATION_IDS = ['grill', 'deli', 'salad-bar'];

const STATION_CONFIG = {
  grill: {
    id: 'grill',
    label: 'Grill',
    dbStation: 'Grill',
    icon: Flame,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    activeBg: 'bg-orange-600',
    description: 'Freshly grilled proteins & favorites',
  },
  deli: {
    id: 'deli',
    label: 'Deli',
    dbStation: 'Deli',
    icon: Sandwich,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-700',
    description: 'Made-to-order sandwiches & wraps',
  },
  'salad-bar': {
    id: 'salad-bar',
    label: 'Salad Bar',
    dbStation: 'Salad Bar',
    icon: Salad,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    activeBg: 'bg-green-700',
    description: 'Fresh greens, proteins & toppings',
  },
};

// Fallback items per station if DB has none
const FALLBACK_ITEMS = {
  grill: [
    { name: 'Grilled Chicken Breast', description: 'Seasoned grilled chicken breast served with your choice of sides.', calories: 220, protein: 42, carbs: 0, fat: 5, ingredients: 'Chicken Breast, Olive Oil, Salt, Pepper, Garlic, Herbs' },
    { name: 'Grilled Salmon', description: 'Atlantic salmon fillet with lemon herb seasoning.', calories: 280, protein: 38, carbs: 0, fat: 14, ingredients: 'Atlantic Salmon, Lemon, Rosemary, Thyme, Olive Oil, Salt' },
    { name: 'Grilled Veggie Plate', description: 'Seasonal vegetables grilled with olive oil and herbs.', calories: 150, protein: 4, carbs: 18, fat: 8, ingredients: 'Seasonal Vegetables, Olive Oil, Garlic, Italian Herbs, Salt, Pepper' },
  ],
  deli: [
    { name: 'Turkey Club Sandwich', description: 'Sliced turkey, bacon, lettuce, tomato on toasted bread.', calories: 480, protein: 32, carbs: 42, fat: 18, ingredients: 'Sliced Turkey, Bacon, Lettuce, Tomato, Whole Wheat Bread, Mayonnaise' },
    { name: 'Roast Beef Sub', description: 'Thinly sliced roast beef with horseradish on a hoagie roll.', calories: 520, protein: 36, carbs: 48, fat: 20, ingredients: 'Roast Beef, Horseradish Sauce, Hoagie Roll, Onion, Arugula, Olive Oil' },
    { name: 'Veggie Wrap', description: 'Hummus, roasted veggies, feta in a whole wheat tortilla.', calories: 360, protein: 12, carbs: 52, fat: 14, ingredients: 'Whole Wheat Tortilla, Hummus, Roasted Zucchini, Bell Peppers, Carrots, Feta Cheese' },
  ],
  'salad-bar': [
    { name: 'Garden Salad Base', description: 'Mixed greens, romaine, spinach — your fresh foundation.', calories: 25, protein: 2, carbs: 4, fat: 0, ingredients: 'Mixed Greens, Romaine Lettuce, Fresh Spinach' },
    { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons with Caesar dressing.', calories: 180, protein: 6, carbs: 14, fat: 12, ingredients: 'Romaine Lettuce, Parmesan Cheese, Croutons, Caesar Dressing, Anchovies' },
    { name: 'Greek Salad', description: 'Cucumber, tomato, olives, red onion, feta, oregano.', calories: 160, protein: 5, carbs: 10, fat: 12, ingredients: 'Cucumber, Roma Tomato, Kalamata Olives, Red Onion, Feta Cheese, Oregano, Olive Oil' },
  ],
};

function CoreMenuModal({ stationId, onClose, onAddToPlate }) {
  const config = STATION_CONFIG[stationId];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const results = await base44.entities.MenuItem.filter({ station: config.dbStation });
        if (results && results.length > 0) {
          // Deduplicate by name (keep unique items)
          const seen = new Set();
          const unique = results.filter(item => {
            const key = item.name?.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setItems(unique);
        } else {
          setItems(FALLBACK_ITEMS[stationId] || []);
        }
      } catch {
        setItems(FALLBACK_ITEMS[stationId] || []);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [stationId, config.dbStation]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className={`${config.activeBg} p-5 text-white flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl border border-white/20">
              <config.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-widest">{config.label}</h3>
              <p className="text-white/70 text-[11px] font-medium mt-0.5">{config.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className={`w-6 h-6 animate-spin ${config.color}`} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm font-bold uppercase tracking-widest">
              No items available
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm uppercase tracking-tight">{item.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                    <div className="flex gap-3 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {item.calories > 0 && <span>{item.calories} Cal</span>}
                      {item.protein > 0 && <span>{item.protein}g Prot</span>}
                      {item.carbs > 0 && <span>{item.carbs}g Carbs</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToPlate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlate({ ...item, station: config.label, day: item.day || 'Daily' });
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-gray-900 text-white rounded-xl transition active:scale-90 hover:bg-black"
                      >
                        <span className="text-lg leading-none">+</span>
                      </button>
                    )}
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedIdx === idx ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {expandedIdx === idx && item.ingredients && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50 animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-2">
                      <ChefHat className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Contains</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{item.ingredients}</p>
                      </div>
                    </div>
                    {item.allergens?.length > 0 && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Allergens: </span>
                        <span className="text-[10px] text-red-700">{item.allergens.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-2 pb-4">
            Items above are standard offerings. Ask staff for daily specials.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CoreMenusSection({ onAddToPlate }) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <>
      <div className="w-full px-2 font-sans">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Core Menus</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {CORE_STATION_IDS.map(id => {
            const cfg = STATION_CONFIG[id];
            return (
              <button
                key={id}
                onClick={() => setOpenMenu(id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${cfg.bg} ${cfg.border} ${cfg.color} active:scale-95`}
              >
                <cfg.icon className="w-4 h-4" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {openMenu && (
        <CoreMenuModal
          stationId={openMenu}
          onClose={() => setOpenMenu(null)}
          onAddToPlate={onAddToPlate}
        />
      )}
    </>
  );
}