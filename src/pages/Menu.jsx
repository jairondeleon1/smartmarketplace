import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat, MessageSquare, Plus, Trash2, Utensils, Leaf, Zap, ArrowRight,
  Loader2, Calendar, ShoppingBag, Filter, XCircle, CheckCircle, Download,
  AlertTriangle, MilkOff, WheatOff, NutOff, Info, User, Wand, Sparkles,
  Heart, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NutritionDetailView from '../components/NutritionDetailView';
import WeeklyPlannerModal from '../components/WeeklyPlannerModal';
import TrayDetailsModal from '../components/TrayDetailsModal';
import { useNavigate } from 'react-router-dom';

const VEGAN_URL = "https://i.postimg.cc/MH7cDSz4/vegan.png";
const VEG_URL = "https://i.postimg.cc/hvsDvPDt/vegetarian.png";
const FIT_URL = "https://i.postimg.cc/KjQkB6SF/fit.png";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special', 'All Days'];

const DEFAULT_MENU = [
  { id: 1, station: "Main - Comfort", name: 'Chicken Parmesan', description: 'Breaded chicken breast topped with marinara and melted mozzarella.', ingredients: 'Chicken Breast, Breadcrumbs, Marinara Sauce, Mozzarella Cheese, Parmesan Cheese, Egg, Flour, Spices.', calories: 650, protein: 45, carbs: 35, fat: 32, saturated_fat: 12, unsaturated_fat: 20, sodium: 1150, fiber: 4, sugar: 6, cholesterol: 145, vitamin_a: 380, vitamin_c: 8, vitamin_d: 1.2, calcium: 420, iron: 3.8, potassium: 520, tags: ['High Protein'], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Monday' },
  { id: 101, station: "Main - Comfort", name: 'Corn Muffin', description: 'Sweet and savory corn muffin.', ingredients: 'Cornmeal, Flour, Sugar, Milk, Egg, Butter, Baking Powder.', calories: 280, protein: 4, carbs: 38, fat: 12, saturated_fat: 7, unsaturated_fat: 5, sodium: 320, fiber: 2, sugar: 14, cholesterol: 45, vitamin_a: 240, vitamin_c: 0.5, vitamin_d: 0.8, calcium: 120, iron: 1.8, potassium: 95, tags: ['Vegetarian'], allergens: ['Wheat', 'Egg', 'Milk'], day: 'Monday' },
  { id: 2, station: "Main - Comfort", name: 'Red Beans & Sausage', description: 'Slow-simmered red beans with savory sausage, served over steamed rice.', ingredients: 'Red Kidney Beans, Andouille Sausage, Onions, Celery, Bell Peppers, Rice, Cajun Spices.', calories: 420, protein: 24, carbs: 52, fat: 14, saturated_fat: 5, unsaturated_fat: 9, sodium: 620, fiber: 12, sugar: 2, cholesterol: 35, vitamin_a: 450, vitamin_c: 28, vitamin_d: 0.4, calcium: 85, iron: 4.2, potassium: 820, tags: ['High Fiber', 'Dairy Free', 'Fit'], allergens: ['Soy'], day: 'Tuesday' },
  { id: 201, station: "Main - Comfort", name: 'Lasagna Al Forno', description: 'Classic baked lasagna with rich meat sauce and cheese.', ingredients: 'Ground Beef, Pork, Lasagna Noodles, Ricotta Cheese, Mozzarella, Parmesan, Marinara Sauce, Garlic, Herbs.', calories: 580, protein: 32, carbs: 45, fat: 28, saturated_fat: 14, unsaturated_fat: 14, sodium: 980, fiber: 3, sugar: 8, cholesterol: 95, vitamin_a: 520, vitamin_c: 12, vitamin_d: 1.5, calcium: 380, iron: 3.5, potassium: 485, tags: [], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Tuesday' },
  { id: 3, station: "Main - Comfort", name: 'Vegetable Lasagna', description: 'Layers of pasta, ricotta, spinach, and marinara sauce baked to perfection.', ingredients: 'Lasagna Noodles, Spinach, Zucchini, Ricotta Cheese, Mozzarella, Marinara Sauce.', calories: 380, protein: 18, carbs: 42, fat: 16, saturated_fat: 9, unsaturated_fat: 7, sodium: 780, fiber: 6, sugar: 8, cholesterol: 45, vitamin_a: 680, vitamin_c: 22, vitamin_d: 1.2, calcium: 420, iron: 3.2, potassium: 620, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat', 'Egg', 'Soy'], day: 'Wednesday' },
  { id: 301, station: "Main - Comfort", name: 'Collard Greens', description: 'Slow-cooked southern style collard greens.', ingredients: 'Collard Greens, Vegetable Broth, Onions, Garlic, Vinegar, Red Pepper Flakes.', calories: 120, protein: 4, carbs: 12, fat: 6, saturated_fat: 1, unsaturated_fat: 5, sodium: 450, fiber: 5, sugar: 2, cholesterol: 0, vitamin_a: 720, vitamin_c: 35, vitamin_d: 0, calcium: 180, iron: 2.1, potassium: 385, tags: ['High Fiber', 'Dairy Free', 'Avoid Gluten', 'Fit'], allergens: [], day: 'Wednesday' },
  { id: 4, station: "Main - Comfort", name: 'Chicken & Broccoli Alfredo', description: 'Tender chicken and broccoli tossed in a rich, creamy alfredo sauce.', ingredients: 'Grilled Chicken, Broccoli Florets, Heavy Cream, Parmesan Cheese, Butter, Garlic, Fettuccine Pasta.', calories: 580, protein: 38, carbs: 42, fat: 28, saturated_fat: 16, unsaturated_fat: 12, sodium: 890, fiber: 3, sugar: 4, cholesterol: 125, vitamin_a: 420, vitamin_c: 48, vitamin_d: 1.8, calcium: 340, iron: 2.8, potassium: 480, tags: ['High Protein'], allergens: ['Milk', 'Wheat'], day: 'Thursday' },
  { id: 5, station: "Main - Comfort", name: 'Fried Breaded Okra', description: 'Crispy southern-style okra served as a premium side.', ingredients: 'Okra, Cornmeal, Flour, Buttermilk, Spices, Canola Oil.', calories: 210, protein: 4, carbs: 22, fat: 12, saturated_fat: 2, unsaturated_fat: 10, sodium: 310, fiber: 3, sugar: 2, cholesterol: 8, vitamin_a: 380, vitamin_c: 18, vitamin_d: 0.2, calcium: 95, iron: 1.5, potassium: 285, tags: ['Vegetarian'], allergens: ['Wheat'], day: 'Thursday' },
  { id: 401, station: "Pizza", name: 'Prosciutto Arugula Pizza', description: 'Thin crust pizza topped with salty prosciutto and fresh arugula.', ingredients: 'Pizza Dough, Prosciutto, Arugula, Mozzarella Cheese, Olive Oil, Balsamic Glaze.', calories: 350, protein: 16, carbs: 38, fat: 14, saturated_fat: 6, unsaturated_fat: 8, sodium: 750, fiber: 2, sugar: 2, cholesterol: 38, vitamin_a: 280, vitamin_c: 8, vitamin_d: 0.6, calcium: 220, iron: 2.2, potassium: 240, tags: [], allergens: ['Wheat', 'Milk'], day: 'Thursday' },
  { id: 6, station: "Main - Comfort", name: 'Shrimp, Sausage & Jambalaya', description: 'A classic Mardi Gras stew with andouille sausage, shrimp, and clams.', ingredients: 'Shrimp, Andouille Sausage, Clams, Rice, Tomato Sauce, Cajun Seasoning, Bell Peppers, Onions.', calories: 480, protein: 32, carbs: 45, fat: 18, saturated_fat: 6, unsaturated_fat: 12, sodium: 980, fiber: 3, sugar: 4, cholesterol: 185, vitamin_a: 420, vitamin_c: 38, vitamin_d: 2.8, calcium: 180, iron: 5.2, potassium: 680, tags: ['High Protein', 'Spicy', 'Dairy Free', 'Avoid Gluten', 'Fit'], allergens: ['Shellfish', 'Soy'], day: 'Friday' },
  { id: 601, station: "Main - Comfort", name: 'Cheese Tortellini', description: 'Cheese filled tortellini served with marinara sauce.', ingredients: 'Cheese Tortellini (Wheat, Egg, Milk), Marinara Sauce, Parmesan Cheese, Basil.', calories: 320, protein: 12, carbs: 48, fat: 8, saturated_fat: 4, unsaturated_fat: 4, sodium: 450, fiber: 3, sugar: 6, cholesterol: 42, vitamin_a: 280, vitamin_c: 15, vitamin_d: 0.8, calcium: 240, iron: 2.4, potassium: 320, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Friday' },
  { id: 7, station: "Soup", name: 'Broccoli Cheddar Soup', description: 'Creamy soup with tender broccoli florets and sharp cheddar cheese.', ingredients: 'Broccoli, Cheddar Cheese, Milk, Cream, Chicken Broth, Onions, Carrots.', calories: 220, protein: 5, carbs: 14, fat: 17, saturated_fat: 11, unsaturated_fat: 6, sodium: 730, fiber: 2, sugar: 5, cholesterol: 52, vitamin_a: 480, vitamin_c: 48, vitamin_d: 1.2, calcium: 280, iron: 1.2, potassium: 340, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat'], day: 'Daily Special' },
  { id: 8, station: "Dessert", name: 'Coconut Key Lime Cookie', description: 'Sweet cookie with zesty lime and coconut.', ingredients: 'Flour, Sugar, Butter, Coconut, Lime Zest, Eggs, Baking Soda.', calories: 180, protein: 2, carbs: 24, fat: 9, saturated_fat: 6, unsaturated_fat: 3, sodium: 120, fiber: 1, sugar: 14, cholesterol: 28, vitamin_a: 120, vitamin_c: 4, vitamin_d: 0.4, calcium: 28, iron: 0.8, potassium: 65, tags: ['Vegetarian'], allergens: ['Wheat', 'Milk', 'Egg', 'Coconut'], day: 'Daily Special' }
];

function Badge({ children }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-200 text-green-900 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-rose-100 text-rose-800 border-rose-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
  };
  let color = colors.blue;
  const text = typeof children === 'string' ? children : '';
  if (text.includes('Vegan')) color = colors.green;
  if (text.includes('Vegetarian') && !text.includes('Vegan')) color = colors.yellow;
  if (text.includes('Protein')) color = colors.purple;
  if (text.includes('Fiber')) color = colors.teal;
  if (text.includes('Spicy')) color = colors.red;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${color}`}>{children}</span>;
}

function VegProgramIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  if (error) return <Leaf className={`${className} text-teal-600`} />;
  return <img src={url || VEG_URL} alt="Vegetarian" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function VeganProgramIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  if (error) return <CheckCircle className={`${className} text-teal-800`} />;
  return <img src={url || VEGAN_URL} alt="Vegan" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function FitIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  if (error) return <Zap className={`${className} text-blue-600`} />;
  return <img src={url || FIT_URL} alt="Fit" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function MenuItemCard({ item, addToPlate, customVegUrl, customVeganUrl }) {
  const [showDetails, setShowDetails] = useState(false);
  const isRecommended = item.matchesGoal;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 font-sans hover:shadow-md ${
      isRecommended ? 'border-green-400 ring-2 ring-green-100 dark:ring-green-900' : 'border-gray-100 dark:border-slate-700'
    }`}>
      {isRecommended && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 justify-center">
          <Heart className="w-3 h-3" /> Matches Your Goals
        </div>
      )}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400 px-2 py-0.5 rounded-full">{item.station}</span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><Calendar className="w-3 h-3"/> {item.day}</div>
        </div>
        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight flex items-center gap-2 mb-2">
          {item.name}
          {item.tags?.includes('Vegan') ? <VeganProgramIcon url={customVeganUrl} className="w-6 h-6" /> :
           item.tags?.includes('Vegetarian') ? <VegProgramIcon url={customVegUrl} className="w-6 h-6" /> : null}
          {item.tags?.includes('Fit') && <FitIcon className="w-6 h-6" />}
        </h4>
        {item.description && item.description.toLowerCase() !== item.name.toLowerCase() ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{item.description}</p>
        ) : (
          <p className="text-gray-400 text-sm leading-relaxed mb-4 italic">No description available</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">{item.tags?.filter(tag => ['High Protein', 'High Fiber', 'Vegan', 'Vegetarian', 'Fit', 'Spicy', 'Dairy Free', 'Low Carb', 'Heart Healthy'].includes(tag)).map(tag => <Badge key={tag}>{tag}</Badge>)}</div>
        <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl mb-4 border border-gray-100/50 dark:border-slate-600">
          <div><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cals</span></div>
          <div><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Prot</span></div>
          <div><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Carb</span></div>
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-2">
        <button onClick={() => setShowDetails(!showDetails)} className="flex-1 py-2 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition">{showDetails ? 'Hide Info' : 'Nutrition Details'}</button>
        <button onClick={() => addToPlate(item)} className="w-10 flex items-center justify-center bg-gray-900 dark:bg-teal-600 text-white rounded-lg transition active:scale-90 hover:bg-black dark:hover:bg-teal-700"><Plus className="w-5 h-5" /></button>
      </div>
      {showDetails && (
        <div className="px-5 pb-5 animate-in slide-in-from-top-2">
          {item.ingredients && (
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Ingredients</span>
              </div>
              <p className="text-sm text-teal-900 dark:text-teal-200 leading-relaxed">{item.ingredients}</p>
            </div>
          )}
          <NutritionDetailView item={item} />
          {item.allergens && item.allergens.filter(a => !['Garlic', 'Gluten', 'Onion'].includes(a)).length > 0 && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-3">
              <div className="text-red-600 dark:text-red-400 font-bold uppercase text-[10px] tracking-widest">
                Contains: {item.allergens.filter(a => !['Garlic', 'Gluten', 'Onion'].includes(a)).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TraySummary({ plate, onClick }) {
  if (plate.length === 0) return null;
  const totals = plate.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
  }), { calories: 0, protein: 0 });

  return (
    <div onClick={onClick}
      className="fixed left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white rounded-full shadow-2xl px-6 py-3 z-[45] flex items-center gap-4 border border-teal-500/30 cursor-pointer font-sans backdrop-blur-sm hover:shadow-teal-500/20 hover:shadow-xl transition-all hover:scale-105 animate-in slide-in-from-bottom-4 duration-500 select-none"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      <div className="flex items-center gap-3">
        <div className="bg-teal-500 p-2.5 rounded-full shadow-lg relative">
          <ShoppingBag className="w-4 h-4 text-white" />
          <span className="absolute -top-1 -right-1 bg-teal-400 text-slate-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{plate.length}</span>
        </div>
        <p className="font-bold text-xs uppercase tracking-wider text-white">My Nutrition Tray</p>
      </div>
      <div className="h-8 w-px bg-teal-500/30"></div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <span className="block font-bold text-base text-teal-400">{totals.calories}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest">Cals</span>
        </div>
        <div className="text-center">
          <span className="block font-bold text-base text-teal-400">{totals.protein}g</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest">Protein</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-teal-400 animate-pulse" />
    </div>
  );
}

function NavBar({ onProfileClick }) {
  const navigate = useNavigate();
  return (
    <nav className="bg-slate-800 text-white shadow-lg sticky top-0 z-50 w-full shrink-0 font-sans font-bold select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="h-16 flex items-center w-full px-4">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/066c08658_SmartMenuIQ100x100.png" alt="SmartMenu IQ Logo" className="w-8 h-8 rounded-full" />
            <h1 className="text-xl font-bold uppercase tracking-widest text-white">SmartMenu IQ</h1>
          </div>
          <div className="hidden md:flex gap-6 items-center text-sm font-bold uppercase tracking-widest">
            <button onClick={() => navigate('/')} className="text-white border-b-2 border-teal-400 pb-1">Menu</button>
            <button onClick={() => navigate('/chat')} className="text-slate-300 opacity-70">AI Assistant</button>
            {onProfileClick && <button onClick={onProfileClick} className="p-2 hover:bg-white/10 rounded-full transition"><User className="w-5 h-5" /></button>}
          </div>
          {onProfileClick && (
            <div className="md:hidden flex items-center gap-2">
              <button onClick={onProfileClick} className="p-2"><User className="w-5 h-5 text-white" /></button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function MenuPage({ menuItems: menuItemsProp, setMenuItems, user, customVegUrl, customVeganUrl }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getCurrentDay = () => {
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (day === 'Saturday' || day === 'Sunday') ? 'Monday' : day;
  };

  const { data: menuItems = [], isLoading, refetch } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.list();
      if (items.length === 0) {
        await base44.entities.MenuItem.bulkCreate(DEFAULT_MENU);
        return DEFAULT_MENU;
      }
      return items;
    },
    initialData: menuItemsProp || DEFAULT_MENU,
  });

  const [myPlate, setMyPlate] = useState([]);
  const [isTrayModalOpen, setIsTrayModalOpen] = useState(false);
  const [isWeeklyPlannerOpen, setIsWeeklyPlannerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [activeFilters, setActiveFilters] = useState({ vegetarian: false, vegan: false, fit: false });
  const dayScrollRef = useRef(null);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(null);
  const mainRef = useRef(null);
  const PULL_THRESHOLD = 72;

  const handleTouchStart = (e) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && mainRef.current && mainRef.current.scrollTop === 0) {
      setIsPulling(true);
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD + 20));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);
      await refetch();
      setIsRefreshing(false);
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
    touchStartY.current = null;
  };

  const scrollToDay = (day) => {
    if (dayScrollRef.current) {
      const container = dayScrollRef.current;
      const activeButton = container.querySelector(`[data-day="${day}"]`);
      if (activeButton) {
        const containerWidth = container.offsetWidth;
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        container.scrollTo({ left: buttonLeft - (containerWidth / 2) + (buttonWidth / 2), behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToDay(selectedDay), 150);
    return () => clearTimeout(timer);
  }, [selectedDay]);

  useEffect(() => {
    const timer = setTimeout(() => scrollToDay(selectedDay), 300);
    return () => clearTimeout(timer);
  }, []);

  const addToPlate = (item) => setMyPlate(prev => [...prev, item]);

  const toggleFilter = (filter) => setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  const clearFilters = () => setActiveFilters({ vegetarian: false, vegan: false, fit: false });

  const checkItemSuitability = (item) => {
    if (!user) return { suitable: true, reasons: [] };
    const reasons = [];
    let suitable = true;
    const userRestrictions = user.dietary_restrictions || [];
    const itemAllergens = item.allergens || [];
    const hasRestricted = userRestrictions.some(r => itemAllergens.some(a => a.toLowerCase().includes(r.toLowerCase())));
    if (hasRestricted) { suitable = false; reasons.push('Contains allergen you avoid'); }
    const userPreferences = user.dietary_preferences || [];
    if (userPreferences.includes('Vegan') && !item.tags?.includes('Vegan')) { suitable = false; reasons.push('Not vegan'); }
    if (userPreferences.includes('Vegetarian') && !item.tags?.includes('Vegetarian') && !item.tags?.includes('Vegan')) { suitable = false; reasons.push('Not vegetarian'); }
    const userGoals = user.health_goals || [];
    const matchesGoal = userGoals.some(goal => (item.tags || []).includes(goal));
    return { suitable, reasons, matchesGoal };
  };

  const filteredItems = menuItems.filter(item => {
    const itemDay = item.day?.split('(')[0].trim() || item.day;
    const matchesDay = selectedDay === 'All Days' || itemDay === selectedDay || itemDay === 'Daily Special';
    if (!matchesDay) return false;
    if (activeFilters.vegetarian && !item.tags?.includes('Vegetarian') && !item.tags?.includes('Vegan')) return false;
    if (activeFilters.vegan && !item.tags?.includes('Vegan')) return false;
    if (activeFilters.fit) {
      const isFit = (item.calories || 0) <= 250 && (item.saturated_fat || 0) <= 3 && (item.sugar || 0) <= 20 && (item.sodium || 0) <= 230;
      if (!isFit) return false;
    }
    const { suitable } = checkItemSuitability(item);
    if (!suitable) return false;
    return true;
  }).map(item => {
    const autoTags = (item.tags || []).filter(t => t !== 'Fit');
    if (item.protein >= 25 && !autoTags.includes('High Protein')) autoTags.push('High Protein');
    if (item.fiber >= 8 && !autoTags.includes('High Fiber')) autoTags.push('High Fiber');
    if ((item.name?.toLowerCase().includes('spicy') || item.description?.toLowerCase().includes('cajun') || item.name?.toLowerCase().includes('cajun')) && !autoTags.includes('Spicy')) autoTags.push('Spicy');
    const isFit = (item.calories || 0) <= 250 && (item.saturated_fat || 0) <= 3 && (item.sugar || 0) <= 20 && (item.sodium || 0) <= 230;
    if (isFit && !autoTags.includes('Fit')) autoTags.push('Fit');
    const suitability = checkItemSuitability({ ...item, tags: autoTags });
    return { ...item, tags: autoTags, ...suitability };
  }).sort((a, b) => {
    const mealOrder = { 'Breakfast': 0, 'Lunch': 1, 'Dinner': 2, 'All Day': 3 };
    return (mealOrder[a.meal_period || 'Lunch'] ?? 1) - (mealOrder[b.meal_period || 'Lunch'] ?? 1);
  });

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 font-sans font-bold" style={{ overscrollBehaviorY: 'none' }}>
      <NavBar />
    <div
      ref={mainRef}
      className="max-w-5xl mx-auto p-4 space-y-8 pb-36 md:pb-32 overflow-x-hidden overflow-y-auto"
      style={{ overscrollBehaviorY: 'none', minHeight: 'calc(100vh - 4rem)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{ height: isPulling || isRefreshing ? `${isRefreshing ? 48 : pullDistance}px` : '0px' }}
      >
        <div className="flex flex-col items-center gap-1">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          ) : (
            <RefreshCw className={`w-6 h-6 text-teal-500 transition-transform ${pullDistance >= PULL_THRESHOLD ? 'rotate-180' : ''}`} />
          )}
          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">
            {isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      <div className="text-center space-y-6 pt-10">
        <div className="flex justify-center">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/5f703ba08_SmartMenuIQ38x10.png" alt="SmartMenu IQ" className="max-w-md w-full px-4" />
        </div>
        <div className="flex flex-col gap-4 items-center max-w-xl mx-auto px-2">
          <button onClick={() => setIsWeeklyPlannerOpen(true)} className="w-full bg-slate-900 dark:bg-slate-700 text-white p-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 border border-slate-800 dark:border-slate-600 uppercase tracking-widest text-xs active:scale-95 transition-all">
            <Wand className="w-5 h-5 text-teal-400" /> Plan My Whole Week Meal
          </button>
          <div onClick={() => navigate('/chat')} className="w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 rounded-2xl p-5 text-white shadow-2xl cursor-pointer transform transition-all hover:scale-[1.01] flex items-center justify-between text-left border border-white/10 group overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest text-white">Ask AI Assistant</h3>
                <p className="text-white/80 text-[11px] font-medium italic opacity-80">Nutrition Guide & Choices</p>
              </div>
            </div>
            <div className="bg-white/20 p-2 rounded-full border border-white/10 text-white transition-transform group-hover:translate-x-1 shadow-inner">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div ref={dayScrollRef} className="flex w-full overflow-x-auto py-4 px-2 snap-x gap-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {DAYS.map(d => (
            <button key={d} data-day={d} onClick={() => setSelectedDay(d)} className={`whitespace-nowrap px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all snap-start shadow-sm border ${selectedDay === d ? 'bg-slate-800 dark:bg-teal-600 text-white border-slate-900 shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-400'}`}>{d}</button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => toggleFilter('vegetarian')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${activeFilters.vegetarian ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'}`}><VegProgramIcon url={customVegUrl} className="w-4 h-4" /> Veg</button>
          <button onClick={() => toggleFilter('vegan')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${activeFilters.vegan ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'}`}><VeganProgramIcon url={customVeganUrl} className="w-4 h-4" /> Vegan</button>
          <button onClick={() => toggleFilter('fit')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${activeFilters.fit ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'}`}><FitIcon className="w-4 h-4" /> Fit</button>
          {Object.values(activeFilters).some(Boolean) && <button onClick={clearFilters} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><XCircle className="w-5 h-5" /></button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {filteredItems.length > 0 ? filteredItems.map(item => (
          <MenuItemCard key={item.id} item={item} addToPlate={addToPlate} customVegUrl={customVegUrl} customVeganUrl={customVeganUrl} />
        )) : (
          <div className="col-span-full py-20 text-center space-y-3">
            <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No menu items match your filters</div>
            <button onClick={() => { setSelectedDay('All Days'); clearFilters(); }} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700">Show All Items</button>
          </div>
        )}
      </div>

      <TraySummary plate={myPlate} onClick={() => setIsTrayModalOpen(true)} />

      <TrayDetailsModal isOpen={isTrayModalOpen} onClose={() => setIsTrayModalOpen(false)} plate={myPlate} setPlate={setMyPlate} />
      <WeeklyPlannerModal isOpen={isWeeklyPlannerOpen} onClose={() => setIsWeeklyPlannerOpen(false)} menuItems={menuItems} addToPlate={addToPlate} user={user} />
    </div>
    </div>
  );
}