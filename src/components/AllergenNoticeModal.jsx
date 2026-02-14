import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function AllergenNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('allergen_notice_seen');
    if (!hasSeenNotice) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('allergen_notice_seen', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-gradient-to-br from-orange-500 to-red-500 text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-2xl uppercase tracking-tight">Important Notice</h3>
              <p className="text-white/90 text-sm mt-1">Allergen Information</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <p className="text-gray-700 text-lg leading-relaxed">
            For more information about <span className="font-bold text-red-600">allergens</span>, 
            please talk to the <span className="font-bold text-slate-900">Ingredient Ambassador</span>.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-orange-900 text-sm leading-relaxed">
              Your safety is our priority. Always verify ingredient information with our team before consuming any menu items if you have allergies.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold uppercase text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}