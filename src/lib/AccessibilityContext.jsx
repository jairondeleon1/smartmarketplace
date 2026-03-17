import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext({});

export const ES = {
  menu: 'Menú',
  aiAssistant: 'Asistente IA',
  admin: 'Admin',
  settings: 'Ajustes',
  planMyWeek: 'Planificar Mi Semana',
  askAI: 'Preguntar al Asistente IA',
  nutritionGuide: 'Guía de Nutrición y Opciones',
  coreMenus: 'Menús Principales',
  veg: 'Vegetariano',
  vegan: 'Vegano',
  fit: 'Fit',
  myTray: 'Mi Bandeja de Nutrición',
  cals: 'Calorías',
  prot: 'Prot',
  carbs: 'Carbs',
  disclaimer: '⚠️ Estimaciones solamente. Los consejos de IA no son consejo médico. Verifique alérgenos con el personal antes de comer.',
  pullRefresh: 'Tire para actualizar',
  releaseRefresh: 'Suelte para actualizar',
  refreshing: 'Actualizando...',
  noItems: 'No hay artículos del menú que coincidan con sus filtros',
  showAll: 'Mostrar Todos los Artículos',
  nutritionDetails: 'Detalles Nutricionales',
  hideInfo: 'Ocultar Info',
  addToTray: 'Agregar a la bandeja',
  ingredients: 'Ingredientes',
  contains: 'Contiene',
  matchesGoals: 'Coincide con Sus Objetivos',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  dailySpecial: 'Especial del Día',
  allDays: 'Todos los Días',
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  entrees: 'Platos Principales',
  sidesExtras: 'Guarniciones y Extras',
  noBreakfast: 'No hay artículos de desayuno para este día',
  noLunch: 'No hay artículos de almuerzo para este día',
  language: 'English',
  largeText: 'Texto Grande',
  normalText: 'Texto Normal',
  a11yToolbar: 'Barra de Accesibilidad',
};

export const EN = {
  menu: 'Menu',
  aiAssistant: 'AI Assistant',
  admin: 'Admin',
  settings: 'Settings',
  planMyWeek: 'Plan My Whole Week Meal',
  askAI: 'Ask AI Assistant',
  nutritionGuide: 'Nutrition Guide & Choices',
  coreMenus: 'Core Menus',
  veg: 'Veg',
  vegan: 'Vegan',
  fit: 'Fit',
  myTray: 'My Nutrition Tray',
  cals: 'Cals',
  prot: 'Prot',
  carbs: 'Carbs',
  disclaimer: '⚠️ Estimates only. AI insights are not medical advice. Verify allergens with staff before eating.',
  pullRefresh: 'Pull to refresh',
  releaseRefresh: 'Release to refresh',
  refreshing: 'Refreshing...',
  noItems: 'No menu items match your filters',
  showAll: 'Show All Items',
  nutritionDetails: 'Nutrition Details',
  hideInfo: 'Hide Info',
  addToTray: 'Add to tray',
  ingredients: 'Ingredients',
  contains: 'Contains',
  matchesGoals: 'Matches Your Goals',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  dailySpecial: 'Daily Special',
  allDays: 'All Days',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  entrees: 'Entrees',
  sidesExtras: 'Sides & Extras',
  noBreakfast: 'No Breakfast items for this day',
  noLunch: 'No Lunch items for this day',
  language: 'Español',
  largeText: 'Large Text',
  normalText: 'Normal Text',
  a11yToolbar: 'Accessibility Toolbar',
};

export function AccessibilityProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('a11y_lang') || 'en');

  const t = lang === 'es' ? ES : EN;

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('a11y_lang', lang);
  }, [lang]);

  const toggleLang = () => setLang(l => l === 'en' ? 'es' : 'en');

  return (
    <AccessibilityContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useA11y() {
  return useContext(AccessibilityContext);
}