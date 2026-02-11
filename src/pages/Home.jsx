import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Utensils, 
  Leaf, 
  Zap, 
  ArrowRight,
  ArrowLeft,
  Loader2,
  Menu as MenuIcon,
  X, 
  Send,
  Calendar,
  ShoppingBag,
  Filter,
  XCircle,
  Upload,
  FileText,
  CheckCircle,
  RefreshCw,
  Lock,
  Wand,
  Settings,
  Sparkles,
  Heart,
  FileSearch,
  Download,
  AlertTriangle,
  MilkOff,
  WheatOff,
  NutOff,
  Info
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// --- CONSTANTS ---
const VEGAN_URL = "https://i.postimg.cc/MH7cDSz4/vegan.png"; 
const VEG_URL = "https://i.postimg.cc/hvsDvPDt/vegetarian.png";
const FIT_URL = "https://i.postimg.cc/KjQkB6SF/fit.png";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special', 'All Days'];

const SUGGESTIONS = [
  { text: "What is for lunch on Thursday?", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
  { text: "Which items are low in sodium?", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { text: "Show me high protein options", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  { text: "Any shellfish allergens?", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" }
];

// MENU DATA FROM PDF: Week of Feb 16 - Feb 20, 2026
const DEFAULT_MENU = [
  // MONDAY (Feb 16)
  { id: 1, station: "Main - Comfort", name: 'Chicken Parmesan', description: 'Breaded chicken breast topped with marinara and melted mozzarella.', ingredients: 'Chicken Breast, Breadcrumbs, Marinara Sauce, Mozzarella Cheese, Parmesan Cheese, Egg, Flour, Spices.', calories: 650, protein: 45, carbs: 35, fat: 32, sodium: 1150, fiber: 4, sugar: 6, tags: ['High Protein'], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Monday' },
  { id: 101, station: "Main - Comfort", name: 'Corn Muffin', description: 'Sweet and savory corn muffin.', ingredients: 'Cornmeal, Flour, Sugar, Milk, Egg, Butter, Baking Powder.', calories: 280, protein: 4, carbs: 38, fat: 12, sodium: 320, fiber: 2, sugar: 14, tags: ['Vegetarian'], allergens: ['Wheat', 'Egg', 'Milk'], day: 'Monday' },

  // TUESDAY (Feb 17)
  { id: 2, station: "Main - Comfort", name: 'Red Beans & Sausage', description: 'Slow-simmered red beans with savory sausage, served over steamed rice.', ingredients: 'Red Kidney Beans, Andouille Sausage, Onions, Celery, Bell Peppers, Rice, Cajun Spices.', calories: 420, protein: 24, carbs: 52, fat: 14, sodium: 620, fiber: 12, sugar: 2, tags: ['High Fiber', 'Dairy Free', 'Fit'], allergens: ['Soy'], day: 'Tuesday' },
  { id: 201, station: "Main - Comfort", name: 'Lasagna Al Forno', description: 'Classic baked lasagna with rich meat sauce and cheese.', ingredients: 'Ground Beef, Pork, Lasagna Noodles, Ricotta Cheese, Mozzarella, Parmesan, Marinara Sauce, Garlic, Herbs.', calories: 580, protein: 32, carbs: 45, fat: 28, sodium: 980, fiber: 3, sugar: 8, tags: [], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Tuesday' },

  // WEDNESDAY (Feb 18)
  { id: 3, station: "Main - Comfort", name: 'Vegetable Lasagna', description: 'Layers of pasta, ricotta, spinach, and marinara sauce baked to perfection.', ingredients: 'Lasagna Noodles, Spinach, Zucchini, Ricotta Cheese, Mozzarella, Marinara Sauce.', calories: 380, protein: 18, carbs: 42, fat: 16, sodium: 780, fiber: 6, sugar: 8, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat', 'Egg', 'Soy'], day: 'Wednesday' },
  { id: 301, station: "Main - Comfort", name: 'Collard Greens', description: 'Slow-cooked southern style collard greens.', ingredients: 'Collard Greens, Vegetable Broth, Onions, Garlic, Vinegar, Red Pepper Flakes.', calories: 120, protein: 4, carbs: 12, fat: 6, sodium: 450, fiber: 5, sugar: 2, tags: ['High Fiber', 'Dairy Free', 'Avoid Gluten', 'Fit'], allergens: [], day: 'Wednesday' },

  // THURSDAY (Feb 19)
  { id: 4, station: "Main - Comfort", name: 'Chicken & Broccoli Alfredo', description: 'Tender chicken and broccoli tossed in a rich, creamy alfredo sauce.', ingredients: 'Grilled Chicken, Broccoli Florets, Heavy Cream, Parmesan Cheese, Butter, Garlic, Fettuccine Pasta.', calories: 580, protein: 38, carbs: 42, fat: 28, sodium: 890, fiber: 3, sugar: 4, tags: ['High Protein'], allergens: ['Milk', 'Wheat'], day: 'Thursday' },
  { id: 5, station: "Main - Comfort", name: 'Fried Breaded Okra', description: 'Crispy southern-style okra served as a premium side.', ingredients: 'Okra, Cornmeal, Flour, Buttermilk, Spices, Canola Oil.', calories: 210, protein: 4, carbs: 22, fat: 12, sodium: 310, fiber: 3, sugar: 2, tags: ['Vegetarian'], allergens: ['Wheat'], day: 'Thursday' },
  { id: 401, station: "Pizza", name: 'Prosciutto Arugula Pizza', description: 'Thin crust pizza topped with salty prosciutto and fresh arugula.', ingredients: 'Pizza Dough, Prosciutto, Arugula, Mozzarella Cheese, Olive Oil, Balsamic Glaze.', calories: 350, protein: 16, carbs: 38, fat: 14, sodium: 750, fiber: 2, sugar: 2, tags: [], allergens: ['Wheat', 'Milk'], day: 'Thursday' },

  // FRIDAY (Feb 20)
  { id: 6, station: "Main - Comfort", name: 'Shrimp, Sausage & Jambalaya', description: 'A classic Mardi Gras stew with andouille sausage, shrimp, and clams.', ingredients: 'Shrimp, Andouille Sausage, Clams, Rice, Tomato Sauce, Cajun Seasoning, Bell Peppers, Onions.', calories: 480, protein: 32, carbs: 45, fat: 18, sodium: 980, fiber: 3, sugar: 4, tags: ['High Protein', 'Spicy', 'Dairy Free', 'Avoid Gluten', 'Fit'], allergens: ['Shellfish', 'Soy'], day: 'Friday' },
  { id: 601, station: "Main - Comfort", name: 'Cheese Tortellini', description: 'Cheese filled tortellini served with marinara sauce.', ingredients: 'Cheese Tortellini (Wheat, Egg, Milk), Marinara Sauce, Parmesan Cheese, Basil.', calories: 320, protein: 12, carbs: 48, fat: 8, sodium: 450, fiber: 3, sugar: 6, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Friday' },

  // DAILY SPECIALS
  { id: 7, station: "Soup", name: 'Broccoli Cheddar Soup', description: 'Creamy soup with tender broccoli florets and sharp cheddar cheese.', ingredients: 'Broccoli, Cheddar Cheese, Milk, Cream, Chicken Broth, Onions, Carrots.', calories: 220, protein: 5, carbs: 14, fat: 17, sodium: 730, fiber: 2, sugar: 5, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat'], day: 'Daily Special' },
  { id: 8, station: "Dessert", name: 'Coconut Key Lime Cookie', description: 'Sweet cookie with zesty lime and coconut.', ingredients: 'Flour, Sugar, Butter, Coconut, Lime Zest, Eggs, Baking Soda.', calories: 180, protein: 2, carbs: 24, fat: 9, sodium: 120, fiber: 1, sugar: 14, tags: ['Vegetarian'], allergens: ['Wheat', 'Milk', 'Egg', 'Coconut'], day: 'Daily Special' }
];

// --- UI HELPERS ---

function Badge({ children }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  let color = colors.blue;
  const text = typeof children === 'string' ? children : '';
  if (text.includes('Vegan') || text.includes('Vegetarian')) color = colors.green;
  if (text.includes('Protein')) color = colors.purple;
  if (text.includes('Heart') || text.includes('Sodium') || text.includes('Spicy')) color = colors.red;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${color}`}>{children}</span>;
}

function FormattedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => (part.startsWith('**') && part.endsWith('**')) ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}
    </span>
  );
}

function VegProgramIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  const src = url || VEG_URL;
  if (error) return <Leaf className={`${className} text-emerald-600`} />;
  return <img src={src} alt="Vegetarian" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function VeganProgramIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  const src = url || VEGAN_URL;
  if (error) return <CheckCircle className={`${className} text-emerald-800`} />;
  return <img src={src} alt="Vegan" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function FitIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  const src = url || FIT_URL;
  if (error) return <Zap className={`${className} text-blue-600`} />;
  return <img src={src} alt="Fit" className={`${className} object-contain`} onError={() => setError(true)} />;
}

// --- MODALS ---

function WeeklyPlannerModal({ isOpen, onClose, menuItems, addToPlate }) {
  const [goal, setGoal] = useState('High Protein');
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePlan = async () => {
    setIsLoading(true);
    const prompt = `Plan 5-day meal menu for goal: "${goal}". Menu Data: ${JSON.stringify(menuItems.map(i => ({id: i.id, name: i.name, day: i.day})))}. Return ONLY JSON {"Monday": ID, "Tuesday": ID, ...}`;
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            Monday: { type: "number" },
            Tuesday: { type: "number" },
            Wednesday: { type: "number" },
            Thursday: { type: "number" },
            Friday: { type: "number" }
          }
        }
      });
      if (response) {
        setPlan(Object.entries(response).map(([day, id]) => ({ day, item: menuItems.find(i => i.id === id) })).filter(e => e.item));
      }
    } catch (e) { 
      setPlan(null); 
    } finally { 
      setIsLoading(false); 
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 font-sans font-bold">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center border-b border-white/5">
          <h3 className="font-bold text-2xl flex items-center gap-2 uppercase tracking-tight text-white"><Wand className="w-6 h-6 text-emerald-400" /> AI Strategy</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-8 space-y-6 font-medium font-sans">
          {!plan ? (
            <>
              <div className="grid grid-cols-1 gap-2 font-sans font-bold">
                {['High Protein', 'Vegetarian', 'Balanced Strategy'].map(g => (
                  <button key={g} onClick={() => setGoal(g)} className={`p-4 rounded-xl border-2 text-left transition-all font-sans font-bold ${goal === g ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-gray-100 text-gray-500'}`}>
                    <span className="uppercase text-xs tracking-widest font-sans font-bold">{g}</span>
                  </button>
                ))}
              </div>
              <button onClick={generatePlan} disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all font-sans font-bold">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Optimize Week'}
              </button>
            </>
          ) : (
            <div className="space-y-3 text-sm font-sans font-bold">
              {plan.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-slate-800 font-sans"><span className="text-emerald-700 w-12 text-[10px] uppercase border-r border-gray-200 pr-2">{entry.day.slice(0,3)}</span><span className="truncate">{entry.item.name}</span></div>
              ))}
              <button onClick={() => { plan.forEach(e => addToPlate(e.item)); onClose(); }} className="w-full py-4 bg-slate-900 text-white font-bold uppercase text-xs rounded-xl mt-4 active:scale-95 transition-all tracking-widest font-sans font-bold">Add All to Tray</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrayDetailsModal({ isOpen, onClose, plate, setPlate }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const totals = plate.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    carbs: acc.carbs + (item.carbs || 0),
    sodium: acc.sodium + (item.sodium || 0)
  }), { calories: 0, protein: 0, carbs: 0, sodium: 0 });

  const handleDownloadReport = () => {
    setIsExporting(true);
    let htmlContent = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; }.container { max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }.header { background: #065f46; color: white; padding: 32px 24px; text-align: center; }.content { padding: 24px; }.item { border-bottom: 1px solid #f1f5f9; padding: 16px 0; display: flex; justify-content: space-between; }.stat { flex: 1; text-align: center; }.val { display: block; font-weight: 800; font-size: 18px; color: #065f46; }</style></head><body><div class="container"><div class="header"><h1>SmartMarketplace</h1><p>NUTRITION SUMMARY • ${new Date().toLocaleDateString()}</p></div><div class="content">${plate.map(item => `<div class="item"><span>${item.name}</span><b>${item.calories} CAL</b></div>`).join('')}<div style="display:flex; gap:10px; margin-top:20px;"><div class="stat"><span class="val">${totals.calories}</span><small>Cals</small></div><div class="stat"><span class="val">${totals.protein}g</span><small>Prot</small></div></div></div></div></body></html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = "Marketplace_Report.html"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setTimeout(() => { setIsExporting(false); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }, 800);
  };

  const removeItem = (index) => {
    setPlate(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans font-medium">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 font-sans font-bold">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-emerald-400 font-sans font-bold" />
            <h3 className="font-bold text-xl uppercase tracking-tight font-sans text-white">My Nutrition Tray</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition font-sans"><X className="w-6 h-6 text-white font-sans" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans font-bold">
          {showSuccess && <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2 animate-in fade-in font-sans font-bold">Report Exported Successfully!</div>}
          {plate.length === 0 ? <div className="text-center py-12 text-gray-400 font-bold uppercase text-sm font-sans tracking-widest font-bold">Your tray is empty</div> : 
            plate.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group font-medium font-sans font-bold">
                <div className="flex-1 pr-4 font-sans font-bold">
                  <p className="font-bold text-gray-800 text-sm truncate uppercase font-sans font-bold">{item.name}</p>
                  <div className="flex gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans font-bold"><span>{item.calories} Cal</span><span>{item.protein}g Prot</span></div>
                </div>
                <button onClick={() => removeItem(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors font-sans font-bold"><Trash2 className="w-5 h-5 font-sans" /></button>
              </div>
            ))
          }
        </div>
        {plate.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4 shrink-0 font-sans font-bold">
            <div className="grid grid-cols-4 gap-2 text-center font-sans font-bold">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm font-bold font-bold"><span className="block text-sm font-bold text-slate-800 font-sans font-bold">{totals.calories}</span><span className="text-[8px] text-gray-400 font-bold uppercase font-sans font-bold tracking-widest">Cals</span></div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm font-bold font-bold"><span className="block text-sm font-bold text-slate-800 font-sans font-bold">{totals.protein}g</span><span className="text-[8px] text-gray-400 font-bold uppercase font-sans font-bold tracking-widest">Prot</span></div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm font-bold font-bold"><span className="block text-sm font-bold text-slate-800 font-sans font-bold">{totals.carbs}g</span><span className="text-[8px] text-gray-400 font-bold uppercase font-sans font-bold tracking-widest">Carbs</span></div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm font-bold font-bold"><span className="block text-sm font-bold text-slate-800 font-sans font-bold">{totals.sodium}mg</span><span className="text-[8px] text-gray-400 font-bold uppercase font-sans font-bold tracking-widest">Sod</span></div>
            </div>
            <button onClick={handleDownloadReport} disabled={isExporting} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 font-sans font-bold tracking-widest">
              {isExporting ? <Loader2 className="animate-spin w-4 h-4 font-sans font-bold" /> : <><Download className="w-4 h-4 font-sans text-emerald-100 font-bold" /> Download Report</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({ item, addToPlate, customVegUrl, customVeganUrl }) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 font-sans hover:shadow-md font-medium">
      <div className="p-5 flex-1 font-sans font-bold font-medium">
        <div className="flex justify-between items-start mb-2 font-sans font-bold">
          <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-sans tracking-tight font-bold">{item.station}</span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans font-bold font-bold"><Calendar className="w-3 h-3 font-bold"/> {item.day}</div>
        </div>
        <h4 className="font-bold text-gray-800 text-lg leading-tight flex items-center gap-2 mb-2 font-sans font-bold font-bold">
          {item.name}
          {item.tags?.includes('Vegan') ? <VeganProgramIcon url={customVeganUrl} className="w-6 h-6 font-bold" /> : 
           item.tags?.includes('Vegetarian') ? <VegProgramIcon url={customVegUrl} className="w-6 h-6 font-bold" /> : null}
          {item.tags?.includes('Fit') && <FitIcon className="w-6 h-6 font-bold" />}
        </h4>
        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 font-sans font-medium font-bold">{item.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4 font-sans font-bold">{item.tags?.map(tag => <Badge key={tag}>{tag}</Badge>)}</div>
        <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-xl mb-4 border border-gray-100/50 font-bold font-bold">
          <div><span className="block text-sm font-bold text-gray-700 font-sans font-bold">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold font-sans tracking-widest font-bold">Cals</span></div>
          <div><span className="block text-sm font-bold text-gray-700 font-sans font-bold">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold font-sans tracking-widest font-bold">Prot</span></div>
          <div><span className="block text-sm font-bold text-gray-700 font-sans font-bold">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold font-sans tracking-widest font-bold">Carb</span></div>
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-2 font-sans font-bold">
        <button onClick={() => setShowDetails(!showDetails)} className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition font-sans font-bold">{showDetails ? 'Hide Info' : 'Nutrition Details'}</button>
        <button onClick={() => addToPlate(item)} className="w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg transition active:scale-90 hover:bg-black font-sans font-bold"><Plus className="w-5 h-5 font-sans font-bold" /></button>
      </div>
      {showDetails && (
        <div className="px-5 pb-5 space-y-2 animate-in slide-in-from-top-2 text-xs font-sans font-bold">
          {item.ingredients && (
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2 font-sans">
              <div className="flex items-center gap-1.5 mb-1 font-sans">
                <Info className="w-3 h-3 text-slate-400 font-sans" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-sans">Ingredients</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug font-sans font-medium">{item.ingredients}</p>
            </div>
          )}
          <div className="flex justify-between border-b pb-1 text-gray-600 font-sans font-bold">Sodium<span className="font-bold text-gray-900 font-sans font-bold">{item.sodium}mg</span></div>
          <div className="flex justify-between border-b pb-1 text-gray-600 font-sans font-bold">Fiber<span className="font-bold text-gray-900 font-sans font-bold">{item.fiber}g</span></div>
          <div className="flex justify-between border-b pb-1 text-gray-600 font-sans font-bold">Sugars<span className="font-bold text-gray-900 font-sans font-bold">{item.sugar}g</span></div>
          {item.allergens && <div className="text-red-600 font-bold mt-1 uppercase text-[10px] font-sans tracking-widest font-bold">Contains: {item.allergens.join(', ')}</div>}
        </div>
      )}
    </div>
  );
}

function TraySummary({ plate, onClick }) {
  if (plate.length === 0) return null;
  const totalCals = plate.reduce((acc, item) => acc + (item.calories || 0), 0);
  return (
    <div onClick={onClick} className="fixed bottom-6 left-6 right-6 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 z-50 flex justify-between items-center border border-white/10 transform transition hover:scale-[1.01] hover:bg-slate-800 cursor-pointer font-sans font-medium">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-xl shadow-lg font-sans"><ShoppingBag className="w-5 h-5 font-sans text-white" /></div>
        <div><p className="font-bold text-sm leading-tight tracking-tight text-white font-sans font-bold uppercase">My Tray ({plate.length})</p><p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest font-sans font-bold">Tap to View Details</p></div>
      </div>
      <div className="text-right pr-2 font-bold font-sans">
        <span className="block font-bold text-emerald-400 text-lg leading-none tracking-tight font-sans font-bold">{totalCals}</span>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest font-sans font-bold">Total Cals</span>
      </div>
    </div>
  );
}

// --- CORE VIEWS ---

function NavBar({ view, changeView, isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <nav className="bg-emerald-800 text-white p-4 shadow-lg sticky top-0 z-50 h-16 flex items-center w-full shrink-0 font-sans font-bold">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-2 font-sans font-bold">
        <div className="flex items-center gap-2 cursor-pointer font-sans font-bold font-bold" onClick={() => changeView('customer')}>
          <Utensils className="w-6 h-6 text-white font-bold" />
          <h1 className="text-xl font-bold uppercase tracking-widest text-white font-sans font-bold">SmartMarketplace</h1>
        </div>
        <div className="hidden md:flex gap-6 items-center text-sm font-bold uppercase tracking-widest font-sans font-bold">
          <button onClick={() => changeView('customer')} className={view === 'customer' ? 'text-white border-b-2 border-white pb-1' : 'text-emerald-100 opacity-70'}>Menu</button>
          <button onClick={() => changeView('chat')} className={view === 'chat' ? 'text-white border-b-2 border-white pb-1' : 'text-emerald-100 opacity-70'}>AI Assistant</button>
          <button onClick={() => changeView('admin')} className={view === 'admin' ? 'text-white border-b-2 border-white pb-1' : 'text-emerald-100 opacity-70'}>Admin</button>
        </div>
        <div className="md:hidden flex items-center gap-2">
           <button className="p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X className="text-white" /> : <MenuIcon className="text-white" />}</button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-emerald-800 border-t border-emerald-700 shadow-xl md:hidden z-[110] flex flex-col p-4 gap-4 font-bold uppercase text-sm tracking-widest font-sans text-white">
          <button onClick={() => { changeView('customer'); setIsMobileMenuOpen(false); }} className="text-left font-bold">Daily Menu</button>
          <button onClick={() => { changeView('chat'); setIsMobileMenuOpen(false); }} className="text-left font-bold">AI Assistant</button>
          <button onClick={() => { changeView('admin'); setIsMobileMenuOpen(false); }} className="text-left font-bold">Admin</button>
        </div>
      )}
    </nav>
  );
}

function ChatView({ chatHistory, isTyping, userQuery, setUserQuery, handleSendChat }) {
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isTyping]);
  return (
    <div className="fixed inset-0 top-16 flex flex-col bg-stone-50 z-40 font-sans">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm font-medium ${msg.role === 'user' ? 'bg-emerald-800 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
              <FormattedText text={msg.content} />
            </div>
            {msg.role === 'ai' && idx === 0 && (
              <div id="ai-chat-suggestions" className="mt-4 grid grid-cols-1 gap-2 w-full max-w-[85%] animate-in slide-in-from-bottom-2 duration-500">
                {SUGGESTIONS.map((s, i) => {
                  const IconComp = s.icon;
                  return (
                    <button key={i} onClick={() => handleSendChat(s.text)} className="text-left p-4 bg-white border border-indigo-100 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-all flex items-center gap-3 group shadow-sm active:scale-95">
                      <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><IconComp className="w-4 h-4" /></div>
                      <span className="flex-1 font-bold">{s.text}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {isTyping && <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-flex items-center gap-2 text-xs font-bold text-gray-400 ml-4 animate-pulse">AI Analyzing...</div>}
        <div ref={chatEndRef} className="h-20" />
      </div>
      <div className="bg-white border-t border-gray-100 p-4 pb-10 flex gap-3 shrink-0">
        <input type="text" value={userQuery} onChange={e => setUserQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} className="flex-1 p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm tracking-tight" placeholder="Message AI Assistant..."/>
        <button onClick={() => handleSendChat()} className="bg-emerald-800 text-white p-4 rounded-xl shadow-lg active:scale-90 transition-all"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function AdminView({ menuItems, onLogout, customVegUrl, setCustomVegUrl, customVeganUrl, setCustomVeganUrl, newItem, setNewItem, handleAddItem, handleDeleteItem }) {
  const [isSyncing, setIsSyncing] = useState(null);
  
  const handleFileUpload = (e, label) => {
    const file = e.target.files[0];
    if (file) {
      setIsSyncing(label);
      setTimeout(() => {
        setIsSyncing(null);
        alert(`Successfully synced data from: ${file.name}`);
      }, 2000);
    }
  };

  const syncOptions = [
    { label: "1. Week Glance PDF", type: "week", icon: FileText }, 
    { label: "2. Station Reports PDF", type: "station", icon: FileSearch }, 
    { label: "3. Nutrition PDF", type: "nutrition", icon: Sparkles }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32 font-sans overflow-x-hidden font-medium">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm font-sans font-bold">
        <div><h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Admin Hub</h2><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 text-emerald-800">Infrastructure Control</p></div>
        <button onClick={onLogout} className="text-red-500 font-bold hover:bg-red-50 px-6 py-3 rounded-xl transition border border-red-100 uppercase text-[10px] tracking-widest">Logout</button>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 tracking-widest"><Upload className="w-4 h-4 text-emerald-600"/> Matrix Sync</h3>
          <div className="space-y-3">
            {syncOptions.map(opt => (
              <div key={opt.type}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    id={`file-upload-${opt.type}`}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, opt.label)} 
                  />
                  <label 
                    htmlFor={`file-upload-${opt.type}`}
                    className="w-full p-6 border-2 border-dashed border-emerald-100 rounded-2xl flex flex-col items-center gap-2 text-emerald-800 hover:bg-emerald-50 transition active:scale-[0.98] cursor-pointer"
                  >
                    {isSyncing === opt.label ? <Loader2 className="animate-spin w-8 h-8" /> : <><opt.icon className="w-8 h-8 opacity-40"/><span className="text-[11px] font-bold uppercase tracking-widest">{opt.label}</span></>}
                  </label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8 font-medium">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 tracking-widest"><Settings className="w-4 h-4 text-emerald-600"/> Assets</h3>
            <div className="space-y-4">
              <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Veg URL</label><input type="text" value={customVegUrl} onChange={e => setCustomVegUrl(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none" /></div>
              <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Vegan URL</label><input type="text" value={customVeganUrl} onChange={e => setCustomVeganUrl(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none" /></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 tracking-widest"><Plus className="w-4 h-4 text-emerald-600"/> Manual Entry</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input type="text" placeholder="Dish Name" className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              
              <textarea 
                placeholder="Ingredients List (e.g. Flour, Sugar, Milk...)" 
                className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none resize-none h-24" 
                value={newItem.ingredients || ''}
                onChange={e => setNewItem({...newItem, ingredients: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-3">
                <select className="p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none cursor-pointer font-sans" value={newItem.day} onChange={e => setNewItem({...newItem, day: e.target.value})}>
                  {DAYS.filter(d => d !== 'All Days').map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="number" placeholder="Cals" className="p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none" value={newItem.calories} onChange={e => setNewItem({...newItem, calories: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold uppercase text-xs hover:bg-black transition-all shadow-xl active:scale-95 tracking-widest">Publish Dish</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---

export default function Home() {
  const getCurrentDay = () => {
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (day === 'Saturday' || day === 'Sunday') ? 'Monday' : day;
  };

  const [view, setView] = useState('customer'); 
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU);
  const [myPlate, setMyPlate] = useState([]);
  const [isTrayModalOpen, setIsTrayModalOpen] = useState(false);
  const [isWeeklyPlannerOpen, setIsWeeklyPlannerOpen] = useState(false);
  const [customVegUrl, setCustomVegUrl] = useState("");
  const [customVeganUrl, setCustomVeganUrl] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: "Hello! I am your Marketplace Assistant. How may I assist your choices today?" }]);
  const [userQuery, setUserQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', day: 'Monday', station: "Chef's Table", ingredients: '', calories: '', protein: '', carbs: '', fat: '', isVeg: false, isVegan: false });
  const [activeFilters, setActiveFilters] = useState({ vegetarian: false, vegan: false, fit: false });
  const dayScrollRef = useRef(null);

  const changeView = (v) => { setView(v); setIsMobileMenuOpen(false); window.scrollTo(0,0); };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dayScrollRef.current) {
        const container = dayScrollRef.current;
        const activeButton = container.querySelector(`[data-day="${selectedDay}"]`);
        if (activeButton) {
          const containerWidth = container.offsetWidth;
          const buttonLeft = activeButton.offsetLeft;
          const buttonWidth = activeButton.offsetWidth;
          const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
          container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDay]);

  const addToPlate = (item) => {
    setMyPlate(prev => [...prev, item]);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const tags = [];
    if (newItem.isVeg) tags.push('Vegetarian');
    if (newItem.isVegan) tags.push('Vegan');
    setMenuItems([...menuItems, { ...newItem, id: Date.now(), calories: Number(newItem.calories), protein: Number(newItem.protein), tags }]);
    setNewItem({ name: '', day: 'Monday', station: "Chef's Table", ingredients: '', calories: '', protein: '', carbs: '', fat: '', isVeg: false, isVegan: false });
  };

  const handleDeleteItem = (id) => setMenuItems(menuItems.filter(i => i.id !== id));

  const handleSendChat = async (overrideText = null) => {
    const textToSend = overrideText || userQuery;
    if (!textToSend.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: textToSend }]);
    setUserQuery('');
    setIsTyping(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful nutrition assistant for a corporate cafeteria. Context Menu: ${JSON.stringify(menuItems)}. User question: ${textToSend}. Provide helpful, concise answers about the menu items, nutrition, allergens, etc.`
      });
      if (response) setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
    } catch (e) { 
      setChatHistory(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please check the menu directly for nutrition information!" }]); 
    }
    finally { setIsTyping(false); }
  };

  const toggleFilter = (filter) => {
    setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  const clearFilters = () => {
    setActiveFilters({ vegetarian: false, vegan: false, fit: false });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesDay = selectedDay === 'All Days' || item.day === selectedDay || item.day === 'Daily Special';
    if (!matchesDay) return false;
    
    if (activeFilters.vegetarian && !item.tags?.includes('Vegetarian') && !item.tags?.includes('Vegan')) return false;
    if (activeFilters.vegan && !item.tags?.includes('Vegan')) return false;
    if (activeFilters.fit && !item.tags?.includes('Fit')) return false;
    
    return true;
  });

  const trayTotals = myPlate.reduce((acc, item) => acc + (item.calories || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 font-sans tracking-tight overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 font-bold">
      <NavBar view={view} changeView={changeView} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <main className="w-full font-bold">
        {view === 'customer' && (
          <div className="max-w-5xl mx-auto p-4 space-y-8 pb-32 font-sans overflow-x-hidden font-bold">
             <div className="text-center space-y-6 pt-10 font-sans font-bold">
                <div className="space-y-1 font-sans font-bold">
                  <h2 className="text-4xl font-bold text-slate-900 uppercase tracking-widest font-sans leading-none font-bold">SmartMarketplace</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] tracking-[0.2em] font-sans font-bold"> Heathrow HUB Daily Nutrition Portal</p>
                </div>
                <div className="flex flex-col gap-4 items-center max-w-xl mx-auto px-2 font-sans font-bold">
                  <button id="week-planner" onClick={() => setIsWeeklyPlannerOpen(true)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 border border-slate-800 font-sans font-bold uppercase tracking-widest text-xs active:scale-95 transition-all font-bold">
                    <Wand className="w-5 h-5 text-emerald-400 font-sans font-bold" /> Plan My Whole Week Meal
                  </button>
                  <div id="ai-banner" onClick={() => changeView('chat')} className="w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 rounded-2xl p-5 text-white shadow-2xl cursor-pointer transform transition-all hover:scale-[1.01] flex items-center justify-between text-left border border-white/10 group overflow-hidden font-bold">
                    <div className="flex items-center gap-4 relative z-10 font-sans font-bold"><div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10 font-sans font-bold"><Sparkles className="w-5 h-5 text-white animate-pulse font-sans font-bold" /></div><div><h3 className="font-bold text-sm uppercase tracking-widest text-white font-sans font-bold">Ask AI Assistant</h3><p className="text-white/80 text-[11px] font-medium italic opacity-80 font-sans font-bold">Nutrition Guide & Choices</p></div></div>
                    <div className="bg-white/20 p-2 rounded-full border border-white/10 text-white transition-transform group-hover:translate-x-1 shadow-inner font-sans font-bold"><ArrowRight className="w-5 h-5 font-sans font-bold" /></div>
                  </div>
                </div>
                
                <div ref={dayScrollRef} id="day-selector" className="flex w-full overflow-x-auto py-4 px-2 snap-x gap-2 scroll-smooth font-sans font-bold [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {DAYS.map(d => (
                    <button key={d} data-day={d} onClick={() => setSelectedDay(d)} className={`whitespace-nowrap px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all snap-start shadow-sm border font-sans font-bold ${selectedDay === d ? 'bg-emerald-800 text-white border-emerald-900 shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400 font-medium tracking-widest'}`}>{d}</button>
                  ))}
                </div>

                <div id="dietary-filters" className="flex flex-wrap justify-center gap-2 font-sans font-bold font-medium">
                   <button onClick={() => toggleFilter('vegetarian')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 font-sans font-bold ${activeFilters.vegetarian ? 'bg-green-50 border-green-500 text-green-900 font-bold' : 'bg-white border-gray-100 text-gray-400 font-bold'}`}><VegProgramIcon url={customVegUrl} className="w-4 h-4 font-sans font-bold" /> Veg</button>
                   <button onClick={() => toggleFilter('vegan')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 font-sans font-bold ${activeFilters.vegan ? 'bg-green-50 border-green-500 text-green-900 font-bold' : 'bg-white border-gray-100 text-gray-400 font-bold'}`}><VeganProgramIcon url={customVeganUrl} className="w-4 h-4 font-sans font-bold" /> Vegan</button>
                   <button onClick={() => toggleFilter('fit')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 font-sans font-bold ${activeFilters.fit ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'bg-white border-gray-100 text-gray-400 font-bold'}`}><FitIcon className="w-4 h-4 font-sans font-bold" /> Fit</button>
                   {Object.values(activeFilters).some(Boolean) && <button onClick={clearFilters} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition font-sans font-bold"><XCircle className="w-5 h-5 font-sans font-bold" /></button>}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 font-sans font-bold font-medium">
                {filteredItems.length > 0 ? filteredItems.map(item => <MenuItemCard key={item.id} item={item} addToPlate={addToPlate} customVegUrl={customVegUrl} customVeganUrl={customVeganUrl} />) : 
                <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm font-sans">No menu items match your filters</div>}
             </div>
          </div>
        )}
        {view === 'chat' && <ChatView chatHistory={chatHistory} isTyping={isTyping} userQuery={userQuery} setUserQuery={setUserQuery} handleSendChat={handleSendChat} />}
        {view === 'admin' && !isAdminLoggedIn && (
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 tracking-tight font-sans font-bold">
            <form onSubmit={(e) => { e.preventDefault(); if (e.target.pw.value === 'admin123') setIsAdminLoggedIn(true); }} className="bg-white p-14 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-gray-100 text-center space-y-8 animate-in zoom-in-95 font-sans font-medium">
              <div className="bg-emerald-50 p-6 rounded-3xl inline-block border border-emerald-100 shadow-inner font-sans font-bold"><Lock className="w-10 h-10 text-emerald-800 font-sans font-bold" /></div>
              <div className="space-y-1 font-sans font-bold">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-900 leading-none tracking-widest font-sans font-bold">Matrix Hub</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3 tracking-[0.2em] font-sans font-bold">Personnel Authorization Required</p>
              </div>
              <input name="pw" type="password" className="w-full p-5 border-none rounded-2xl bg-gray-100 outline-none focus:ring-4 focus:ring-emerald-100 font-bold text-center tracking-[0.4em] shadow-inner text-lg font-sans font-bold" placeholder="••••" />
              <button className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all font-sans font-bold">Verify Access</button>
            </form>
          </div>
        )}
        {view === 'admin' && isAdminLoggedIn && <AdminView menuItems={menuItems} onLogout={() => setIsAdminLoggedIn(false)} customVegUrl={customVegUrl} setCustomVegUrl={setCustomVegUrl} customVeganUrl={customVeganUrl} setCustomVeganUrl={setCustomVeganUrl} newItem={newItem} setNewItem={setNewItem} handleAddItem={handleAddItem} handleDeleteItem={(id) => setMenuItems(menuItems.filter(i => i.id !== id))} />}
      </main>
      
      <TraySummary plate={myPlate} onClick={() => setIsTrayModalOpen(true)} />
      
      <TrayDetailsModal 
        isOpen={isTrayModalOpen} 
        onClose={() => setIsTrayModalOpen(false)} 
        plate={myPlate} 
        setPlate={setMyPlate} 
      />

      <WeeklyPlannerModal isOpen={isWeeklyPlannerOpen} onClose={() => setIsWeeklyPlannerOpen(false)} menuItems={menuItems} addToPlate={addToPlate} />
    </div>
  );
}