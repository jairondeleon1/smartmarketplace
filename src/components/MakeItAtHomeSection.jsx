import React, { useState, useEffect } from 'react';
import { Upload, Loader2, ExternalLink, ChefHat, Trash2, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// --- Admin Upload Panel (shown only to admins) ---
export function MakeItAtHomeAdmin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cards, setCards] = useState([]);

  const loadCards = async () => {
    const items = await base44.entities.MakeItAtHome.list('-created_date');
    setCards(items);
  };

  useEffect(() => { loadCards(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      // Upload the PDF
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract info from the flyer using AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `This is a "Make It At Home" recipe flyer. Extract:
1. dish_name: The name of the dish shown on the flyer (e.g. "Everything Green Juice Shot")
2. description: The tagline or call-to-action text (e.g. "Get the recipe and add ingredients to your Instacart!")
3. recipe_link: The URL that the QR code points to (look for any URLs printed on the flyer, often from instacart.com or similar). If no URL is visible, return an empty string.
Return as JSON.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            dish_name: { type: "string" },
            description: { type: "string" },
            recipe_link: { type: "string" }
          }
        }
      });

      await base44.entities.MakeItAtHome.create({
        dish_name: result?.dish_name || file.name.replace('.pdf', ''),
        description: result?.description || 'Make this dish at home!',
        recipe_link: result?.recipe_link || '',
        image_url: file_url,
        active: true
      });

      await loadCards();
    } catch (err) {
      alert('Failed to process PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.MakeItAtHome.delete(id);
    setCards(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ChefHat className="w-5 h-5 text-teal-600" />
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Make It At Home — Upload Flyer</h3>
      </div>
      <p className="text-[11px] text-gray-500">Upload a "Make It At Home" PDF flyer. AI will extract the dish name, description, and QR code link automatically.</p>

      <input type="file" accept=".pdf" id="miah-upload" className="hidden" onChange={handleFileUpload} />
      <label htmlFor="miah-upload" className={`w-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 cursor-pointer transition ${isProcessing ? 'border-teal-200 bg-teal-50' : 'border-teal-100 hover:bg-teal-50'}`}>
        {isProcessing ? (
          <><Loader2 className="w-5 h-5 text-teal-600 animate-spin" /><span className="text-teal-700 font-bold text-sm">Processing flyer with AI...</span></>
        ) : (
          <><Upload className="w-5 h-5 text-teal-500" /><span className="text-teal-700 font-bold text-sm">Upload Make It At Home PDF</span></>
        )}
      </label>

      {cards.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Published Cards</p>
          {cards.map(card => (
            <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-bold text-sm text-slate-800">{card.dish_name}</p>
                <p className="text-[10px] text-gray-400 truncate max-w-xs">{card.recipe_link || 'No link'}</p>
              </div>
              <button onClick={() => handleDelete(card.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Public display card shown under the Lunch tab ---
export default function MakeItAtHomeSection() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    base44.entities.MakeItAtHome.filter({ active: true }, '-created_date').then(setCards).catch(() => {});
  }, []);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 flex items-center gap-1.5">
          <ChefHat className="w-3 h-3" /> Make It At Home
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header band */}
            <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm uppercase tracking-tight">{card.dish_name}</p>
                <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">Make This Dish At Home</p>
              </div>
              <QrCode className="w-6 h-6 text-teal-400 shrink-0" />
            </div>

            {/* Body */}
            <div className="p-5 flex-1 space-y-3">
              {card.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
              )}

              {card.recipe_link ? (
                <a
                  href={card.recipe_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm uppercase tracking-widest transition active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get the Recipe
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-400 font-bold rounded-xl text-sm uppercase tracking-widest">
                  <QrCode className="w-4 h-4" />
                  Scan QR Code In Cafe
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}