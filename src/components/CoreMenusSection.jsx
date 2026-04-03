import React, { useState, useEffect } from 'react';
import { Flame, Sandwich, Salad, X, ChevronDown, ChefHat, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

const FALLBACK_ITEMS = {
  grill: [
    { name: 'Grilled Chicken Breast', description: 'Seasoned grilled chicken breast.', calories: 220, protein: 42, carbs: 0, fat: 5, ingredients: 'Chicken Breast, Olive Oil, Salt, Pepper, Garlic, Herbs' },
    { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon herb seasoning.', calories: 280, protein: 38, carbs: 0, fat: 14, ingredients: 'Atlantic Salmon, Lemon, Rosemary, Thyme, Olive Oil, Salt' },
  ],
  deli: [
    { name: 'Turkey Club Sandwich', description: 'Sliced turkey, bacon, lettuce, tomato on toasted bread.', calories: 480, protein: 32, carbs: 42, fat: 18, ingredients: 'Sliced Turkey, Bacon, Lettuce, Tomato, Whole Wheat Bread, Mayonnaise' },
    { name: 'Veggie Wrap', description: 'Hummus, roasted veggies, feta in a whole wheat tortilla.', calories: 360, protein: 12, carbs: 52, fat: 14, ingredients: 'Whole Wheat Tortilla, Hummus, Roasted Veggies, Feta Cheese' },
  ],
  'salad-bar': [
    { name: 'Garden Salad', description: 'Mixed greens, romaine, spinach.', calories: 25, protein: 2, carbs: 4, fat: 0, ingredients: 'Mixed Greens, Romaine Lettuce, Fresh Spinach' },
    { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons with Caesar dressing.', calories: 180, protein: 6, carbs: 14, fat: 12, ingredients: 'Romaine Lettuce, Parmesan Cheese, Croutons, Caesar Dressing' },
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
        const results = await base44.entities.CoreMenuItem.filter({ station: config.dbStation });
        if (results && results.length > 0) {
          setItems(results);
        } else {
          setItems(FALLBACK_ITEMS[stationId] || []);
        }
      } catch (err) {
        console.error('CoreMenu fetch error:', err);
        setItems(FALLBACK_ITEMS[stationId] || []);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [stationId, config.dbStation]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
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

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
              <div key={item.id || idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm uppercase tracking-tight">{item.name}</p>
                    {item.description && (
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex gap-3 mt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {item.calories > 0 && <span>{item.calories} Cal</span>}
                      {item.protein > 0 && <span>{item.protein}g Prot</span>}
                      {item.carbs > 0 && <span>{item.carbs}g Carbs</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToPlate && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlate({ ...item, station: config.label, day: 'Daily' });
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-gray-900 text-white rounded-xl cursor-pointer hover:bg-black active:scale-90 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedIdx === idx ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {expandedIdx === idx && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                    {item.ingredients && (
                      <div className="flex items-start gap-2 pt-3">
                        <ChefHat className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Ingredients</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.ingredients}</p>
                        </div>
                      </div>
                    )}
                    {item.allergens?.length > 0 && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Allergens: </span>
                        <span className="text-[10px] text-red-700">{item.allergens.join(', ')}</span>
                      </div>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag, t) => (
                          <span key={t} className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[9px] font-bold uppercase">{tag}</span>
                        ))}
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
  const STATION_IDS = ['grill', 'deli', 'salad-bar'];

  return (
    <>
      <div className="w-full px-2 font-sans">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Core Menus</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {STATION_IDS.map(id => {
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