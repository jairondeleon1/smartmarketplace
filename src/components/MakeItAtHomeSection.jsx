import React, { useState, useEffect } from 'react';
import { Upload, Loader2, ExternalLink, ChefHat, Trash2, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Default recipe link used for all Make It At Home cards
const RECIPE_LINK = 'https://nam11.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.weeatlivedowell.com%2Frecipes%2F&data=05%7C02%7CJairon.DeLeon%40compass-usa.com%7C15fac157973c487ab90d08dea79b52bc%7Ccd62b7dd4b4844bd90e7e143a22c8ead%7C0%7C0%7C639132482716854007%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=82ljV9Uo1lMMyoUIRm%2B%2F4YyBXkBUclYUi4byOpejxiA%3D&reserved=0';

// --- Admin Upload Panel (shown only to admins) ---
export function MakeItAtHomeAdmin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cards, setCards] = useState([]);
  const [editingLink, setEditingLink] = useState({});
  const [savingLink, setSavingLink] = useState(null);

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
      // Upload first so we have a real URL for the LLM
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `This is a "Make It At Home" recipe flyer PDF. Extract:
1. dish_name: The main dish or recipe name prominently displayed (e.g. "Green Juice Shot", "Chicken Tikka Masala")
2. description: Any tagline, subtitle, or call-to-action text
Return as JSON only.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            dish_name: { type: "string" },
            description: { type: "string" }
          }
        }
      }).catch(() => null);

      await base44.entities.MakeItAtHome.create({
        dish_name: result?.dish_name || file.name.replace(/_/g, ' ').replace(/\.[^.]+$/, ''),
        description: result?.description || 'Make this dish at home!',
        recipe_link: RECIPE_LINK,
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

  const handleSaveLink = async (card) => {
    const newLink = editingLink[card.id] ?? card.recipe_link;
    setSavingLink(card.id);
    await base44.entities.MakeItAtHome.update(card.id, { recipe_link: newLink });
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, recipe_link: newLink } : c));
    setEditingLink(prev => { const n = { ...prev }; delete n[card.id]; return n; });
    setSavingLink(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ChefHat className="w-5 h-5 text-teal-600" />
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Make It At Home — Upload Flyer</h3>
      </div>
      <p className="text-[11px] text-gray-500">
        Upload a PDF flyer. AI extracts the dish name and description. All cards link to the <strong>weeatlivedowell.com/recipes</strong> page.
      </p>

      <input type="file" accept=".pdf" id="miah-upload" className="hidden" onChange={handleFileUpload} />
      <label htmlFor="miah-upload" className={`w-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 cursor-pointer transition ${isProcessing ? 'border-teal-200 bg-teal-50' : 'border-teal-100 hover:bg-teal-50'}`}>
        {isProcessing ? (
          <><Loader2 className="w-5 h-5 text-teal-600 animate-spin" /><span className="text-teal-700 font-bold text-sm">Processing flyer with AI...</span></>
        ) : (
          <><Upload className="w-5 h-5 text-teal-500" /><span className="text-teal-700 font-bold text-sm">Upload Make It At Home PDF</span></>
        )}
      </label>

      {cards.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Published Cards</p>
          {cards.map(card => (
            <div key={card.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-800">{card.dish_name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.description}</p>
                </div>
                <button onClick={() => handleDelete(card.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {/* Editable link field */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Recipe URL</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Override recipe link if needed"
                    className="flex-1 p-2.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                    value={editingLink[card.id] ?? card.recipe_link ?? ''}
                    onChange={e => setEditingLink(prev => ({ ...prev, [card.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleSaveLink(card)}
                    disabled={savingLink === card.id}
                    className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition disabled:opacity-50 shrink-0"
                  >
                    {savingLink === card.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                </div>
                {card.recipe_link && (
                  <p className="text-[10px] text-green-600 font-bold">✓ Link active — "Get the Recipe" button is live</p>
                )}
              </div>
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
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 flex items-center gap-1.5">
          <ChefHat className="w-3 h-3" /> Make It At Home
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {card.image_url && !card.image_url.endsWith('.pdf') && (
              <img src={card.image_url} alt={card.dish_name} className="w-full object-cover max-h-48" />
            )}
            <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm uppercase tracking-tight">{card.dish_name}</p>
                <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">Make This Dish At Home</p>
              </div>
              <QrCode className="w-6 h-6 text-teal-400 shrink-0" />
            </div>

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