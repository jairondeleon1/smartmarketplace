import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  Info,
  User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NutritionCharts from "../components/NutritionCharts";
import ProfileSettingsModal from "../components/ProfileSettingsModal";
import WeeklyPlannerModal from "../components/WeeklyPlannerModal";
import NutritionDetailView from "../components/NutritionDetailView";
import BulkEditModal from "../components/admin/BulkEditModal";
import MenuItemsTable from "../components/admin/MenuItemsTable";
import EditMenuItemModal from "../components/admin/EditMenuItemModal";
import UserManagement from "../components/admin/UserManagement";
import AllergenNoticeModal from "../components/AllergenNoticeModal";
import AITransparencyModal from "../components/AITransparencyModal";
import usePullToRefresh from "../components/usePullToRefresh";
import Footer from "../components/Footer";
import AdminGate from "../components/AdminGate";
import CoreMenusSection from "../components/CoreMenusSection";
import CoreMenusSync from "../components/admin/CoreMenusSync";
import { AccessibilityProvider, useA11y } from "@/lib/AccessibilityContext";
import jsPDF from 'jspdf';

function LargeTextWrapper({ children }) {
  const { largeText } = useA11y();
  return (
    <div style={{ fontSize: largeText ? '120%' : '100%' }}
      className="min-h-screen bg-stone-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans tracking-tight overflow-x-hidden selection:bg-teal-100 selection:text-teal-900 font-bold">
      {children}
    </div>
  );
}

// Framer Motion slide variants for iOS-style push/pop
const slideVariants = {
  enterFromRight: { x: '100%', opacity: 0 },
  enterFromLeft:  { x: '-30%', opacity: 0 },
  center:         { x: 0, opacity: 1 },
  exitToRight:    { x: '100%', opacity: 0 },
  exitToLeft:     { x: '-30%', opacity: 0 },
};
const VIEW_ORDER = ['customer', 'chat', 'admin'];

function PullToRefreshIndicator({ pullDistance, isPulling, isRefreshing, threshold = 72 }) {
  const { t } = useA11y();
  if (!isPulling && !isRefreshing) return null;
  return (
    <div className="flex items-center justify-center transition-all duration-200 overflow-hidden"
      style={{ height: isRefreshing ? 48 : pullDistance }}
      role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-1">
        {isRefreshing
          ? <Loader2 className="w-6 h-6 text-teal-500 animate-spin" aria-hidden="true" />
          : <RefreshCw className={`w-6 h-6 text-teal-500 transition-transform ${pullDistance >= threshold ? 'rotate-180' : ''}`} aria-hidden="true" />}
        <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">
          {isRefreshing ? t.refreshing : pullDistance >= threshold ? t.releaseRefresh : t.pullRefresh}
        </span>
      </div>
    </div>
  );
}

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
  { id: 1, station: "Main - Comfort", name: 'Chicken Parmesan', description: 'Breaded chicken breast topped with marinara and melted mozzarella.', ingredients: 'Chicken Breast, Breadcrumbs, Marinara Sauce, Mozzarella Cheese, Parmesan Cheese, Egg, Flour, Spices.', calories: 650, protein: 45, carbs: 35, fat: 32, saturated_fat: 12, unsaturated_fat: 20, sodium: 1150, fiber: 4, sugar: 6, cholesterol: 145, vitamin_a: 380, vitamin_c: 8, vitamin_d: 1.2, calcium: 420, iron: 3.8, potassium: 520, tags: ['High Protein'], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Monday' },
  { id: 101, station: "Main - Comfort", name: 'Corn Muffin', description: 'Sweet and savory corn muffin.', ingredients: 'Cornmeal, Flour, Sugar, Milk, Egg, Butter, Baking Powder.', calories: 280, protein: 4, carbs: 38, fat: 12, saturated_fat: 7, unsaturated_fat: 5, sodium: 320, fiber: 2, sugar: 14, cholesterol: 45, vitamin_a: 240, vitamin_c: 0.5, vitamin_d: 0.8, calcium: 120, iron: 1.8, potassium: 95, tags: ['Vegetarian'], allergens: ['Wheat', 'Egg', 'Milk'], day: 'Monday' },

  // TUESDAY (Feb 17)
  { id: 2, station: "Main - Comfort", name: 'Red Beans & Sausage', description: 'Slow-simmered red beans with savory sausage, served over steamed rice.', ingredients: 'Red Kidney Beans, Andouille Sausage, Onions, Celery, Bell Peppers, Rice, Cajun Spices.', calories: 420, protein: 24, carbs: 52, fat: 14, saturated_fat: 5, unsaturated_fat: 9, sodium: 620, fiber: 12, sugar: 2, cholesterol: 35, vitamin_a: 450, vitamin_c: 28, vitamin_d: 0.4, calcium: 85, iron: 4.2, potassium: 820, tags: ['High Fiber', 'Dairy Free', 'Fit'], allergens: ['Soy'], day: 'Tuesday' },
  { id: 201, station: "Main - Comfort", name: 'Lasagna Al Forno', description: 'Classic baked lasagna with rich meat sauce and cheese.', ingredients: 'Ground Beef, Pork, Lasagna Noodles, Ricotta Cheese, Mozzarella, Parmesan, Marinara Sauce, Garlic, Herbs.', calories: 580, protein: 32, carbs: 45, fat: 28, saturated_fat: 14, unsaturated_fat: 14, sodium: 980, fiber: 3, sugar: 8, cholesterol: 95, vitamin_a: 520, vitamin_c: 12, vitamin_d: 1.5, calcium: 380, iron: 3.5, potassium: 485, tags: [], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Tuesday' },

  // WEDNESDAY (Feb 18)
  { id: 3, station: "Main - Comfort", name: 'Vegetable Lasagna', description: 'Layers of pasta, ricotta, spinach, and marinara sauce baked to perfection.', ingredients: 'Lasagna Noodles, Spinach, Zucchini, Ricotta Cheese, Mozzarella, Marinara Sauce.', calories: 380, protein: 18, carbs: 42, fat: 16, saturated_fat: 9, unsaturated_fat: 7, sodium: 780, fiber: 6, sugar: 8, cholesterol: 45, vitamin_a: 680, vitamin_c: 22, vitamin_d: 1.2, calcium: 420, iron: 3.2, potassium: 620, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat', 'Egg', 'Soy'], day: 'Wednesday' },
  { id: 301, station: "Main - Comfort", name: 'Collard Greens', description: 'Slow-cooked southern style collard greens.', ingredients: 'Collard Greens, Vegetable Broth, Onions, Garlic, Vinegar, Red Pepper Flakes.', calories: 120, protein: 4, carbs: 12, fat: 6, saturated_fat: 1, unsaturated_fat: 5, sodium: 450, fiber: 5, sugar: 2, cholesterol: 0, vitamin_a: 720, vitamin_c: 35, vitamin_d: 0, calcium: 180, iron: 2.1, potassium: 385, tags: ['High Fiber', 'Dairy Free', 'Avoid Gluten', 'Fit'], allergens: [], day: 'Wednesday' },

  // THURSDAY (Feb 19)
  { id: 4, station: "Main - Comfort", name: 'Chicken & Broccoli Alfredo', description: 'Tender chicken and broccoli tossed in a rich, creamy alfredo sauce.', ingredients: 'Grilled Chicken, Broccoli Florets, Heavy Cream, Parmesan Cheese, Butter, Garlic, Fettuccine Pasta.', calories: 580, protein: 38, carbs: 42, fat: 28, saturated_fat: 16, unsaturated_fat: 12, sodium: 890, fiber: 3, sugar: 4, cholesterol: 125, vitamin_a: 420, vitamin_c: 48, vitamin_d: 1.8, calcium: 340, iron: 2.8, potassium: 480, tags: ['High Protein'], allergens: ['Milk', 'Wheat'], day: 'Thursday' },
  { id: 5, station: "Main - Comfort", name: 'Fried Breaded Okra', description: 'Crispy southern-style okra served as a premium side.', ingredients: 'Okra, Cornmeal, Flour, Buttermilk, Spices, Canola Oil.', calories: 210, protein: 4, carbs: 22, fat: 12, saturated_fat: 2, unsaturated_fat: 10, sodium: 310, fiber: 3, sugar: 2, cholesterol: 8, vitamin_a: 380, vitamin_c: 18, vitamin_d: 0.2, calcium: 95, iron: 1.5, potassium: 285, tags: ['Vegetarian'], allergens: ['Wheat'], day: 'Thursday' },
  { id: 401, station: "Pizza", name: 'Prosciutto Arugula Pizza', description: 'Thin crust pizza topped with salty prosciutto and fresh arugula.', ingredients: 'Pizza Dough, Prosciutto, Arugula, Mozzarella Cheese, Olive Oil, Balsamic Glaze.', calories: 350, protein: 16, carbs: 38, fat: 14, saturated_fat: 6, unsaturated_fat: 8, sodium: 750, fiber: 2, sugar: 2, cholesterol: 38, vitamin_a: 280, vitamin_c: 8, vitamin_d: 0.6, calcium: 220, iron: 2.2, potassium: 240, tags: [], allergens: ['Wheat', 'Milk'], day: 'Thursday' },

  // FRIDAY (Feb 20)
  { id: 6, station: "Main - Comfort", name: 'Shrimp, Sausage & Jambalaya', description: 'A classic Mardi Gras stew with andouille sausage, shrimp, and clams.', ingredients: 'Shrimp, Andouille Sausage, Clams, Rice, Tomato Sauce, Cajun Seasoning, Bell Peppers, Onions.', calories: 480, protein: 32, carbs: 45, fat: 18, saturated_fat: 6, unsaturated_fat: 12, sodium: 980, fiber: 3, sugar: 4, cholesterol: 185, vitamin_a: 420, vitamin_c: 38, vitamin_d: 2.8, calcium: 180, iron: 5.2, potassium: 680, tags: ['High Protein', 'Spicy', 'Dairy Free', 'Avoid Gluten', 'Fit'], allergens: ['Shellfish', 'Soy'], day: 'Friday' },
  { id: 601, station: "Main - Comfort", name: 'Cheese Tortellini', description: 'Cheese filled tortellini served with marinara sauce.', ingredients: 'Cheese Tortellini (Wheat, Egg, Milk), Marinara Sauce, Parmesan Cheese, Basil.', calories: 320, protein: 12, carbs: 48, fat: 8, saturated_fat: 4, unsaturated_fat: 4, sodium: 450, fiber: 3, sugar: 6, cholesterol: 42, vitamin_a: 280, vitamin_c: 15, vitamin_d: 0.8, calcium: 240, iron: 2.4, potassium: 320, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat', 'Egg'], day: 'Friday' },

  // DAILY SPECIALS
  { id: 7, station: "Soup", name: 'Broccoli Cheddar Soup', description: 'Creamy soup with tender broccoli florets and sharp cheddar cheese.', ingredients: 'Broccoli, Cheddar Cheese, Milk, Cream, Chicken Broth, Onions, Carrots.', calories: 220, protein: 5, carbs: 14, fat: 17, saturated_fat: 11, unsaturated_fat: 6, sodium: 730, fiber: 2, sugar: 5, cholesterol: 52, vitamin_a: 480, vitamin_c: 48, vitamin_d: 1.2, calcium: 280, iron: 1.2, potassium: 340, tags: ['Vegetarian'], allergens: ['Milk', 'Wheat'], day: 'Daily Special' },
  { id: 8, station: "Dessert", name: 'Coconut Key Lime Cookie', description: 'Sweet cookie with zesty lime and coconut.', ingredients: 'Flour, Sugar, Butter, Coconut, Lime Zest, Eggs, Baking Soda.', calories: 180, protein: 2, carbs: 24, fat: 9, saturated_fat: 6, unsaturated_fat: 3, sodium: 120, fiber: 1, sugar: 14, cholesterol: 28, vitamin_a: 120, vitamin_c: 4, vitamin_d: 0.4, calcium: 28, iron: 0.8, potassium: 65, tags: ['Vegetarian'], allergens: ['Wheat', 'Milk', 'Egg', 'Coconut'], day: 'Daily Special' }
];

// --- UI HELPERS ---

function Badge({ children }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-200 text-green-900 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
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
      {parts.map((part, i) => (part.startsWith('**') && part.endsWith('**')) ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}
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

    // Header
    pdf.setFillColor(6, 95, 70);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('SmartMenu IQ', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`WEEKLY MEAL PLAN • ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

    let yPos = 52;

    // Group plate items by day then by mealType
    const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special'];
    const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Side', 'Dessert', 'All Day'];

    // plate items may or may not have day/mealType — group by day if available
    const grouped = {};
    plate.forEach(item => {
      const day = item._planDay || 'Other';
      const mealType = item._planMealType || item.meal_period || 'Other';
      if (!grouped[day]) grouped[day] = {};
      if (!grouped[day][mealType]) grouped[day][mealType] = [];
      grouped[day][mealType].push(item);
    });

    const sortedDays = Object.keys(grouped).sort((a, b) => {
      const ai = DAYS_ORDER.indexOf(a); const bi = DAYS_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    sortedDays.forEach(day => {
      if (yPos > 260) { pdf.addPage(); yPos = 20; }

      // Day header
      pdf.setFillColor(15, 118, 110);
      pdf.rect(15, yPos, pageWidth - 30, 9, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text(day.toUpperCase(), 20, yPos + 6.5);
      yPos += 14;

      const mealTypes = Object.keys(grouped[day]).sort((a, b) => {
        const ai = MEAL_ORDER.indexOf(a); const bi = MEAL_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      mealTypes.forEach(mealType => {
        if (yPos > 265) { pdf.addPage(); yPos = 20; }

        // Meal type label
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        pdf.text(mealType.toUpperCase(), 20, yPos);
        yPos += 5;

        grouped[day][mealType].forEach(item => {
          if (yPos > 270) { pdf.addPage(); yPos = 20; }

          pdf.setTextColor(30, 41, 59);
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          const nameLines = pdf.splitTextToSize(item.name, pageWidth - 60);
          pdf.text(nameLines, 22, yPos);
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(107, 114, 128);
          pdf.text(`${item.calories || 0} cal  •  ${item.protein || 0}g protein  •  ${item.carbs || 0}g carbs`, 22, yPos + (nameLines.length * 4.5));
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(6, 95, 70);
          pdf.text(`${item.calories || 0}`, pageWidth - 18, yPos, { align: 'right' });
          pdf.setFontSize(7);
          pdf.setTextColor(148, 163, 184);
          pdf.text('CAL', pageWidth - 18, yPos + 4, { align: 'right' });

          pdf.setDrawColor(229, 231, 235);
          yPos += nameLines.length * 4.5 + 8;
          pdf.line(20, yPos - 3, pageWidth - 20, yPos - 3);
        });

        yPos += 4;
      });

      yPos += 6;
    });

    // Totals footer
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    yPos += 4;
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(15, yPos, pageWidth - 30, 28, 'FD');
    const cols = [35, 75, 115, 155];
    const labels = ['TOTAL CALS', 'PROTEIN', 'CARBS', 'SODIUM'];
    const values = [`${totals.calories}`, `${totals.protein}g`, `${totals.carbs}g`, `${totals.sodium}mg`];
    cols.forEach((x, i) => {
      pdf.setFontSize(13); pdf.setFont(undefined, 'bold'); pdf.setTextColor(6, 95, 70);
      pdf.text(values[i], x, yPos + 13);
      pdf.setFontSize(7); pdf.setFont(undefined, 'normal'); pdf.setTextColor(148, 163, 184);
      pdf.text(labels[i], x, yPos + 21);
    });

    pdf.save('SmartMenuIQ_WeeklyPlan.pdf');
    setTimeout(() => { setIsExporting(false); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }, 800);
  };

  const removeItem = (index) => setPlate(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans font-medium">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 font-sans font-bold">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-teal-400" />
            <h3 className="font-bold text-xl uppercase tracking-tight font-sans text-white">My Nutrition Tray</h3>
          </div>
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
                        <span>{item.calories} Cal</span>
                        <span>{item.protein}g Prot</span>
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

function MenuItemCard({ item, addToPlate, customVegUrl, customVeganUrl }) {
  const [showDetails, setShowDetails] = useState(false);
  const isRecommended = item.matchesGoal;
  
  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 font-sans hover:shadow-md font-medium ${
      isRecommended ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-100'
    }`}>
      {isRecommended && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 justify-center">
          <Heart className="w-3 h-3" /> Matches Your Goals
        </div>
      )}
      <div className="p-5 flex-1 font-sans font-bold font-medium">
        <div className="flex justify-between items-start mb-2 font-sans font-bold">
          <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-sans tracking-tight font-bold">{item.station}</span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans font-bold"><Calendar className="w-3 h-3"/> {item.day}</div>
        </div>
        <h4 className="font-bold text-gray-800 text-lg leading-tight flex items-center gap-2 mb-2 font-sans font-bold">
          {item.name}
          {item.tags?.includes('Vegan') ? <VeganProgramIcon url={customVeganUrl} className="w-6 h-6" /> : 
           item.tags?.includes('Vegetarian') ? <VegProgramIcon url={customVegUrl} className="w-6 h-6" /> : null}
          {item.tags?.includes('Fit') && <FitIcon className="w-6 h-6" />}
        </h4>
        {item.description && item.description.toLowerCase() !== item.name.toLowerCase() ? (
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 font-sans font-medium">{item.description}</p>
        ) : (
          <p className="text-gray-400 text-sm leading-relaxed mb-4 italic font-sans font-medium">No description available</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4 font-sans font-bold">{item.tags?.filter(tag => ['High Protein', 'High Fiber', 'Vegan', 'Vegetarian', 'Fit', 'Spicy', 'Dairy Free', 'Low Carb', 'Heart Healthy'].includes(tag)).map(tag => <Badge key={tag}>{tag}</Badge>)}</div>
        <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-xl mb-4 border border-gray-100/50 font-bold">
          <div><span className="block text-sm font-bold text-gray-700 font-sans">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold font-sans tracking-widest">Cals</span></div>
          <div><span className="block text-sm font-bold text-gray-700 font-sans">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold font-sans tracking-widest">Prot</span></div>
          <div><span className="block text-sm font-bold text-gray-700 font-sans">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold font-sans tracking-widest">Carb</span></div>
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-2 font-sans font-bold">
        <button onClick={() => setShowDetails(!showDetails)} className="flex-1 py-2 text-xs font-bold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition font-sans font-bold">{showDetails ? 'Hide Info' : 'Nutrition Details'}</button>
        <button onClick={() => addToPlate(item)} className="w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg transition active:scale-90 hover:bg-black font-sans font-bold"><Plus className="w-5 h-5" /></button>
      </div>
      {showDetails && (
        <div className="px-5 pb-5 animate-in slide-in-from-top-2 font-sans">
          {item.ingredients && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Ingredients</span>
              </div>
              <p className="text-sm text-teal-900 leading-relaxed">{item.ingredients}</p>
            </div>
          )}
          <NutritionDetailView item={item} />
          {item.allergens && item.allergens.filter(a => !['Garlic', 'Gluten', 'Onion'].includes(a)).length > 0 && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="text-red-600 font-bold uppercase text-[10px] tracking-widest">
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
    <div onClick={onClick} className="fixed left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white rounded-full shadow-2xl px-6 py-3 z-[45] flex items-center gap-4 border border-teal-500/30 cursor-pointer font-sans backdrop-blur-sm hover:shadow-teal-500/20 hover:shadow-xl transition-all hover:scale-105 animate-in slide-in-from-bottom-4 duration-500 select-none"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.5rem)' }}>
      <div className="flex items-center gap-3">
        <div className="bg-teal-500 p-2.5 rounded-full shadow-lg relative">
          <ShoppingBag className="w-4 h-4 text-white" />
          <span className="absolute -top-1 -right-1 bg-teal-400 text-slate-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{plate.length}</span>
        </div>
        <div className="text-left">
          <p className="font-bold text-xs uppercase tracking-wider text-white">My Nutrition Tray</p>
        </div>
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

// --- CUSTOMER VIEW (with pull-to-refresh) ---

// Detect meal period from station name since DB has meal_period unreliable
function getMealPeriodFromStation(item) {
  const station = (item.station || '').toLowerCase();
  if (station.startsWith('breakfast')) return 'Breakfast';
  if (station.startsWith('lunch') || station.startsWith('main') || station.startsWith('soup') || station.startsWith('pizza') || station.startsWith('deli') || station.startsWith('grill') || station.startsWith('dessert')) return 'Lunch';
  // fallback to meal_period field
  if (item.meal_period === 'Breakfast') return 'Breakfast';
  return 'Lunch';
}

// Side station keywords (these are sides/extras, not mains)
const SIDE_STATION_KEYWORDS = ['soup', 'dessert', 'bakery', 'fruit', 'salad bar', 'beverage'];
function isSideItem(item) {
  const station = (item.station || '').toLowerCase();
  return SIDE_STATION_KEYWORDS.some(k => station.includes(k));
}

function MealTabsSection({ filteredItems, activeMealTab, setActiveMealTab, addToPlate, customVegUrl, customVeganUrl, selectedDay, setSelectedDay, clearFilters }) {
  const breakfastItems = filteredItems.filter(i => getMealPeriodFromStation(i) === 'Breakfast');
  const lunchItems = filteredItems.filter(i => getMealPeriodFromStation(i) === 'Lunch');

  const tabsWithItems = [];
  if (breakfastItems.length > 0) tabsWithItems.push('Breakfast');
  if (lunchItems.length > 0) tabsWithItems.push('Lunch');

  const effectiveTab = tabsWithItems.includes(activeMealTab) ? activeMealTab : (tabsWithItems[0] || 'Lunch');
  const tabItems = effectiveTab === 'Breakfast' ? breakfastItems : lunchItems;

  const mains = tabItems.filter(i => !isSideItem(i));
  const sides = tabItems.filter(i => isSideItem(i));

  if (tabsWithItems.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No menu items match your filters</div>
        <button onClick={() => { setSelectedDay('All Days'); clearFilters(); }} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700">Show All Items</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2">
      {/* Meal Tabs */}
      {tabsWithItems.length > 1 && (
        <div className="flex gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
          {tabsWithItems.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveMealTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                effectiveTab === tab ? 'bg-slate-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Main Items */}
      {mains.length > 0 && (
        <div className="space-y-3">
          {sides.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                {effectiveTab} Entrees
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mains.map(item => (
              <MenuItemCard key={item.id} item={item} addToPlate={addToPlate} customVegUrl={customVegUrl} customVeganUrl={customVeganUrl} />
            ))}
          </div>
        </div>
      )}

      {/* Sides */}
      {sides.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              {effectiveTab} Sides & Extras
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sides.map(item => (
              <MenuItemCard key={item.id} item={item} addToPlate={addToPlate} customVegUrl={customVegUrl} customVeganUrl={customVeganUrl} />
            ))}
          </div>
        </div>
      )}

      {tabItems.length === 0 && (
        <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
          No {effectiveTab} items for this day
        </div>
      )}
    </div>
  );
}

function CustomerView({ menuItems, queryClient, customVegUrl, customVeganUrl, selectedDay, setSelectedDay, activeFilters, toggleFilter, clearFilters, filteredItems, dayScrollRef, addToPlate, myPlate, setMyPlate, isTrayModalOpen, setIsTrayModalOpen, isWeeklyPlannerOpen, setIsWeeklyPlannerOpen, changeView, user }) {
  const [activeMealTab, setActiveMealTab] = useState('Lunch');
  const { t } = useA11y();

  const doRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['menuItems'] });
  }, [queryClient]);

  const { scrollRef, pullDistance, isPulling, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(doRefresh);

  return (
    <div
      ref={scrollRef}
      className="max-w-5xl mx-auto p-4 space-y-8 pb-36 md:pb-32 font-sans overflow-x-hidden font-bold"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isPulling={isPulling} isRefreshing={isRefreshing} />

      <div className="text-center space-y-6 pt-10 font-sans font-bold">
        <div className="flex justify-center">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/5f703ba08_SmartMenuIQ38x10.png" alt="SmartMenu IQ" className="max-w-md w-full px-4" />
        </div>
        <div className="flex flex-col gap-4 items-center max-w-xl mx-auto px-2 font-sans font-bold">
          <button onClick={() => setIsWeeklyPlannerOpen(true)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 border border-slate-800 uppercase tracking-widest text-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2">
            <Wand className="w-5 h-5 text-teal-400" aria-hidden="true" /> {t.planMyWeek}
          </button>
          <div onClick={() => changeView('chat')} onKeyDown={e => e.key === 'Enter' && changeView('chat')} role="button" tabIndex={0} aria-label={t.askAI} className="w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 rounded-2xl p-5 text-white shadow-2xl cursor-pointer transform transition-all hover:scale-[1.01] flex items-center justify-between text-left border border-white/10 group overflow-hidden font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2">
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10"><Sparkles className="w-5 h-5 text-white animate-pulse" aria-hidden="true" /></div>
              <div><h3 className="font-bold text-sm uppercase tracking-widest text-white">{t.askAI}</h3><p className="text-white/80 text-[11px] font-medium italic opacity-80">{t.nutritionGuide}</p></div>
            </div>
            <div className="bg-white/20 p-2 rounded-full border border-white/10 text-white transition-transform group-hover:translate-x-1 shadow-inner" aria-hidden="true"><ArrowRight className="w-5 h-5" /></div>
          </div>
        </div>

        <CoreMenusSection onAddToPlate={addToPlate} />

        <div ref={dayScrollRef} className="flex w-full overflow-x-auto py-4 px-2 snap-x gap-2 scroll-smooth font-sans font-bold [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {DAYS.map(d => (
            <button key={d} data-day={d} onClick={() => setSelectedDay(d)} className={`whitespace-nowrap px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all snap-start shadow-sm border font-sans font-bold ${selectedDay === d ? 'bg-slate-800 text-white border-slate-900 shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400'}`}>{d}</button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 font-sans font-bold" role="group" aria-label="Dietary filters">
          <button onClick={() => toggleFilter('vegetarian')} aria-pressed={activeFilters.vegetarian} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 ${activeFilters.vegetarian ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-gray-100 text-gray-400'}`}><VegProgramIcon url={customVegUrl} className="w-4 h-4" /> {t.veg}</button>
          <button onClick={() => toggleFilter('vegan')} aria-pressed={activeFilters.vegan} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 ${activeFilters.vegan ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-gray-100 text-gray-400'}`}><VeganProgramIcon url={customVeganUrl} className="w-4 h-4" /> {t.vegan}</button>
          <button onClick={() => toggleFilter('fit')} aria-pressed={activeFilters.fit} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${activeFilters.fit ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-white border-gray-100 text-gray-400'}`}><FitIcon className="w-4 h-4" /> {t.fit}</button>
          {Object.values(activeFilters).some(Boolean) && <button onClick={clearFilters} aria-label="Clear all filters" className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition focus-visible:ring-2 focus-visible:ring-red-400"><XCircle className="w-5 h-5" aria-hidden="true" /></button>}
        </div>
      </div>

      <MealTabsSection
        filteredItems={filteredItems}
        activeMealTab={activeMealTab}
        setActiveMealTab={setActiveMealTab}
        addToPlate={addToPlate}
        customVegUrl={customVegUrl}
        customVeganUrl={customVeganUrl}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        clearFilters={clearFilters}
      />

      {/* Persistent AI Insights Disclaimer */}
      <div className="mx-2 py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl text-center" role="note">
        <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
          {t.disclaimer}
        </p>
      </div>

      <TraySummary plate={myPlate} onClick={() => setIsTrayModalOpen(true)} />
      <TrayDetailsModal isOpen={isTrayModalOpen} onClose={() => setIsTrayModalOpen(false)} plate={myPlate} setPlate={setMyPlate} />
      <WeeklyPlannerModal isOpen={isWeeklyPlannerOpen} onClose={() => setIsWeeklyPlannerOpen(false)} menuItems={menuItems} addToPlate={addToPlate} user={user} />
    </div>
  );
}

// --- CORE VIEWS ---

function NavBar({ view, changeView, isMobileMenuOpen, setIsMobileMenuOpen, onProfileClick }) {
  const { t } = useA11y();
  return (
    <nav className="bg-slate-800 dark:bg-slate-900 text-white shadow-lg sticky top-0 z-50 w-full shrink-0 font-sans font-bold select-none"
      aria-label="Main navigation"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="h-16 flex items-center w-full px-4">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => changeView('customer')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && changeView('customer')} aria-label="Go to home">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698cee888040f55d6a3c5040/066c08658_SmartMenuIQ100x100.png" alt="SmartMenu IQ Logo" className="w-8 h-8 rounded-full" />
            <h1 className="text-xl font-bold uppercase tracking-widest text-white">SmartMenu IQ</h1>
          </div>
          <div className="hidden md:flex gap-6 items-center text-sm font-bold uppercase tracking-widest" role="menubar">
            <button onClick={() => changeView('customer')} aria-current={view === 'customer' ? 'page' : undefined} className={`focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1 ${view === 'customer' ? 'text-white border-b-2 border-teal-400 pb-1' : 'text-slate-300 opacity-70'}`}>{t.menu}</button>
            <button onClick={() => changeView('chat')} aria-current={view === 'chat' ? 'page' : undefined} className={`focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1 ${view === 'chat' ? 'text-white border-b-2 border-teal-400 pb-1' : 'text-slate-300 opacity-70'}`}>{t.aiAssistant}</button>
            <a href="https://www.eurest-usa.com/our-impact/food-with-purpose/30-day-challenge/" target="_blank" rel="noopener noreferrer" className="text-slate-300 opacity-70 hover:text-white hover:opacity-100 transition focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1">30 Day Challenge</a>
            <button onClick={onProfileClick} className="p-2 hover:bg-white/10 rounded-full transition focus-visible:ring-2 focus-visible:ring-teal-400" aria-label="My Profile">
              <User className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={onProfileClick} className="p-2 focus-visible:ring-2 focus-visible:ring-teal-400 rounded" aria-label="My Profile"><User className="w-5 h-5 text-white" aria-hidden="true" /></button>
            <button className="p-2 focus-visible:ring-2 focus-visible:ring-teal-400 rounded" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-expanded={isMobileMenuOpen} aria-label="Toggle navigation menu">{isMobileMenuOpen ? <X className="text-white" aria-hidden="true" /> : <MenuIcon className="text-white" aria-hidden="true" />}</button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 right-0 bg-slate-800 dark:bg-slate-900 border-t border-slate-700 shadow-xl md:hidden z-[110] flex flex-col p-4 gap-4 font-bold uppercase text-sm tracking-widest font-sans text-white"
          role="menu"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button role="menuitem" onClick={() => { changeView('customer'); setIsMobileMenuOpen(false); }} className="text-left font-bold focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1">{t.menu}</button>
          <button role="menuitem" onClick={() => { changeView('chat'); setIsMobileMenuOpen(false); }} className="text-left font-bold focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1">{t.aiAssistant}</button>
          <a role="menuitem" href="https://www.eurest-usa.com/our-impact/food-with-purpose/30-day-challenge/" target="_blank" rel="noopener noreferrer" className="text-left font-bold focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1">30 Day Challenge</a>
        </div>
      )}
    </nav>
  );
}

function MobileBottomNav({ view, changeView, onProfileClick }) {
  const { t } = useA11y();
  const tabs = [
    { id: 'customer', label: t.menu, icon: Utensils },
    { id: 'chat', label: t.aiAssistant, icon: MessageSquare },
    { id: 'settings', label: t.settings, icon: Settings },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 z-50 select-none"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = id === 'settings' ? false : view === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => id === 'settings' ? onProfileClick() : changeView(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset ${
                isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ChatView({ chatHistory, isTyping, userQuery, setUserQuery, handleSendChat }) {
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isTyping]);

  // Strip markdown heading/bold/italic symbols
  const cleanMarkdown = (text) => text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();

  // Is this line a nutrition/tag/detail bullet (should stay inside a card)?
  const isDetailLine = (l) =>
    /calories|protein|carbohydrate|carbs|fat|sodium|fiber|sugar|cholesterol|allergen|tag|station|contain/i.test(l);

  // Is this line a dish name (standalone non-bullet, not intro prose, not a detail)?
  const isDishName = (l) =>
    !l.startsWith('-') && !l.startsWith('•') && !l.startsWith('*') &&
    l.length > 2 && l.length < 100 &&
    !isDetailLine(l) &&
    !l.toLowerCase().match(/^(here are|here is|for lunch|for breakfast|on thursday|on monday|on tuesday|on wednesday|on friday|the following|these are|you can|based on|great|enjoy|i recommend|today|this dish|additionally|note:|please)/i);

  // Parse nutrition fields from a set of bullet lines
  const parseNutritionLines = (bulletLines) => {
    const d = { calories: null, protein: null, carbs: null, fat: null, saturatedFat: null, sodium: null, fiber: null, sugar: null, cholesterol: null, allergens: null, tags: null, station: null };
    bulletLines.forEach(raw => {
      const l = raw.replace(/^[-•*]\s*/, '').trim();
      const num = (re) => { const m = l.match(re); return m ? parseFloat(m[1]) : null; };
      if (d.calories == null) d.calories = num(/calories?\s*:?\s*([\d.]+)/i);
      if (d.protein == null) d.protein = num(/protein\s*:?\s*([\d.]+)/i);
      if (d.carbs == null) d.carbs = num(/carbohydrates?\s*:?\s*([\d.]+)/i) ?? num(/carbs?\s*:?\s*([\d.]+)/i);
      if (d.fat == null) d.fat = num(/^fat\s*:?\s*([\d.]+)/i) ?? num(/total fat\s*:?\s*([\d.]+)/i);
      if (d.saturatedFat == null) d.saturatedFat = num(/saturated fat\s*:?\s*([\d.]+)/i);
      if (d.sodium == null) d.sodium = num(/sodium\s*:?\s*([\d.]+)/i);
      if (d.fiber == null) d.fiber = num(/fiber\s*:?\s*([\d.]+)/i);
      if (d.sugar == null) d.sugar = num(/sugar\s*:?\s*([\d.]+)/i);
      if (d.cholesterol == null) d.cholesterol = num(/cholesterol\s*:?\s*([\d.]+)/i);
      const algM = l.match(/allergens?\s*:?\s*(.+)/i);
      if (algM && !d.allergens) d.allergens = algM[1].trim();
      const tagM = l.match(/tags?\s*:?\s*(.+)/i);
      if (tagM && !d.tags) d.tags = tagM[1].trim();
      const stM = l.match(/station\s*:?\s*(.+)/i);
      if (stM && !d.station) d.station = stM[1].trim();
    });
    return d;
  };

  // Single menu item card (same style as home page)
  const MenuCard = ({ name, nutrition, description }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 space-y-3">
        {/* Name */}
        <h4 className="font-bold text-gray-800 text-base leading-tight uppercase tracking-tight">{name}</h4>
        {description && <p className="text-gray-500 text-xs leading-relaxed">{description}</p>}
        {nutrition.station && <p className="text-[10px] text-teal-700 font-bold uppercase tracking-widest">{nutrition.station}</p>}

        {/* Primary macros */}
        {(nutrition.calories != null || nutrition.protein != null || nutrition.carbs != null) && (
          <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-xl border border-gray-100">
            {nutrition.calories != null && <div><span className="block text-sm font-bold text-gray-800">{nutrition.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cals</span></div>}
            {nutrition.protein != null && <div><span className="block text-sm font-bold text-gray-800">{nutrition.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Protein</span></div>}
            {nutrition.carbs != null && <div><span className="block text-sm font-bold text-gray-800">{nutrition.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Carbs</span></div>}
          </div>
        )}

        {/* Secondary stats */}
        {(nutrition.fat != null || nutrition.sodium != null || nutrition.fiber != null || nutrition.sugar != null || nutrition.cholesterol != null || nutrition.saturatedFat != null) && (
          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
            {nutrition.fat != null && <div><span className="block text-xs font-bold text-slate-700">{nutrition.fat}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Fat</span></div>}
            {nutrition.saturatedFat != null && <div><span className="block text-xs font-bold text-slate-700">{nutrition.saturatedFat}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Sat Fat</span></div>}
            {nutrition.sodium != null && <div><span className="block text-xs font-bold text-slate-700">{nutrition.sodium}mg</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Sodium</span></div>}
            {nutrition.fiber != null && <div><span className="block text-xs font-bold text-slate-700">{nutrition.fiber}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Fiber</span></div>}
            {nutrition.sugar != null && <div><span className="block text-xs font-bold text-slate-700">{nutrition.sugar}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Sugar</span></div>}
            {nutrition.cholesterol != null && <div><span className="block text-xs font-bold text-slate-700">{nutrition.cholesterol}mg</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Chol</span></div>}
          </div>
        )}

        {/* Tags */}
        {nutrition.tags && (
          <div className="flex flex-wrap gap-1">
            {nutrition.tags.split(/[,;]/).map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[9px] font-bold uppercase tracking-widest">{t.trim()}</span>
            ))}
          </div>
        )}

        {/* Allergens */}
        {nutrition.allergens && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Contains: </span>
            <span className="text-[10px] text-red-700">{nutrition.allergens}</span>
          </div>
        )}
      </div>
    </div>
  );

  const VisualMessage = ({ content }) => {
    const cleaned = cleanMarkdown(content);
    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

    // Split content into segments: each dish name starts a new segment
    // Segments: { type: 'prose'|'item', text?, name?, bullets[], description? }
    const segments = [];
    let current = null;

    lines.forEach(line => {
      const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
      if (!isBullet && isDishName(line)) {
        // New dish card
        if (current) segments.push(current);
        current = { type: 'item', name: line, bullets: [], descLines: [] };
      } else if (current?.type === 'item') {
        if (isBullet || isDetailLine(line)) {
          current.bullets.push(line);
        } else {
          // Prose inside an item block → treat as description
          current.descLines.push(line);
        }
      } else {
        // Prose before any dish
        if (current?.type === 'prose') {
          current.text += ' ' + line;
        } else {
          if (current) segments.push(current);
          current = { type: 'prose', text: line };
        }
      }
    });
    if (current) segments.push(current);

    // Check if we have any item cards
    const hasCards = segments.some(s => s.type === 'item' && s.bullets.length > 0);

    if (hasCards) {
      return (
        <div className="space-y-3">
          {segments.map((seg, i) => {
            if (seg.type === 'prose') {
              return <p key={i} className="text-slate-700 text-sm leading-relaxed">{seg.text}</p>;
            }
            const nutrition = parseNutritionLines(seg.bullets);
            const hasData = Object.values(nutrition).some(v => v !== null);
            if (!hasData && seg.bullets.length === 0) {
              return <p key={i} className="text-slate-700 text-sm leading-relaxed">{seg.name}</p>;
            }
            const description = seg.descLines.join(' ') || null;
            return <MenuCard key={i} name={seg.name} nutrition={nutrition} description={description} />;
          })}
        </div>
      );
    }

    // Fallback: plain formatted text
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          if (line.startsWith('-') || line.startsWith('•')) return (
            <div key={i} className="flex items-start gap-2">
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
      <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 p-4 flex gap-3 shrink-0 md:pb-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom) + 4rem)' }}>
        <input type="text" value={userQuery} onChange={e => setUserQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} className="flex-1 p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm tracking-tight" placeholder="Ask about nutrition, allergens, menu items..."/>
        <button onClick={() => handleSendChat()} className="bg-teal-800 text-white p-4 rounded-xl shadow-lg active:scale-90 transition-all hover:bg-teal-900"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function AdminView({ menuItems, setMenuItems, onLogout, customVegUrl, setCustomVegUrl, customVeganUrl, setCustomVeganUrl, newItem, setNewItem, handleAddItem, handleDeleteItem, queryClient }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [editingItem, setEditingItem] = useState(null);
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

  const handleEditItem = async (updatedItem) => {
    await base44.entities.MenuItem.update(updatedItem.id, updatedItem);
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    setEditingItem(null);
  };

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
    try { const fileUrl = await uploadFile(file); setUploadedFiles(prev => ({ ...prev, weekMenu: fileUrl })); }
    catch (error) { alert('Week Menu upload failed: ' + (error?.message || 'Network error')); }
    finally { setIsSyncing(null); }
  };

  const handleFDAUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("fda");
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('File too large (max 10MB). Your file is ' + Math.round(file.size / 1024 / 1024) + 'MB');
      const fileUrl = await uploadFile(file);
      setUploadedFiles(prev => ({ ...prev, fda: { url: fileUrl, type: file.name.match(/\.(xlsx?|pdf)$/i)?.[1] || 'pdf' } }));
    } catch (error) { alert('FDA upload failed: ' + (error?.message || error?.toString() || 'Network error')); }
    finally { setIsSyncing(null); e.target.value = ''; }
  };

  const handleAllergenUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("allergen");
    try { const fileUrl = await uploadFile(file); setUploadedFiles(prev => ({ ...prev, allergen: fileUrl })); }
    catch (error) { alert('Allergen upload failed: ' + (error?.message || 'Network error')); }
    finally { setIsSyncing(null); }
  };

  const handleIngredientsUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsSyncing("ingredients");
    try {
      const text = await readFileAsText(file);
      if (!text || text.length === 0) throw new Error('File is empty');
      setUploadedFiles(prev => ({ ...prev, ingredients: text }));
    } catch (error) { alert('Ingredients upload failed: ' + (error?.message || 'Cannot read file')); }
    finally { setIsSyncing(null); }
  };

  const handleProcessAndPublish = async () => {
    if (!uploadedFiles.weekMenu && !uploadedFiles.fda && !uploadedFiles.allergen && !uploadedFiles.ingredients) {
      alert('Please upload at least one file to process'); return;
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
        } catch (error) { alert('FDA failed: ' + error.message); }
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
        } catch (error) { alert('Warning: Ingredients processing failed - ' + error.message); }
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
      setTimeout(() => { alert(`✅ Published ${finalItems.length} menu items!`); setProcessingStep(''); setProcessingProgress(0); }, 500);
    } catch (error) {
      alert(`Error: ${error?.message || 'Unknown error'}`);
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
      >
      <PullToRefreshIndicator pullDistance={pullDistance} isPulling={isPulling} isRefreshing={isRefreshing} />
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm font-sans font-bold">
        <div><h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Admin Hub</h2><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 text-teal-800">Manage Menu & Data</p></div>
        <button onClick={onLogout} className="text-red-500 font-bold hover:bg-red-50 px-6 py-3 rounded-xl transition border border-red-100 uppercase text-[10px] tracking-widest">Logout</button>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-100">
        <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm uppercase transition ${activeTab === 'upload' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Upload Files</button>
        <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm uppercase transition ${activeTab === 'manage' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Manage Items ({menuItems.length})</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm uppercase transition ${activeTab === 'users' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Users</button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-10">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Weekly Menu Sync</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
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
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Core Menu Stations</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <CoreMenusSync onCoreItemsPublished={(items, stationId) => {
          try {
            const existing = JSON.parse(localStorage.getItem('coreMenuItems') || '{}');
            existing[stationId] = items;
            localStorage.setItem('coreMenuItems', JSON.stringify(existing));
            alert(`✅ Published ${items.length} ${stationId} items! Refresh the menu to see them.`);
          } catch (err) { alert('Failed to save: ' + err.message); }
        }} />
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <MenuItemsTable items={menuItems} onDelete={handleDeleteItem} onEdit={setEditingItem} onExport={exportToCSV} />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <UserManagement />
        </div>
      )}

      <BulkEditModal isOpen={showBulkEdit} onClose={() => setShowBulkEdit(false)} selectedItems={bulkEditItems} onSave={applyBulkEdit} />
      <EditMenuItemModal isOpen={!!editingItem} item={editingItem} onClose={() => setEditingItem(null)} onSave={handleEditItem} />
    </div>
  );
}

// --- MAIN APP ---

export default function Home() {
  const getCurrentDay = () => {
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (day === 'Saturday' || day === 'Sunday') ? 'Monday' : day;
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const [view, setView] = useState('customer');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { try { return await base44.auth.me(); } catch { return null; } }
  });

  const [localProfile, setLocalProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userProfile') || 'null'); } catch { return null; }
  });

  const effectiveUser = localProfile ? { ...(user || {}), ...localProfile } : user;

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
  const [showAINotice, setShowAINotice] = useState(false);
  const [aiNoticeSeen, setAiNoticeSeen] = useState(() => localStorage.getItem('aiNoticeSeen') === 'true');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: "Hello! I am your Marketplace Assistant. How may I assist your choices today?" }]);
  const [userQuery, setUserQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', day: 'Monday', station: "Chef's Table", ingredients: '', calories: '', protein: '', carbs: '', fat: '', isVeg: false, isVegan: false });
  const [activeFilters, setActiveFilters] = useState({ vegetarian: false, vegan: false, fit: false });
  const dayScrollRef = useRef(null);

  const changeView = (v) => {
    if (v === 'chat' && !aiNoticeSeen) {
      setShowAINotice(true);
      return;
    }
    const from = VIEW_ORDER.indexOf(view);
    const to = VIEW_ORDER.indexOf(v);
    setDirection(to >= from ? 1 : -1);
    setView(v);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleAINoticeAccept = () => {
    localStorage.setItem('aiNoticeSeen', 'true');
    setAiNoticeSeen(true);
    setShowAINotice(false);
    const from = VIEW_ORDER.indexOf(view);
    const to = VIEW_ORDER.indexOf('chat');
    setDirection(to >= from ? 1 : -1);
    setView('chat');
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
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
  };

  const handleDeleteItem = async (id) => {
    await base44.entities.MenuItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
  };

  const handleSendChat = async (overrideText = null) => {
    const textToSend = overrideText || userQuery;
    if (!textToSend.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: textToSend }]);
    setUserQuery('');
    setIsTyping(true);
    try {
      // Slim down menu context - only send fields needed for chat
      const slimMenu = menuItems.map(({ name, day, station, meal_period, calories, protein, carbs, fat, sodium, fiber, sugar, allergens, tags, description }) => ({
        name, day, station, meal_period, calories, protein, carbs, fat, sodium, fiber, sugar, allergens, tags, description
      }));
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful nutrition assistant for a corporate Marketplace. Menu: ${JSON.stringify(slimMenu)}. Question: ${textToSend}. Be concise.`
      });
      if (response) setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
    } catch (e) { 
      setChatHistory(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please check the menu directly for nutrition information!" }]); 
    } finally { setIsTyping(false); }
  };

  const toggleFilter = (filter) => setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  const clearFilters = () => setActiveFilters({ vegetarian: false, vegan: false, fit: false });

  const checkItemSuitability = (item) => {
    if (!effectiveUser) return { suitable: true, reasons: [] };
    const reasons = []; let suitable = true;
    const userRestrictions = effectiveUser.dietary_restrictions || [];
    const itemAllergens = item.allergens || [];
    const hasRestricted = userRestrictions.some(restriction => itemAllergens.some(allergen => allergen.toLowerCase().includes(restriction.toLowerCase())));
    if (hasRestricted) { suitable = false; reasons.push('Contains allergen you avoid'); }
    const userPreferences = effectiveUser.dietary_preferences || [];
    if (userPreferences.includes('Vegan') && !item.tags?.includes('Vegan')) { suitable = false; reasons.push('Not vegan'); }
    if (userPreferences.includes('Vegetarian') && !item.tags?.includes('Vegetarian') && !item.tags?.includes('Vegan')) { suitable = false; reasons.push('Not vegetarian'); }
    const userGoals = effectiveUser.health_goals || [];
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

  return (
    <AccessibilityProvider>
      <LargeTextWrapper>
        <AllergenNoticeModal />
      <div className="hidden md:block">
        <NavBar view={view} changeView={changeView} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} onProfileClick={() => setIsProfileModalOpen(true)} />
      </div>
      
      <main className="w-full font-bold">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'customer' && (
            <motion.div key="customer"
              variants={slideVariants}
              initial={direction > 0 ? 'enterFromRight' : 'enterFromLeft'}
              animate="center"
              exit={direction > 0 ? 'exitToLeft' : 'exitToRight'}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <CustomerView
                menuItems={menuItems}
                queryClient={queryClient}
                customVegUrl={customVegUrl}
                customVeganUrl={customVeganUrl}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                activeFilters={activeFilters}
                toggleFilter={toggleFilter}
                clearFilters={clearFilters}
                filteredItems={filteredItems}
                dayScrollRef={dayScrollRef}
                addToPlate={addToPlate}
                myPlate={myPlate}
                setMyPlate={setMyPlate}
                isTrayModalOpen={isTrayModalOpen}
                setIsTrayModalOpen={setIsTrayModalOpen}
                isWeeklyPlannerOpen={isWeeklyPlannerOpen}
                setIsWeeklyPlannerOpen={setIsWeeklyPlannerOpen}
                changeView={changeView}
                user={user}
              />
            </motion.div>
          )}
          {view === 'chat' && (
            <motion.div key="chat"
              variants={slideVariants}
              initial={direction > 0 ? 'enterFromRight' : 'enterFromLeft'}
              animate="center"
              exit={direction > 0 ? 'exitToLeft' : 'exitToRight'}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <ChatView chatHistory={chatHistory} isTyping={isTyping} userQuery={userQuery} setUserQuery={setUserQuery} handleSendChat={handleSendChat} />
            </motion.div>
          )}
          {view === 'admin' && !isAdminLoggedIn && (
            <motion.div key="admin-lock"
              variants={slideVariants}
              initial={direction > 0 ? 'enterFromRight' : 'enterFromLeft'}
              animate="center"
              exit={direction > 0 ? 'exitToLeft' : 'exitToRight'}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <AdminGate onGranted={() => setIsAdminLoggedIn(true)} />
            </motion.div>
          )}
          {view === 'admin' && isAdminLoggedIn && (
            <motion.div key="admin"
              variants={slideVariants}
              initial={direction > 0 ? 'enterFromRight' : 'enterFromLeft'}
              animate="center"
              exit={direction > 0 ? 'exitToLeft' : 'exitToRight'}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <AdminView menuItems={menuItems} setMenuItems={setMenuItems} onLogout={() => setIsAdminLoggedIn(false)} customVegUrl={customVegUrl} setCustomVegUrl={setCustomVegUrl} customVeganUrl={customVeganUrl} setCustomVeganUrl={setCustomVeganUrl} newItem={newItem} setNewItem={setNewItem} handleAddItem={handleAddItem} handleDeleteItem={(id) => setMenuItems(menuItems.filter(i => i.id !== id))} queryClient={queryClient} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <MobileBottomNav view={view} changeView={changeView} onProfileClick={() => setIsProfileModalOpen(true)} />

      <NutritionCharts isOpen={isChartsOpen} onClose={() => setIsChartsOpen(false)} menuItems={menuItems} />
      <ProfileSettingsModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={effectiveUser} onProfileUpdate={(profile) => { setLocalProfile(profile); localStorage.setItem('userProfile', JSON.stringify(profile)); }} />
      <AITransparencyModal isOpen={showAINotice} onAccept={handleAINoticeAccept} />
      <Footer onAdminClick={() => changeView('admin')} />
      </LargeTextWrapper>
    </AccessibilityProvider>

  );
}