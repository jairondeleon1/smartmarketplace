import React, { useState, useEffect } from 'react';
import { Flame, Sandwich, Salad, X, ChevronRight } from 'lucide-react';

const CORE_MENUS = [
  {
    id: 'grill',
    label: 'Grill',
    icon: Flame,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    activeBg: 'bg-orange-600',
    description: 'Freshly grilled proteins & favorites',
    items: [
      { name: 'Grilled Chicken Breast', description: 'Seasoned grilled chicken breast served with your choice of sides.', calories: 220, protein: 42, carbs: 0, fat: 5 },
      { name: 'Grilled Salmon', description: 'Atlantic salmon fillet with lemon herb seasoning.', calories: 280, protein: 38, carbs: 0, fat: 14 },
      { name: 'Grilled Veggie Plate', description: 'Seasonal vegetables grilled with olive oil and herbs.', calories: 150, protein: 4, carbs: 18, fat: 8 },
      { name: 'Grilled Burger Patty', description: '1/4 lb beef patty grilled to order.', calories: 310, protein: 28, carbs: 0, fat: 22 },
      { name: 'Turkey Burger', description: 'Lean ground turkey patty, grilled and seasoned.', calories: 240, protein: 30, carbs: 2, fat: 12 },
    ]
  },
  {
    id: 'deli',
    label: 'Deli',
    icon: Sandwich,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-700',
    description: 'Made-to-order sandwiches & wraps',
    items: [
      { name: 'Turkey Club Sandwich', description: 'Sliced turkey, bacon, lettuce, tomato on toasted bread.', calories: 480, protein: 32, carbs: 42, fat: 18 },
      { name: 'Roast Beef Sub', description: 'Thinly sliced roast beef with horseradish on a hoagie roll.', calories: 520, protein: 36, carbs: 48, fat: 20 },
      { name: 'Veggie Wrap', description: 'Hummus, roasted veggies, feta in a whole wheat tortilla.', calories: 360, protein: 12, carbs: 52, fat: 14 },
      { name: 'Tuna Salad Sandwich', description: 'Classic tuna salad on sourdough with lettuce and tomato.', calories: 420, protein: 28, carbs: 38, fat: 16 },
      { name: 'Caprese Panini', description: 'Fresh mozzarella, tomato, basil, balsamic on ciabatta.', calories: 390, protein: 18, carbs: 44, fat: 16 },
    ]
  },
  {
    id: 'salad-bar',
    label: 'Salad Bar',
    icon: Salad,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    activeBg: 'bg-green-700',
    description: 'Fresh greens, proteins & toppings',
    items: [
      { name: 'Garden Salad Base', description: 'Mixed greens, romaine, spinach — your fresh foundation.', calories: 25, protein: 2, carbs: 4, fat: 0 },
      { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons with Caesar dressing.', calories: 180, protein: 6, carbs: 14, fat: 12 },
      { name: 'Greek Salad', description: 'Cucumber, tomato, olives, red onion, feta, oregano.', calories: 160, protein: 5, carbs: 10, fat: 12 },
      { name: 'Protein Bowl', description: 'Mixed greens topped with grilled chicken, chickpeas, and quinoa.', calories: 380, protein: 34, carbs: 28, fat: 14 },
      { name: 'Quinoa & Roasted Veggie Bowl', description: 'Quinoa base with seasonal roasted vegetables and tahini drizzle.', calories: 320, protein: 10, carbs: 48, fat: 12 },
    ]
  }
];

function CoreMenuModal({ menu, onClose, onAddToPlate }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className={`${menu.activeBg} p-5 text-white flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl border border-white/20">
              <menu.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-widest">{menu.label}</h3>
              <p className="text-white/70 text-[11px] font-medium mt-0.5">{menu.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {menu.items.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm uppercase tracking-tight">{item.name}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                <div className="flex gap-3 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{item.calories} Cal</span>
                  <span>{item.protein}g Prot</span>
                  <span>{item.carbs}g Carbs</span>
                </div>
              </div>
              {onAddToPlate && (
                <button
                  onClick={() => onAddToPlate({ ...item, station: menu.label, day: 'Daily' })}
                  className="w-9 h-9 flex items-center justify-center bg-gray-900 text-white rounded-xl transition active:scale-90 hover:bg-black shrink-0"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
              )}
            </div>
          ))}
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
  const activeMenu = CORE_MENUS.find(m => m.id === openMenu);

  return (
    <>
      <div className="w-full px-2 font-sans">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Core Menus</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {CORE_MENUS.map(menu => (
            <button
              key={menu.id}
              onClick={() => setOpenMenu(menu.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${menu.bg} ${menu.border} ${menu.color} active:scale-95`}
            >
              <menu.icon className="w-4 h-4" />
              {menu.label}
            </button>
          ))}
        </div>
      </div>

      {activeMenu && (
        <CoreMenuModal
          menu={activeMenu}
          onClose={() => setOpenMenu(null)}
          onAddToPlate={onAddToPlate}
        />
      )}
    </>
  );
}