import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ChevronRight } from 'lucide-react';

export default function AllergenNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans animate-in fade-in duration-300">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-300" style={{ maxHeight: '92dvh' }}>

        {step === 1 && (
          <>
            <div className="p-6 bg-gradient-to-br from-red-600 to-red-800 text-white text-center shrink-0">
              <div className="flex justify-center mb-3">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="font-black text-2xl uppercase tracking-tight leading-tight">Food<br />Allergies?</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ overscrollBehavior: 'contain' }}>
              <p className="text-gray-700 text-sm leading-relaxed">
                Please be advised that common allergens, including{' '}
                <span className="font-bold text-red-700">egg, milk, wheat, soy, sesame, peanuts, tree nuts, fish, and shellfish</span>{' '}
                are present in our facility.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                The potential for <span className="font-bold text-gray-900">cross-contact</span> is higher at self-serve, fryer, and made-to-order stations.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                If you have a food allergy or special dietary need, please{' '}
                <span className="font-bold text-red-700">speak with an Ingredient Ambassador</span> at our Marketplace before making your selection.
              </p>
            </div>

            <div className="p-6 shrink-0 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl font-bold uppercase text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                I Understand
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
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
              <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-gray-700 text-lg leading-relaxed">
                For more information about <span className="font-bold text-red-600">allergens</span>,
                please talk to an <span className="font-bold text-slate-900">Ingredient Ambassador</span> at our Marketplace.
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
          </>
        )}

      </div>
    </div>
  );
}