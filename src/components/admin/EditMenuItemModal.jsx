import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special'];
const ALL_TAGS = ['Vegan', 'Vegetarian', 'Fit', 'High Protein', 'High Fiber', 'Dairy Free', 'Avoid Gluten', 'Spicy', 'Low Carb', 'Heart Healthy'];

export default function EditMenuItemModal({ isOpen, item, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) setForm({ ...item });
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleTag = (tag) => {
    const current = form.tags || [];
    const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    handleChange('tags', updated);
  };

  const toggleAllergen = (allergen) => {
    const current = form.allergens || [];
    const updated = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen];
    handleChange('allergens', updated);
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const ALLERGENS = ['Milk', 'Wheat', 'Egg', 'Soy', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Sesame', 'Coconut'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg uppercase tracking-widest">Edit: {item.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Name</label>
              <Input value={form.name || ''} onChange={e => handleChange('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Day</label>
              <select
                value={form.day || ''}
                onChange={e => handleChange('day', e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-bold"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Station</label>
              <Input value={form.station || ''} onChange={e => handleChange('station', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Description</label>
              <textarea
                value={form.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none h-20"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Ingredients</label>
              <textarea
                value={form.ingredients || ''}
                onChange={e => handleChange('ingredients', e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none h-16"
              />
            </div>
          </div>

          {/* Nutrition */}
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Nutrition</label>
            <div className="grid grid-cols-3 gap-3">
              {['calories', 'protein', 'carbs', 'fat', 'sodium', 'fiber', 'sugar', 'cholesterol'].map(field => (
                <div key={field}>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">{field}</label>
                  <Input
                    type="number"
                    value={form[field] || 0}
                    onChange={e => handleChange(field, Number(e.target.value))}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border-2 transition ${
                    (form.tags || []).includes(tag)
                      ? 'bg-teal-600 text-white border-teal-700'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map(allergen => (
                <button
                  key={allergen}
                  onClick={() => toggleAllergen(allergen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border-2 transition ${
                    (form.allergens || []).includes(allergen)
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {allergen}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 bg-gray-50 border-t border-gray-200 shrink-0 flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1 bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}