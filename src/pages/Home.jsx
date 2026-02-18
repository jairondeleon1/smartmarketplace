import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MessageSquare, Plus, Trash2, Utensils, Leaf, Zap,
  ArrowRight, Loader2, Menu as MenuIcon, X, Send, Calendar,
  ShoppingBag, XCircle, Upload, FileText, CheckCircle, RefreshCw,
  Lock, Wand, Settings, Sparkles, Heart, Download, AlertTriangle,
  Info, User, ChevronLeft, ChevronDown
} from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose
} from "@/components/ui/drawer";
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NutritionCharts from "../components/NutritionCharts";
import ProfileSettingsModal from "../components/ProfileSettingsModal";
import NutritionDetailView from "../components/NutritionDetailView";
import BulkEditModal from "../components/admin/BulkEditModal";
import MenuItemsTable from "../components/admin/MenuItemsTable";
import AllergenNoticeModal from "../components/AllergenNoticeModal";
import usePullToRefresh from "../components/usePullToRefresh";
import jsPDF from 'jspdf';

// --- SLIDE TRANSITION VARIANTS ---
const ROUTE_ORDER = ['/menu', '/chat', '/admin'];

const slideVariants = {
  enterFromRight: { x: '100%', opacity: 0 },
  enterFromLeft:  { x: '-30%', opacity: 0 },
  center:         { x: 0, opacity: 1 },
  exitToRight:    { x: '100%', opacity: 0 },
  exitToLeft:     { x: '-30%', opacity: 0 },
};

function getDirection(from, to) {
  const fi = ROUTE_ORDER.findIndex(r => from.startsWith(r));
  const ti = ROUTE_ORDER.findIndex(r => to.startsWith(r));
  if (fi === -1 || ti === -1) return 1;
  return ti >= fi ? 1 : -1;
}

// --- PULL TO REFRESH INDICATOR ---
function PullToRefreshIndicator({ pullDistance, isPulling, isRefreshing, threshold = 72 }) {
  if (!isPulling && !isRefreshing) return null;
  return (
    <div className="flex items-center justify-center transition-all duration-200 overflow-hidden"
      style={{ height: isRefreshing ? 48 : pullDistance }}>
      <div className="flex flex-col items-center gap-1">
        {isRefreshing
          ? <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          : <RefreshCw className={`w-6 h-6 text-teal-500 transition-transform ${pullDistance >= threshold ? 'rotate-180' : ''}`} />}
        <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">
          {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
}

// --- CONSTANTS ---
const VEGAN_URL = "https://i.postimg.cc/MH7cDSz4/vegan.png";
const VEG_URL   = "https://i.postimg.cc/hvsDvPDt/vegetarian.png";
const FIT_URL   = "https://i.postimg.cc/KjQkB6SF/fit.png";
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special', 'All Days'];
const SUGGESTIONS = [
  { text: "What is for lunch on Thursday?", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
  { text: "Which items are low in sodium?", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { text: "Show me high protein options", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  { text: "Any shellfish allergens?", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" }
];

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

// --- UI HELPERS ---
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
  if (text.includes('Heart') || text.includes('Sodium') || text.includes('Spicy')) color = colors.red;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${color}`}>{children}</span>;
}

function FormattedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => (part.startsWith('**') && part.endsWith('**'))
        ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>)}
    </span>
  );
}

function VegProgramIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  const src = url || VEG_URL;
  if (error) return <Leaf className={`${className} text-teal-600`} />;
  return <img src={src} alt="Vegetarian" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function VeganProgramIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  const src = url || VEGAN_URL;
  if (error) return <CheckCircle className={`${className} text-teal-800`} />;
  return <img src={src} alt="Vegan" className={`${className} object-contain`} onError={() => setError(true)} />;
}

function FitIcon({ url, className = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  const src = url || FIT_URL;
  if (error) return <Zap className={`${className} text-blue-600`} />;
  return <img src={src} alt="Fit" className={`${className} object-contain`} onError={() => setError(true)} />;
}

// --- MODALS ---
function WeeklyPlannerModal({ isOpen, onClose, menuItems, addToPlate, user }) {
  const [goal, setGoal] = useState('High Protein');
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [changingMeal, setChangingMeal] = useState(null);
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);

  const generatePlan = async () => {
    setIsLoading(true);
    let userContext = '';
    if (user) {
      if (user.dietary_restrictions?.length > 0) userContext += `User avoids: ${user.dietary_restrictions.join(', ')}. `;
      if (user.dietary_preferences?.length > 0) userContext += `User prefers: ${user.dietary_preferences.join(', ')}. `;
      if (user.health_goals?.length > 0) userContext += `User goals: ${user.health_goals.join(', ')}. `;
    }
    const prompt = `Plan 5-day meal menu for goal: "${goal}". ${userContext}For each weekday (Monday-Friday), select BOTH a breakfast item AND a lunch item from the menu. Menu Data: ${JSON.stringify(menuItems.map(i => ({id: i.id, name: i.name, day: i.day, meal_period: i.meal_period, tags: i.tags, allergens: i.allergens})))}. Return ONLY JSON with structure: {"Monday": {"breakfast": ID, "lunch": ID}, ...}`;
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            Monday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Tuesday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Wednesday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Thursday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } },
            Friday: { type: "object", properties: { breakfast: { type: "number" }, lunch: { type: "number" } } }
          }
        }
      });
      if (response) {
        const planData = [];
        Object.entries(response).forEach(([day, meals]) => {
          if (meals.breakfast) { const item = menuItems.find(i => i.id === meals.breakfast); if (item) planData.push({ day, mealType: 'Breakfast', item }); }
          if (meals.lunch) { const item = menuItems.find(i => i.id === meals.lunch); if (item) planData.push({ day, mealType: 'Lunch', item }); }
        });
        setPlan(planData);
      }
    } catch (e) { setPlan(null); } finally { setIsLoading(false); }
  };

  const regenerateMeal = async (dayIndex) => {
    setRegeneratingMeal(dayIndex);
    const currentEntry = plan[dayIndex];
    let userContext = '';
    if (user) {
      if (user.dietary_restrictions?.length > 0) userContext += `User avoids: ${user.dietary_restrictions.join(', ')}. `;
      if (user.dietary_preferences?.length > 0) userContext += `User prefers: ${user.dietary_preferences.join(', ')}. `;
      if (user.health_goals?.length > 0) userContext += `User goals: ${user.health_goals.join(', ')}. `;
    }
    const prompt = `Select a different ${currentEntry.mealType} item for ${currentEntry.day} that matches goal "${goal}". ${userContext}Avoid ID ${currentEntry.item.id}. Menu Data: ${JSON.stringify(menuItems.filter(i => (i.day === currentEntry.day || i.day === 'Daily Special') && (i.meal_period === currentEntry.mealType)).map(i => ({id: i.id, name: i.name, tags: i.tags, allergens: i.allergens})))}. Return ONLY JSON with {"item_id": NUMBER}`;
    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: "object", properties: { item_id: { type: "number" } } } });
      if (response?.item_id) {
        const newItem = menuItems.find(i => i.id === response.item_id);
        if (newItem) { const updatedPlan = [...plan]; updatedPlan[dayIndex] = { ...currentEntry, item: newItem }; setPlan(updatedPlan); }
      }
    } catch (e) { console.error('Failed to regenerate meal', e); } finally { setRegeneratingMeal(null); }
  };

  const clearPlan = () => { setPlan(null); setChangingMeal(null); };
  const selectNewMeal = (dayIndex, newItem) => {
    const updatedPlan = [...plan];
    updatedPlan[dayIndex] = { ...updatedPlan[dayIndex], item: newItem };
    setPlan(updatedPlan);
    setChangingMeal(null);
  };
  const removeMeal = (dayIndex) => setPlan(prev => prev.filter((_, idx) => idx !== dayIndex));

  if (!isOpen) return null;
  const availableMeals = changingMeal !== null ? menuItems.filter(item => item.day === plan[changingMeal].day || item.day === 'Daily Special') : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 font-sans font-bold">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center border-b border-white/5 shrink-0">
          <h3 className="font-bold text-2xl flex items-center gap-2 uppercase tracking-tight text-white"><Wand className="w-6 h-6 text-teal-400" /> AI Strategy</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-8 space-y-6 font-medium font-sans overflow-y-auto flex-1">
          {!plan ? (
            <>
              <div className="grid grid-cols-1 gap-2 font-sans font-bold">
                {['High Protein', 'Balanced Strategy', 'Vegan Meal Prep', 'Vegetarian', 'Avoid Gluten', 'Low Carb Plan', 'Heart Healthy'].map(g => (
                  <button key={g} onClick={() => setGoal(g)} className={`p-4 rounded-xl border-2 text-left transition-all font-sans font-bold ${goal === g ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-gray-100 text-gray-500'}`}>
                    <span className="uppercase text-xs tracking-widest font-sans font-bold">{g}</span>
                  </button>
                ))}
              </div>
              <button onClick={generatePlan} disabled={isLoading} className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Optimize Week'}
              </button>
            </>
          ) : changingMeal !== null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm uppercase text-slate-800">Select {plan[changingMeal].mealType} for {plan[changingMeal].day}</h4>
                <button onClick={() => setChangingMeal(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableMeals.map(item => (
                  <button key={item.id} onClick={() => selectNewMeal(changingMeal, item)} className="w-full p-3 bg-gray-50 hover:bg-teal-50 rounded-xl border border-gray-100 hover:border-teal-200 text-left transition-all">
                    <div className="font-bold text-sm text-slate-800">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.calories} cal • {item.protein}g protein</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm font-sans font-bold">
              {plan.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-teal-700 text-[10px] uppercase font-bold">{entry.day.slice(0,3)}</span>
                      <span className="text-gray-400 text-[10px] uppercase">•</span>
                      <span className="text-gray-600 text-[10px] uppercase font-bold">{entry.mealType}</span>
                    </div>
                    <span className="text-sm truncate block">{entry.item.name}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => regenerateMeal(idx)} disabled={regeneratingMeal === idx} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-100 disabled:opacity-50">
                      {regeneratingMeal === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setChangingMeal(idx)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-100">Pick Different</button>
                    <button onClick={() => removeMeal(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={clearPlan} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold uppercase text-xs rounded-xl hover:bg-gray-200 transition-all tracking-widest">Clear Plan</button>
                <button onClick={() => { plan.forEach(e => addToPlate(e.item)); onClose(); }} className="flex-1 py-3 bg-slate-900 text-white font-bold uppercase text-xs rounded-xl active:scale-95 transition-all tracking-widest">Add All to Tray</button>
              </div>
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
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setFillColor(6, 95, 70);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24); pdf.setFont(undefined, 'bold');
    pdf.text('SmartMenu IQ', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`NUTRITION SUMMARY • ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
    pdf.setTextColor(30, 41, 59);
    let yPos = 55;
    pdf.setFillColor(6, 95, 70);
    pdf.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(11); pdf.setFont(undefined, 'bold');
    pdf.text('MEALS FOR THE WEEK', 25, yPos + 2);
    yPos += 12;
    pdf.setTextColor(30, 41, 59); pdf.setFontSize(11);
    plate.forEach(item => {
      if (yPos > 270) { pdf.addPage(); yPos = 20; }
      pdf.setFont(undefined, 'bold'); pdf.text(item.name, 25, yPos);
      pdf.setFont(undefined, 'normal'); pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
      pdf.text(`Station: ${item.station || 'N/A'}`, 25, yPos + 5);
      pdf.setFontSize(11); pdf.setTextColor(30, 41, 59); pdf.setFont(undefined, 'bold');
      pdf.text(`${item.calories} CAL`, pageWidth - 20, yPos, { align: 'right' });
      pdf.setDrawColor(241, 245, 249); pdf.line(25, yPos + 7, pageWidth - 20, yPos + 7);
      yPos += 15;
    });
    yPos += 10;
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFillColor(249, 250, 251); pdf.rect(20, yPos, pageWidth - 40, 30, 'F');
    pdf.setFontSize(14); pdf.setFont(undefined, 'bold'); pdf.setTextColor(6, 95, 70);
    pdf.text(`${totals.calories}`, 40, yPos + 15);
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184); pdf.text('CALS', 40, yPos + 22);
    pdf.setFontSize(14); pdf.setTextColor(6, 95, 70); pdf.text(`${totals.protein}g`, 80, yPos + 15);
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184); pdf.text('PROTEIN', 80, yPos + 22);
    pdf.setFontSize(14); pdf.setTextColor(6, 95, 70); pdf.text(`${totals.carbs}g`, 130, yPos + 15);
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184); pdf.text('CARBS', 130, yPos + 22);
    pdf.setFontSize(14); pdf.setTextColor(6, 95, 70); pdf.text(`${totals.sodium}mg`, 170, yPos + 15);
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184); pdf.text('SODIUM', 170, yPos + 22);
    pdf.save('Marketplace_Report.pdf');
    setTimeout(() => { setIsExporting(false); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }, 800);
  };

  const removeItem = (index) => setPlate(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans font-medium">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 font-sans font-bold">
          <div className="flex items-center gap-3"><ShoppingBag className="w-6 h-6 text-teal-400" /><h3 className="font-bold text-xl uppercase tracking-tight font-sans text-white">My Nutrition Tray</h3></div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-white" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans font-bold">
          {showSuccess && <div className="bg-teal-50 text-teal-800 p-4 rounded-xl text-xs font-bold border border-teal-100 flex items-center gap-2 animate-in fade-in">Report Exported Successfully!</div>}
          {plate.length === 0 ? <div className="text-center py-12 text-gray-400 font-bold uppercase text-sm tracking-widest">Your tray is empty</div> :
            <>
              <h4 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3">Meals for the Week</h4>
              <div className="space-y-2">
                {plate.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group font-medium">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-800 text-sm truncate uppercase">{item.name}</p>
                      <div className="flex gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>{item.calories} Cal</span><span>{item.protein}g Prot</span>
                        {item.station && <span>• {item.station}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </>
          }
        </div>
        {plate.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4 shrink-0 font-sans font-bold">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><span className="block text-sm font-bold text-slate-800">{totals.calories}</span><span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Cals</span></div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><span className="block text-sm font-bold text-slate-800">{totals.protein}g</span><span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Prot</span></div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><span className="block text-sm font-bold text-slate-800">{totals.carbs}g</span><span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Carbs</span></div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><span className="block text-sm font-bold text-slate-800">{totals.sodium}mg</span><span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Sod</span></div>
            </div>
            <button onClick={handleDownloadReport} disabled={isExporting} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold uppercase text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest">
              {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <><Download className="w-4 h-4 text-teal-100" /> Download Report</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MENU ITEM DETAIL MODAL (router-driven) ---
function MenuItemDetailModal({ menuItems, addToPlate }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Extract id from path /menu/item/:id
  const match = location.pathname.match(/^\/menu\/item\/(.+)$/);
  if (!match) return null;
  const item = menuItems.find(i => String(i.id) === match[1]);
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">{item.station} • {item.day}</p>
            <h3 className="font-bold text-lg uppercase tracking-tight text-white leading-tight">{item.name}</h3>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition"><ChevronLeft className="w-6 h-6 text-white" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {item.description && item.description.toLowerCase() !== item.name.toLowerCase() && (
            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
          )}
          <div className="grid grid-cols-3 gap-3 text-center py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div><span className="block text-lg font-bold text-gray-800">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cals</span></div>
            <div><span className="block text-lg font-bold text-gray-800">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Prot</span></div>
            <div><span className="block text-lg font-bold text-gray-800">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Carb</span></div>
          </div>
          {item.ingredients && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-teal-600" /><span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Ingredients</span></div>
              <p className="text-sm text-teal-900 leading-relaxed">{item.ingredients}</p>
            </div>
          )}
          <NutritionDetailView item={item} />
          {item.allergens && item.allergens.filter(a => !['Garlic', 'Gluten', 'Onion'].includes(a)).length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="text-red-600 font-bold uppercase text-[10px] tracking-widest">
                Contains: {item.allergens.filter(a => !['Garlic', 'Gluten', 'Onion'].includes(a)).join(', ')}
              </div>
            </div>
          )}
        </div>
        <div className="p-5 bg-gray-50 border-t border-gray-100 shrink-0">
          <button onClick={() => { addToPlate(item); navigate(-1); toast.success(`${item.name} added to tray`); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest">
            <Plus className="w-4 h-4" /> Add to Tray
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItemCard({ item, addToPlate, customVegUrl, customVeganUrl }) {
  const navigate = useNavigate();
  const isRecommended = item.matchesGoal;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 font-sans hover:shadow-md font-medium ${isRecommended ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-100'}`}>
      {isRecommended && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 justify-center">
          <Heart className="w-3 h-3" /> Matches Your Goals
        </div>
      )}
      <div className="p-5 flex-1 font-sans font-bold font-medium">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full tracking-tight">{item.station}</span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><Calendar className="w-3 h-3"/> {item.day}</div>
        </div>
        <h4 className="font-bold text-gray-800 text-lg leading-tight flex items-center gap-2 mb-2">
          {item.name}
          {item.tags?.includes('Vegan') ? <VeganProgramIcon url={customVeganUrl} className="w-6 h-6" /> :
           item.tags?.includes('Vegetarian') ? <VegProgramIcon url={customVegUrl} className="w-6 h-6" /> : null}
          {item.tags?.includes('Fit') && <FitIcon className="w-6 h-6" />}
        </h4>
        {item.description && item.description.toLowerCase() !== item.name.toLowerCase() ? (
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 font-medium">{item.description}</p>
        ) : (
          <p className="text-gray-400 text-sm leading-relaxed mb-4 italic font-medium">No description available</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">{item.tags?.filter(tag => ['High Protein', 'High Fiber', 'Vegan', 'Vegetarian', 'Fit', 'Spicy', 'Dairy Free', 'Low Carb', 'Heart Healthy'].includes(tag)).map(tag => <Badge key={tag}>{tag}</Badge>)}</div>
        <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-xl mb-4 border border-gray-100/50 font-bold">
          <div><span className="block text-sm font-bold text-gray-700">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cals</span></div>
          <div><span className="block text-sm font-bold text-gray-700">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Prot</span></div>
          <div><span className="block text-sm font-bold text-gray-700">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Carb</span></div>
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-2 font-sans font-bold">
        <button onClick={() => navigate(`/menu/item/${item.id}`)} className="flex-1 py-2 text-xs font-bold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition">Nutrition Details</button>
        <button onClick={() => { addToPlate(item); toast.success(`${item.name} added to tray`); }} className="w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg transition active:scale-90 hover:bg-black"><Plus className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function TraySummary({ plate, onClick }) {
  if (plate.length === 0) return null;
  const totals = plate.reduce((acc, item) => ({ calories: acc.calories + (item.calories || 0), protein: acc.protein + (item.protein || 0) }), { calories: 0, protein: 0 });
  return (
    <div onClick={onClick} className="fixed left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white rounded-full shadow-2xl px-6 py-3 z-[45] flex items-center gap-4 border border-teal-500/30 cursor-pointer font-sans backdrop-blur-sm hover:shadow-teal-500/20 hover:shadow-xl transition-all hover:scale-105 animate-in slide-in-from-bottom-4 duration-500 select-none"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.5rem)' }}>
      <div className="flex items-center gap-3">
        <div className="bg-teal-500 p-2.5 rounded-full shadow-lg relative">
          <ShoppingBag className="w-4 h-4 text-white" />
          <span className="absolute -top-1 -right-1 bg-teal-400 text-slate-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{plate.length}</span>
        </div>
        <p className="font-bold text-xs uppercase tracking-wider text-white">My Nutrition Tray</p>
      </div>
      <div className="h-8 w-px bg-teal-500/30"></div>
      <div className="flex items-center gap-4">
        <div className="text-center"><span className="block font-bold text-base text-teal-400">{totals.calories}</span><span className="text-[9px] text-slate-400 uppercase tracking-widest">Cals</span></div>
        <div className="text-center"><span className="block font-bold text-base text-teal-400">{totals.protein}g</span><span className="text-[9px] text-slate-400 uppercase tracking-widest">Protein</span></div>
      </div>
      <ArrowRight className="w-4 h-4 text-teal-400 animate-pulse" />
    </div>
  );
}

// --- MOBILE DRAWER SELECT ---
function MobileDrawerSelect({ value, onChange, options, label }) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 bg-white border-gray-100 text-gray-600 transition active:scale-95"
      >
        {current?.label || label}
        <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-8 px-4 space-y-1">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition ${value === opt.value ? 'bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// --- ROUTE VIEWS ---

function CustomerView({ menuItems, queryClient, customVegUrl, customVeganUrl, selectedDay, setSelectedDay, activeFilters, toggleFilter, clearFilters, filteredItems, dayScrollRef, addToPlate, myPlate, setMyPlate, isTrayModalOpen, setIsTrayModalOpen, isWeeklyPlannerOpen, setIsWeeklyPlannerOpen, user }) {
  const navigate = useNavigate();
  const doRefresh = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ['menuItems'] }); }, [queryClient]);
  const { scrollRef, pullDistance, isPulling, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(doRefresh);

  return (
    <div ref={scrollRef} className="max-w-5xl mx-auto p-4 space-y-8 pb-36 md:pb-32 font-sans overflow-x-hidden font-bold overflow-y-auto"
      style={{ overscrollBehaviorY: 'none', minHeight: 'calc(100vh - 4rem)' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <PullToRefreshIndicator pullDistance={pullDistance} isPulling={isPulling} isRefreshing={isRefreshing} />

      <div className="text-center space-y-6 pt-10 font-sans font-bold">
        <div className="flex justify-center">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/5f703ba08_SmartMenuIQ38x10.png" alt="SmartMenu IQ" className="max-w-md w-full px-4" />
        </div>
        <div className="flex flex-col gap-4 items-center max-w-xl mx-auto px-2 font-sans font-bold">
          <button onClick={() => setIsWeeklyPlannerOpen(true)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 border border-slate-800 uppercase tracking-widest text-xs active:scale-95 transition-all">
            <Wand className="w-5 h-5 text-teal-400" /> Plan My Whole Week Meal
          </button>
          <div onClick={() => navigate('/chat')} className="w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 rounded-2xl p-5 text-white shadow-2xl cursor-pointer transform transition-all hover:scale-[1.01] flex items-center justify-between text-left border border-white/10 group overflow-hidden font-bold">
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10"><Sparkles className="w-5 h-5 text-white animate-pulse" /></div>
              <div><h3 className="font-bold text-sm uppercase tracking-widest text-white">Ask AI Assistant</h3><p className="text-white/80 text-[11px] font-medium italic opacity-80">Nutrition Guide & Choices</p></div>
            </div>
            <div className="bg-white/20 p-2 rounded-full border border-white/10 text-white transition-transform group-hover:translate-x-1 shadow-inner"><ArrowRight className="w-5 h-5" /></div>
          </div>
        </div>

        {/* Mobile: drawer day picker. Desktop: scrollable pill row */}
        <div className="md:hidden flex justify-center px-2 py-2">
          <MobileDrawerSelect
            value={selectedDay}
            onChange={setSelectedDay}
            label="Day"
            options={DAYS.map(d => ({ value: d, label: d }))}
          />
        </div>
        <div ref={dayScrollRef} className="hidden md:flex w-full overflow-x-auto py-4 px-2 snap-x gap-2 scroll-smooth font-sans font-bold [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {DAYS.map(d => (
            <button key={d} data-day={d} onClick={() => setSelectedDay(d)} className={`whitespace-nowrap px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all snap-start shadow-sm border ${selectedDay === d ? 'bg-slate-800 text-white border-slate-900 shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400'}`}>{d}</button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 font-sans font-bold">
          <button onClick={() => toggleFilter('vegetarian')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${activeFilters.vegetarian ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-gray-100 text-gray-400'}`}><VegProgramIcon url={customVegUrl} className="w-4 h-4" /> Veg</button>
          <button onClick={() => toggleFilter('vegan')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${activeFilters.vegan ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-gray-100 text-gray-400'}`}><VeganProgramIcon url={customVeganUrl} className="w-4 h-4" /> Vegan</button>
          <button onClick={() => toggleFilter('fit')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 ${activeFilters.fit ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-white border-gray-100 text-gray-400'}`}><FitIcon className="w-4 h-4" /> Fit</button>
          {Object.values(activeFilters).some(Boolean) && <button onClick={clearFilters} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><XCircle className="w-5 h-5" /></button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 font-sans font-bold font-medium">
        {filteredItems.length > 0 ? filteredItems.map(item => (
          <MenuItemCard key={item.id} item={item} addToPlate={addToPlate} customVegUrl={customVegUrl} customVeganUrl={customVeganUrl} />
        )) : (
          <div className="col-span-full py-20 text-center space-y-3">
            <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No menu items match your filters</div>
            <div className="text-xs text-gray-400">Total Items: {menuItems.length} | Selected Day: {selectedDay}</div>
            <button onClick={() => { setSelectedDay('All Days'); clearFilters(); }} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700">Show All Items</button>
          </div>
        )}
      </div>

      <TraySummary plate={myPlate} onClick={() => setIsTrayModalOpen(true)} />
      <TrayDetailsModal isOpen={isTrayModalOpen} onClose={() => setIsTrayModalOpen(false)} plate={myPlate} setPlate={setMyPlate} />
      <WeeklyPlannerModal isOpen={isWeeklyPlannerOpen} onClose={() => setIsWeeklyPlannerOpen(false)} menuItems={menuItems} addToPlate={addToPlate} user={user} />
    </div>
  );
}

function NavBar({ isMobileMenuOpen, setIsMobileMenuOpen, onProfileClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeClass = 'text-white border-b-2 border-teal-400 pb-1';
  const inactiveClass = 'text-slate-300 opacity-70 hover:opacity-100 transition';

  return (
    <nav className="bg-slate-800 dark:bg-slate-900 text-white shadow-lg sticky top-0 z-50 w-full shrink-0 font-sans font-bold select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="h-16 flex items-center w-full px-4">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/menu')}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/066c08658_SmartMenuIQ100x100.png" alt="SmartMenu IQ Logo" className="w-8 h-8 rounded-full" />
            <h1 className="text-xl font-bold uppercase tracking-widest text-white">SmartMenu IQ</h1>
          </div>
          <div className="hidden md:flex gap-6 items-center text-sm font-bold uppercase tracking-widest">
            <NavLink to="/menu" className={({ isActive }) => isActive ? activeClass : inactiveClass}>Menu</NavLink>
            <NavLink to="/chat" className={({ isActive }) => isActive ? activeClass : inactiveClass}>AI Assistant</NavLink>
            <a href="https://www.eurest-usa.com/our-impact/food-with-purpose/30-day-challenge/" target="_blank" rel="noopener noreferrer" className={inactiveClass}>30 Day Challenge</a>
            <NavLink to="/admin" className={({ isActive }) => isActive ? activeClass : inactiveClass}>Admin</NavLink>
            <button onClick={onProfileClick} className="p-2 hover:bg-white/10 rounded-full transition" title="My Profile"><User className="w-5 h-5" /></button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={onProfileClick} className="p-2" title="My Profile"><User className="w-5 h-5 text-white" /></button>
            <button className="p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X className="text-white" /> : <MenuIcon className="text-white" />}</button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="fixed left-0 right-0 bg-slate-800 dark:bg-slate-900 border-t border-slate-700 shadow-xl md:hidden z-[110] flex flex-col p-4 gap-4 font-bold uppercase text-sm tracking-widest font-sans text-white"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <NavLink to="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-left font-bold">Daily Menu</NavLink>
          <NavLink to="/chat" onClick={() => setIsMobileMenuOpen(false)} className="text-left font-bold">AI Assistant</NavLink>
          <a href="https://www.eurest-usa.com/our-impact/food-with-purpose/30-day-challenge/" target="_blank" rel="noopener noreferrer" className="text-left font-bold">30 Day Challenge</a>
          <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-left font-bold">Admin</NavLink>
        </div>
      )}
    </nav>
  );
}

function MobileBottomNav({ onProfileClick }) {
  const location = useLocation();
  const tabs = [
    { path: '/menu', label: 'Menu', icon: Utensils },
    { path: '/chat', label: 'AI Assistant', icon: MessageSquare },
    { path: null, label: 'Settings', icon: Settings },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 z-50 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = path ? location.pathname.startsWith(path) : false;
          return (
            <NavLink
              key={label}
              to={path || '#'}
              onClick={e => { if (!path) { e.preventDefault(); onProfileClick(); } }}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function ChatView({ chatHistory, isTyping, userQuery, setUserQuery, handleSendChat }) {
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isTyping]);

  const VisualMessage = ({ content }) => {
    const lines = content.split('\n').filter(l => l.trim());
    const menuItemPattern = /^[\d\*\-•]?\s*\*?\*?([A-Z][^(]+?)\*?\*?\s*[-–:]?\s*(\d+)\s*cal/i;
    const parsedItems = [];
    let currentItem = null;
    lines.forEach(line => {
      const match = line.match(menuItemPattern);
      if (match) {
        if (currentItem) parsedItems.push(currentItem);
        currentItem = { name: match[1].trim(), calories: parseInt(match[2]), protein: null, carbs: null, description: '' };
      } else if (currentItem) {
        const proteinMatch = line.match(/(\d+)g?\s*prot/i);
        const carbsMatch = line.match(/(\d+)g?\s*carb/i);
        if (proteinMatch) currentItem.protein = parseInt(proteinMatch[1]);
        if (carbsMatch) currentItem.carbs = parseInt(carbsMatch[1]);
        if (!proteinMatch && !carbsMatch && line.trim()) currentItem.description += (currentItem.description ? ' ' : '') + line.trim();
      }
    });
    if (currentItem) parsedItems.push(currentItem);

    if (parsedItems.length > 0) {
      return (
        <div className="space-y-3">
          {parsedItems.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <h4 className="font-bold text-gray-800 text-base leading-tight mb-3">{item.name}</h4>
                {item.description && <p className="text-gray-500 text-sm leading-relaxed mb-3">{item.description}</p>}
                <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-xl border border-gray-100/50">
                  <div><span className="block text-sm font-bold text-gray-700">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cals</span></div>
                  {item.protein && <div><span className="block text-sm font-bold text-gray-700">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Prot</span></div>}
                  {item.carbs && <div><span className="block text-sm font-bold text-gray-700">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Carb</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {lines.map((line, i) => {
          if (line.startsWith('**') || line.includes('**')) return <div key={i} className="font-bold text-slate-800 text-base mb-2"><FormattedText text={line} /></div>;
          if (line.startsWith('-') || line.startsWith('•')) return (
            <div key={i} className="flex items-start gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
              <span className="text-slate-700 text-sm">{line.replace(/^[-•]\s*/, '')}</span>
            </div>
          );
          return <p key={i} className="text-slate-700 text-sm leading-relaxed">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-50 dark:bg-slate-950 z-40 font-sans"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))', overscrollBehaviorY: 'none' }}>
      <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ overscrollBehaviorY: 'none' }}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm font-medium ${msg.role === 'user' ? 'bg-teal-800 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
              {msg.role === 'user' ? <p className="text-sm leading-relaxed">{msg.content}</p> : <VisualMessage content={msg.content} />}
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
        {isTyping && (
          <div className="flex items-center gap-3 ml-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-bold text-gray-600">Smart Menu IQ...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-20" />
      </div>
      <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 p-4 flex gap-3 shrink-0"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom) + 4rem)' }}>
        <input type="text" value={userQuery} onChange={e => setUserQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} className="flex-1 p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm tracking-tight" placeholder="Ask about nutrition, allergens, menu items..."/>
        <button onClick={() => handleSendChat()} className="bg-teal-800 text-white p-4 rounded-xl shadow-lg active:scale-90 transition-all hover:bg-teal-900"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function AdminView({ menuItems, setMenuItems, onLogout, customVegUrl, setCustomVegUrl, customVeganUrl, setCustomVeganUrl, newItem, setNewItem, handleAddItem, handleDeleteItem, queryClient }) {
  const [activeTab, setActiveTab] = useState('upload');
  const doRefresh = useCallback(async () => { if (queryClient) await queryClient.invalidateQueries({ queryKey: ['menuItems'] }); }, [queryClient]);
  const { scrollRef, pullDistance, isPulling, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(doRefresh);
  const [isSyncing, setIsSyncing] = useState(null);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, allergen: null, ingredients: null });
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditItems, setBulkEditItems] = useState([]);

  const uploadFile = async (file, retries = 3) => {
    if (!file) throw new Error('No file provided');
    if (file.size > 5 * 1024 * 1024) throw new Error(`File too large (max 5MB). Your file is ${Math.round(file.size / 1024 / 1024)}MB.`);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        if (!result?.file_url) throw new Error('Upload failed - no URL returned');
        return result.file_url;
      } catch (error) {
        if (attempt === retries) throw new Error(`Upload failed after ${retries} attempts: ${error?.message || 'Network error'}.`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });

  const handleBulkEdit = (selectedItems) => { setBulkEditItems(selectedItems); setShowBulkEdit(true); };

  const applyBulkEdit = async (editData) => {
    const updatedItems = menuItems.map(item => {
      if (!bulkEditItems.find(i => i.id === item.id)) return item;
      let updated = { ...item };
      if (editData.tags.length > 0) updated.tags = [...new Set([...(updated.tags || []), ...editData.tags])];
      if (editData.addCalories !== 0) updated.calories = (updated.calories || 0) + editData.addCalories;
      if (editData.multiplyCalories !== 1) updated.calories = Math.round((updated.calories || 0) * editData.multiplyCalories);
      if (editData.descriptionPrefix) updated.description = editData.descriptionPrefix + ' ' + (updated.description || '');
      if (editData.descriptionSuffix) updated.description = (updated.description || '') + ' ' + editData.descriptionSuffix;
      return updated;
    });
    await setMenuItems(updatedItems);
    setShowBulkEdit(false);
    setBulkEditItems([]);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Day', 'Station', 'Description', 'Calories', 'Protein', 'Carbs', 'Fat', 'Sodium', 'Tags', 'Allergens'];
    const rows = menuItems.map(item => [item.name||'', item.day||'', item.station||'', item.description||'', item.calories||0, item.protein||0, item.carbs||0, item.fat||0, item.sodium||0, (item.tags||[]).join('; '), (item.allergens||[]).join('; ')]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWeekMenuUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("week-menu");
    try { const fileUrl = await uploadFile(file); setUploadedFiles(prev => ({ ...prev, weekMenu: fileUrl })); toast.success('Week Menu uploaded'); }
    catch (error) { toast.error('Week Menu upload failed: ' + (error?.message || 'Network error')); }
    finally { setIsSyncing(null); }
  };

  const handleFDAUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("fda");
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('File too large (max 10MB). Your file is ' + Math.round(file.size / 1024 / 1024) + 'MB');
      const fileUrl = await uploadFile(file);
      setUploadedFiles(prev => ({ ...prev, fda: { url: fileUrl, type: file.name.match(/\.(xlsx?|pdf)$/i)?.[1] || 'pdf' } }));
      toast.success('FDA Nutrition file uploaded');
    } catch (error) { toast.error('FDA upload failed: ' + (error?.message || 'Network error')); }
    finally { setIsSyncing(null); e.target.value = ''; }
  };

  const handleAllergenUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("allergen");
    try { const fileUrl = await uploadFile(file); setUploadedFiles(prev => ({ ...prev, allergen: fileUrl })); toast.success('Allergen file uploaded'); }
    catch (error) { toast.error('Allergen upload failed: ' + (error?.message || 'Network error')); }
    finally { setIsSyncing(null); }
  };

  const handleIngredientsUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("ingredients");
    try {
      const text = await readFileAsText(file);
      if (!text || text.length === 0) throw new Error('File is empty');
      setUploadedFiles(prev => ({ ...prev, ingredients: text }));
      toast.success('Ingredients CSV uploaded');
    } catch (error) { toast.error('Ingredients upload failed: ' + (error?.message || 'Cannot read file')); }
    finally { setIsSyncing(null); }
  };

  const handleProcessAndPublish = async () => {
    if (!uploadedFiles.weekMenu && !uploadedFiles.fda && !uploadedFiles.allergen && !uploadedFiles.ingredients) {
      toast.error('Please upload at least one file to process'); return;
    }
    setIsSyncing("publish"); setProcessingProgress(0);
    let finalItems = [];
    try {
      if (uploadedFiles.weekMenu) {
        setProcessingStep('Step 1: Week Menu...'); setProcessingProgress(20);
        const weekResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract ALL menu items from this document. For each item extract: name, recipe_number (the number in parentheses), station name, day (Monday/Tuesday/Wednesday/Thursday/Friday/Daily Special), and any description if available. Return as JSON array.`,
          file_urls: [uploadedFiles.weekMenu],
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, station: { type: "string" }, day: { type: "string" }, description: { type: "string" } } } } } }
        });
        if (weekResult?.items) finalItems = weekResult.items.map((item, idx) => ({ ...item, id: Date.now() + idx }));
      } else {
        finalItems = menuItems.map(item => ({ ...item }));
      }
      setProcessingProgress(35);

      if (uploadedFiles.fda) {
        setProcessingStep('Step 2: FDA Data...'); setProcessingProgress(40);
        try {
          const fdaResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Extract: name, recipe_number, calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, cholesterol, vitamin_a, vitamin_c, vitamin_d, calcium, iron, potassium. JSON.`,
            file_urls: [uploadedFiles.fda.url],
            response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, recipe_number: { type: "string" }, calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, saturated_fat: { type: "number" }, sodium: { type: "number" }, fiber: { type: "number" }, sugar: { type: "number" }, cholesterol: { type: "number" }, vitamin_a: { type: "number" }, vitamin_c: { type: "number" }, vitamin_d: { type: "number" }, calcium: { type: "number" }, iron: { type: "number" }, potassium: { type: "number" } } } } } }
          });
          if (fdaResult?.items) {
            const normalizeRecipe = (num) => String(num).trim().replace(/^0+/, '').toLowerCase();
            finalItems = finalItems.map(item => {
              const match = fdaResult.items.find(fda => normalizeRecipe(fda.recipe_number || '') === normalizeRecipe(item.recipe_number || ''));
              if (match) {
                const saturatedFat = match.saturated_fat || 0; const totalFat = match.fat || 0;
                return { ...item, calories: match.calories||0, protein: match.protein||0, carbs: match.carbs||0, fat: totalFat, saturated_fat: saturatedFat, unsaturated_fat: totalFat > saturatedFat ? totalFat - saturatedFat : 0, sodium: match.sodium||0, fiber: match.fiber||0, sugar: match.sugar||0, cholesterol: match.cholesterol||0, vitamin_a: match.vitamin_a||0, vitamin_c: match.vitamin_c||0, vitamin_d: match.vitamin_d||0, calcium: match.calcium||0, iron: match.iron||0, potassium: match.potassium||0 };
              }
              return item;
            });
          }
        } catch (error) { toast.error('FDA processing failed: ' + error.message); }
      }
      setProcessingProgress(60);

      const itemsNeedingDescriptions = finalItems.filter(item => !item.description || item.description.length < 15);
      if (itemsNeedingDescriptions.length > 0) {
        setProcessingStep('Generating Menu Descriptions...'); setProcessingProgress(50);
        try {
          const descResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate brief, appetizing 1-sentence descriptions (15-25 words each) for these menu items. Return as JSON.\n\nItems:\n${itemsNeedingDescriptions.map(i => `- ${i.name}`).join('\n')}`,
            response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } } } } } }
          });
          if (descResult?.items) {
            finalItems = finalItems.map(item => {
              if (!item.description || item.description.length < 15) {
                const match = descResult.items.find(d => { const dName = d.name.toLowerCase().trim(); const iName = item.name.toLowerCase().trim(); return dName.includes(iName) || iName.includes(dName) || dName.slice(0,15) === iName.slice(0,15); });
                if (match?.description) return { ...item, description: match.description };
              }
              return item;
            });
          }
        } catch (error) { console.error('Description generation failed:', error); }
      }
      setProcessingProgress(65);

      if (uploadedFiles.allergen) {
        const allergenResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract allergen information from this PDF. For each menu item, extract: recipe_number, allergens (array), and dietary tags (array like Vegetarian, Vegan, Fit, Dairy Free, etc.). Return as structured JSON.`,
          file_urls: [uploadedFiles.allergen],
          add_context_from_internet: false,
          response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { recipe_number: { type: "string" }, allergens: { type: "array", items: { type: "string" } }, tags: { type: "array", items: { type: "string" } } } } } } }
        });
        if (allergenResult?.items) {
          const normalizeRecipe = (num) => String(num).trim().replace(/^0+/, '').toLowerCase();
          finalItems = finalItems.map(item => {
            const match = allergenResult.items.find(al => normalizeRecipe(al.recipe_number || '') === normalizeRecipe(item.recipe_number || ''));
            if (match) return { ...item, allergens: match.allergens, tags: match.tags };
            return item;
          });
        }
      }

      if (uploadedFiles.ingredients) {
        setProcessingStep('Processing Ingredients CSV...');
        try {
          const csvChunk = uploadedFiles.ingredients.slice(0, 8000);
          const ingredientsResult = await base44.integrations.Core.InvokeLLM({
            prompt: `You are parsing a CSV file with menu ingredients. Extract ALL rows. For each row extract: recipe_number, ingredients, is_vegan, is_vegetarian, is_fit. Return ALL rows as JSON.\n\nCSV Data:\n${csvChunk}`,
            add_context_from_internet: false,
            response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { recipe_number: { type: "string" }, ingredients: { type: "string" }, is_vegan: { type: "boolean" }, is_vegetarian: { type: "boolean" }, is_fit: { type: "boolean" } } } } } }
          });
          if (ingredientsResult?.items?.length > 0) {
            const normalizeRecipe = (num) => String(num).trim().replace(/^0+/, '');
            finalItems = finalItems.map(item => {
              const itemRecipe = normalizeRecipe(item.recipe_number || '');
              const match = ingredientsResult.items.find(ing => normalizeRecipe(ing.recipe_number || '') === itemRecipe);
              if (match && match.ingredients && match.ingredients.length > 5) {
                const csvTags = []; if (match.is_vegan) csvTags.push('Vegan'); if (match.is_vegetarian) csvTags.push('Vegetarian'); if (match.is_fit) csvTags.push('Fit');
                return { ...item, ingredients: match.ingredients.trim(), tags: [...new Set([...(item.tags || []), ...csvTags])] };
              }
              return item;
            });
          }
        } catch (error) { toast.error('Warning: Ingredients processing failed - ' + error.message); }
      }

      finalItems = finalItems.map(item => {
        if ((item.name?.toLowerCase().includes('fried') || item.description?.toLowerCase().includes('fried')) && item.tags?.includes('Vegan')) {
          return { ...item, tags: item.tags.filter(tag => tag !== 'Vegan') };
        }
        return item;
      });

      const itemsNeedingIngredients = finalItems.filter(item => !item.ingredients || item.ingredients.length < 5);
      if (itemsNeedingIngredients.length > 0) {
        setProcessingStep('Generating Missing Ingredients...'); setProcessingProgress(90);
        try {
          const ingredientsResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate realistic ingredient lists for these menu items. Return as JSON.\n\nItems:\n${itemsNeedingIngredients.map(i => `- ${i.name}`).join('\n')}`,
            response_json_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ingredients: { type: "string" } } } } } }
          });
          if (ingredientsResult?.items) {
            finalItems = finalItems.map(item => {
              if (!item.ingredients || item.ingredients.length < 5) {
                const match = ingredientsResult.items.find(i => { const iName = i.name.toLowerCase().trim(); const itemName = item.name.toLowerCase().trim(); return iName.includes(itemName) || itemName.includes(iName) || iName.slice(0,15) === itemName.slice(0,15); });
                if (match?.ingredients) return { ...item, ingredients: match.ingredients };
              }
              return item;
            });
          }
        } catch (error) { console.error('Ingredient generation failed:', error); }
      }

      setProcessingStep('Publishing Menu...'); setProcessingProgress(100);
      setMenuItems(finalItems);
      setUploadedFiles({ weekMenu: null, fda: null, allergen: null, ingredients: null });
      setTimeout(() => { toast.success(`Published ${finalItems.length} menu items!`); setProcessingStep(''); setProcessingProgress(0); }, 500);
    } catch (error) {
      toast.error(`Error: ${error?.message || 'Unknown error'}`);
    } finally { setProcessingStep(''); setProcessingProgress(0); setIsSyncing(null); }
  };

  const syncOptions = [
    { label: "1. Week Menu PDF", type: "week-menu", icon: Calendar, accept: ".pdf", handler: handleWeekMenuUpload, desc: "Menu items with recipe #s" },
    { label: "2. FDA Nutrition File", type: "fda", icon: Sparkles, accept: ".pdf,.xlsx,.xls", handler: handleFDAUpload, desc: "Match by recipe #" },
    { label: "3. Allergen PDF", type: "allergen", icon: AlertTriangle, accept: ".pdf", handler: handleAllergenUpload, desc: "Match by recipe #" },
    { label: "4. Ingredients CSV", type: "ingredients", icon: FileText, accept: ".csv", handler: handleIngredientsUpload, desc: "Match by recipe #" }
  ];

  return (
    <div ref={scrollRef} className="max-w-6xl mx-auto p-6 space-y-8 pb-32 font-sans overflow-x-hidden font-medium"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ overscrollBehaviorY: 'none' }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isPulling={isPulling} isRefreshing={isRefreshing} />
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm font-sans font-bold">
        <div><h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Admin Hub</h2><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 text-teal-800">Manage Menu & Data</p></div>
        <button onClick={onLogout} className="text-red-500 font-bold hover:bg-red-50 px-6 py-3 rounded-xl transition border border-red-100 uppercase text-[10px] tracking-widest">Logout</button>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-100">
        <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm uppercase transition ${activeTab === 'upload' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Upload Files</button>
        <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm uppercase transition ${activeTab === 'manage' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Manage Items ({menuItems.length})</button>
      </div>

      {activeTab === 'upload' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><Upload className="w-4 h-4 text-teal-600"/> Matrix Sync</h3>
              <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">{menuItems.length} Items Loaded</span>
            </div>
            <div className="space-y-3">
              {syncOptions.map(opt => (
                <div key={opt.type}>
                  <input type="file" accept={opt.accept} id={`file-upload-${opt.type}`} className="hidden" onChange={opt.handler} />
                  <label htmlFor={`file-upload-${opt.type}`} className="w-full p-5 border-2 border-dashed border-teal-100 rounded-2xl flex items-center gap-4 text-teal-800 hover:bg-teal-50 transition active:scale-[0.98] cursor-pointer">
                    {isSyncing === opt.type ? <Loader2 className="animate-spin w-6 h-6" /> : (
                      <><div className="bg-teal-50 p-3 rounded-xl border border-teal-100"><opt.icon className="w-5 h-5 text-teal-600"/></div>
                      <div className="flex-1 text-left"><div className="text-xs font-bold uppercase tracking-widest text-slate-800">{opt.label}</div><div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div></div></>
                    )}
                  </label>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
              <div className="font-bold mb-2 flex items-center gap-2"><Info className="w-4 h-4" />Files Uploaded</div>
              <div className="space-y-1 text-blue-700 mb-3">
                {[['weekMenu', 'Week Menu'], ['fda', 'FDA Nutrition'], ['allergen', 'Allergen Data'], ['ingredients', 'Ingredients']].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    {uploadedFiles[key] ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              {isSyncing === "publish" ? (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"><div className="bg-teal-600 h-full transition-all duration-500 rounded-full" style={{ width: `${processingProgress}%` }} /></div>
                  <div className="flex items-center justify-center gap-2 text-xs text-teal-700"><Loader2 className="w-3 h-3 animate-spin" /><span className="font-bold">{processingStep}</span></div>
                </div>
              ) : (
                <button onClick={handleProcessAndPublish} disabled={!uploadedFiles.weekMenu && !uploadedFiles.fda && !uploadedFiles.allergen && !uploadedFiles.ingredients} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Process & Publish Menu
                </button>
              )}
            </div>
            <button onClick={() => console.log('Current Menu Data:', menuItems)} className="w-full p-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition">Debug: Log Menu to Console</button>
          </div>
          <div className="space-y-8 font-medium">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><Plus className="w-4 h-4 text-teal-600"/> Manual Entry</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <input type="text" placeholder="Dish Name" className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                <textarea placeholder="Ingredients List (e.g. Flour, Sugar, Milk...)" className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none resize-none h-24" value={newItem.ingredients || ''} onChange={e => setNewItem({...newItem, ingredients: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none cursor-pointer" value={newItem.day} onChange={e => setNewItem({...newItem, day: e.target.value})}>
                    {DAYS.filter(d => d !== 'All Days').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="number" placeholder="Cals" className="p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none" value={newItem.calories} onChange={e => setNewItem({...newItem, calories: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold uppercase text-xs hover:bg-black transition-all shadow-xl active:scale-95 tracking-widest">Publish Dish</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <MenuItemsTable items={menuItems} onDelete={handleDeleteItem} onBulkEdit={handleBulkEdit} onExport={exportToCSV} />
        </div>
      )}

      <BulkEditModal isOpen={showBulkEdit} onClose={() => setShowBulkEdit(false)} selectedItems={bulkEditItems} onSave={applyBulkEdit} />
    </div>
  );
}

// --- MAIN APP ---
export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(location.pathname);
  const directionRef = useRef(1);

  // Track direction for slide transitions
  useEffect(() => {
    directionRef.current = getDirection(prevPathRef.current, location.pathname);
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Redirect / or /Home → /menu
  useEffect(() => {
    const p = location.pathname;
    if (p === '/' || p === '/Home' || p === '/home' || !ROUTE_ORDER.some(r => p.startsWith(r))) {
      navigate('/menu', { replace: true });
    }
  }, [location.pathname]);

  // Dark mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const getCurrentDay = () => {
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (day === 'Saturday' || day === 'Sunday') ? 'Monday' : day;
  };

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { try { return await base44.auth.me(); } catch { return null; } }
  });
  const queryClient = useQueryClient();

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.list();
      if (items.length === 0) { await base44.entities.MenuItem.bulkCreate(DEFAULT_MENU); return DEFAULT_MENU; }
      return items;
    },
    initialData: DEFAULT_MENU,
  });

  const setMenuItems = async (newItems) => {
    const existing = await base44.entities.MenuItem.list();
    const batchSize = 10;
    for (let i = 0; i < existing.length; i += batchSize) {
      const batch = existing.slice(i, i + batchSize);
      await Promise.all(batch.map(item => base44.entities.MenuItem.delete(item.id)));
      if (i + batchSize < existing.length) await new Promise(resolve => setTimeout(resolve, 500));
    }
    await base44.entities.MenuItem.bulkCreate(newItems);
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
  };

  const [myPlate, setMyPlate] = useState([]);
  const [isTrayModalOpen, setIsTrayModalOpen] = useState(false);
  const [isWeeklyPlannerOpen, setIsWeeklyPlannerOpen] = useState(false);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [customVegUrl, setCustomVegUrl] = useState("");
  const [customVeganUrl, setCustomVeganUrl] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [chatNavFrom, setChatNavFrom] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: "Hello! I am your Marketplace Assistant. How may I assist your choices today?" }]);
  const [userQuery, setUserQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', day: 'Monday', station: "Chef's Table", ingredients: '', calories: '', protein: '', carbs: '', fat: '', isVeg: false, isVegan: false });
  const [activeFilters, setActiveFilters] = useState({ vegetarian: false, vegan: false, fit: false });
  const dayScrollRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

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

  useEffect(() => { const timer = setTimeout(() => scrollToDay(selectedDay), 150); return () => clearTimeout(timer); }, [selectedDay]);
  useEffect(() => { const timer = setTimeout(() => scrollToDay(selectedDay), 300); return () => clearTimeout(timer); }, []);

  const addToPlate = (item) => setMyPlate(prev => [...prev, item]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const tags = [];
    if (newItem.isVeg) tags.push('Vegetarian');
    if (newItem.isVegan) tags.push('Vegan');
    await base44.entities.MenuItem.create({ ...newItem, calories: Number(newItem.calories), protein: Number(newItem.protein), tags });
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    setNewItem({ name: '', day: 'Monday', station: "Chef's Table", ingredients: '', calories: '', protein: '', carbs: '', fat: '', isVeg: false, isVegan: false });
    toast.success('Dish published!');
  };

  const handleDeleteItem = async (id) => {
    await base44.entities.MenuItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    toast.success('Item deleted');
  };

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
    } finally { setIsTyping(false); }
  };

  const toggleFilter = (filter) => setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  const clearFilters = () => setActiveFilters({ vegetarian: false, vegan: false, fit: false });

  const checkItemSuitability = (item) => {
    if (!user) return { suitable: true, reasons: [] };
    const reasons = []; let suitable = true;
    const userRestrictions = user.dietary_restrictions || [];
    const itemAllergens = item.allergens || [];
    const hasRestricted = userRestrictions.some(restriction => itemAllergens.some(allergen => allergen.toLowerCase().includes(restriction.toLowerCase())));
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
    if (activeFilters.fit) { const isFit = (item.calories||0) <= 250 && (item.saturated_fat||0) <= 3 && (item.sugar||0) <= 20 && (item.sodium||0) <= 230; if (!isFit) return false; }
    const { suitable } = checkItemSuitability(item);
    if (!suitable) return false;
    return true;
  }).map(item => {
    const autoTags = (item.tags || []).filter(t => t !== 'Fit');
    if (item.protein >= 25 && !autoTags.includes('High Protein')) autoTags.push('High Protein');
    if (item.fiber >= 8 && !autoTags.includes('High Fiber')) autoTags.push('High Fiber');
    if ((item.name?.toLowerCase().includes('spicy') || item.description?.toLowerCase().includes('spicy') || item.description?.toLowerCase().includes('cajun') || item.name?.toLowerCase().includes('cajun')) && !autoTags.includes('Spicy')) autoTags.push('Spicy');
    const isFit = (item.calories||0) <= 250 && (item.saturated_fat||0) <= 3 && (item.sugar||0) <= 20 && (item.sodium||0) <= 230;
    if (isFit && !autoTags.includes('Fit')) autoTags.push('Fit');
    const suitability = checkItemSuitability({ ...item, tags: autoTags });
    return { ...item, tags: autoTags, ...suitability };
  }).sort((a, b) => {
    const mealOrder = { 'Breakfast': 0, 'Lunch': 1, 'Dinner': 2, 'All Day': 3 };
    return (mealOrder[a.meal_period || 'Lunch'] ?? 1) - (mealOrder[b.meal_period || 'Lunch'] ?? 1);
  });

  const sharedCustomerProps = {
    menuItems, queryClient, customVegUrl, customVeganUrl, selectedDay, setSelectedDay,
    activeFilters, toggleFilter, clearFilters, filteredItems, dayScrollRef, addToPlate,
    myPlate, setMyPlate, isTrayModalOpen, setIsTrayModalOpen,
    isWeeklyPlannerOpen, setIsWeeklyPlannerOpen, user
  };

  const isItemDetail = location.pathname.startsWith('/menu/item/');
  const topRoute = ROUTE_ORDER.find(r => location.pathname.startsWith(r)) || '/menu';
  const direction = directionRef.current;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans tracking-tight overflow-x-hidden selection:bg-teal-100 selection:text-teal-900 font-bold" style={{ overscrollBehaviorY: 'none' }}>
      <AllergenNoticeModal />
      <NavBar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} onProfileClick={() => setIsProfileModalOpen(true)} />

      <main className="w-full font-bold overflow-hidden relative">
        {/* Hidden-mount strategy: all tabs stay mounted, only active one is visible */}
        {/* Framer Motion AnimatePresence fades/slides the active tab in/out */}

        {/* MENU tab */}
        <AnimatePresence mode="wait" initial={false}>
          {topRoute === '/menu' && !isItemDetail && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: directionRef.current > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: directionRef.current > 0 ? -40 : 40 }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
            >
              <CustomerView {...sharedCustomerProps} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHAT tab */}
        <AnimatePresence mode="wait" initial={false}>
          {topRoute === '/chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: directionRef.current > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: directionRef.current > 0 ? -40 : 40 }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
            >
              <ChatView chatHistory={chatHistory} isTyping={isTyping} userQuery={userQuery} setUserQuery={setUserQuery} handleSendChat={handleSendChat} showBack={chatNavFrom === '/menu'} onBack={() => navigate('/menu')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ADMIN tab — only mount after first visit to avoid overhead */}
        {(topRoute === '/admin' || isAdminLoggedIn) && (
          <AnimatePresence mode="wait" initial={false}>
            {topRoute === '/admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: directionRef.current > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: directionRef.current > 0 ? -40 : 40 }}
                transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
              >
                {!isAdminLoggedIn ? (
                  <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 tracking-tight font-sans font-bold">
                    <form onSubmit={(e) => { e.preventDefault(); if (e.target.pw.value === 'admin123') setIsAdminLoggedIn(true); else toast.error('Invalid password'); }} className="bg-white p-14 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-gray-100 text-center space-y-8 animate-in zoom-in-95 font-sans font-medium">
                      <div className="bg-teal-50 p-6 rounded-3xl inline-block border border-teal-100 shadow-inner"><Lock className="w-10 h-10 text-teal-800" /></div>
                      <div className="space-y-1 font-sans font-bold">
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-900 leading-none tracking-widest">Matrix Hub</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3 tracking-[0.2em]">Personnel Authorization Required</p>
                      </div>
                      <input name="pw" type="password" className="w-full p-5 border-none rounded-2xl bg-gray-100 outline-none focus:ring-4 focus:ring-teal-100 font-bold text-center tracking-[0.4em] shadow-inner text-lg" placeholder="••••" />
                      <button className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Verify Access</button>
                    </form>
                  </div>
                ) : (
                  <AdminView menuItems={menuItems} setMenuItems={setMenuItems} onLogout={() => setIsAdminLoggedIn(false)} customVegUrl={customVegUrl} setCustomVegUrl={setCustomVegUrl} customVeganUrl={customVeganUrl} setCustomVeganUrl={setCustomVeganUrl} newItem={newItem} setNewItem={setNewItem} handleAddItem={handleAddItem} handleDeleteItem={handleDeleteItem} queryClient={queryClient} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Fallback redirect for unknown routes */}
        <Routes location={location}>
          <Route path="*" element={null} />
        </Routes>
      </main>

      {/* Item detail modal rendered on top (route-driven, uses navigate(-1) to go back) */}
      <MenuItemDetailModal menuItems={filteredItems.length > 0 ? filteredItems : menuItems} addToPlate={addToPlate} />

      <MobileBottomNav onProfileClick={() => setIsProfileModalOpen(true)} />
      <NutritionCharts isOpen={isChartsOpen} onClose={() => setIsChartsOpen(false)} menuItems={menuItems} />
      <ProfileSettingsModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} />
    </div>
  );
}