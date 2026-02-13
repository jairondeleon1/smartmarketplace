import React, { useState } from 'react';
import { X, Save, Tag, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TAGS = ['High Protein', 'High Fiber', 'Low Carb', 'Heart Healthy', 'Vegan', 'Vegetarian', 'Fit', 'Dairy Free', 'Avoid Gluten', 'Spicy'];

export default function BulkEditModal({ isOpen, onClose, selectedItems, onSave }) {
  const [editData, setEditData] = useState({
    tags: [],
    addCalories: 0,
    multiplyCalories: 1,
    descriptionPrefix: '',
    descriptionSuffix: ''
  });

  const handleSave = () => {
    onSave(editData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl uppercase">Bulk Edit</h3>
            <p className="text-sm text-slate-300 mt-1">{selectedItems.length} items selected</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Add Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setEditData(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag) 
                        ? prev.tags.filter(t => t !== tag)
                        : [...prev.tags, tag]
                    }));
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                    editData.tags.includes(tag)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Add Calories</label>
              <Input
                type="number"
                value={editData.addCalories}
                onChange={(e) => setEditData(prev => ({ ...prev, addCalories: Number(e.target.value) }))}
                placeholder="e.g., 50 or -50"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Multiply Calories By</label>
              <Input
                type="number"
                step="0.1"
                value={editData.multiplyCalories}
                onChange={(e) => setEditData(prev => ({ ...prev, multiplyCalories: Number(e.target.value) }))}
                placeholder="e.g., 1.2"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Description Prefix
            </label>
            <Input
              value={editData.descriptionPrefix}
              onChange={(e) => setEditData(prev => ({ ...prev, descriptionPrefix: e.target.value }))}
              placeholder="Text to add before description"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Description Suffix
            </label>
            <Input
              value={editData.descriptionSuffix}
              onChange={(e) => setEditData(prev => ({ ...prev, descriptionSuffix: e.target.value }))}
              placeholder="Text to add after description"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" /> Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
}