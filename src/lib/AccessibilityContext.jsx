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
  // ProfileSettingsModal
  myProfile: 'Mi Perfil',
  privacyStatus: 'Estado de Privacidad',
  optedOutGPC: '🔒 Desactivado (GPC Activo)',
  standardMode: 'Modo Estándar',
  gpcBannerTitle: 'Señal de Preferencia de Exclusión Respetada',
  gpcBannerBody: 'Su navegador envió una señal de Control Global de Privacidad (GPC). El procesamiento de datos se ha limitado en consecuencia.',
  disclaimerText: 'Entiendo que SmartMenuIQ proporciona <b>solo estimaciones</b> y soy responsable de verificar ingredientes y alérgenos directamente con el personal del restaurante antes de consumir cualquier artículo.',
  dietaryRestrictions: 'Restricciones Dietéticas',
  dietaryRestrictionsDesc: 'Seleccione alérgenos o ingredientes que necesita evitar',
  severeAllergyTitle: 'Alergia Grave Detectada',
  severeAllergyBody: 'Ha marcado una alergia grave a {allergens}. Si bien destacamos artículos sin coincidencias, por favor <b>alerte a un Embajador de Ingredientes</b> en nuestro Mercado — nuestros datos no pueden rastrear la contaminación cruzada en tiempo real.',
  dietaryPreferences: 'Preferencias Dietéticas',
  dietaryPreferencesDesc: 'Elija su estilo de vida dietético',
  aiMatchNote: 'SmartMenuIQ usa IA para relacionar su perfil con los datos del menú. Puede optar por no recibir recomendaciones basadas en IA en cualquier momento.',
  healthGoals: 'Objetivos de Salud',
  healthGoalsDesc: 'Seleccione sus objetivos nutricionales',
  downloadMyData: 'Descargar Mis Datos',
  downloadMyDataDesc: 'Exporte todos los datos de perfil asociados con su sesión anónima como archivo JSON.',
  exportMyData: 'Exportar Mis Datos',
  legalPrivacy: 'Legal y Privacidad',
  legalPrivacyDesc: 'Acceda a nuestros documentos legales directamente — sin necesidad de inicio de sesión.',
  privacyPolicy: 'Política de Privacidad',
  termsOfService: 'Términos de Servicio',
  accessibility: 'Accesibilidad',
  language: 'Español → English',
  deleteProfile: 'Eliminar Perfil',
  deleteProfileDesc: 'Elimine permanentemente sus preferencias de nuestro caché de sesión activa. Ejerce su "Derecho al Olvido".',
  deleteMyAccount: 'Eliminar Mi Cuenta',
  confirmDeleteMsg: '¿Está absolutamente seguro? Esto no se puede deshacer.',
  cancel: 'Cancelar',
  confirmDelete: 'Confirmar Eliminación',
  deleting: 'Eliminando...',
  saveProfile: 'Guardar Perfil',
  saving: 'Guardando...',
  // CoreMenus
  coreMenusLabel: 'Menús Principales',
  askStaff: 'Los artículos anteriores son ofertas estándar. Pregúnte al personal sobre los especiales del día.',
  // TrayModal
  myNutritionTray: 'Mi Bandeja de Nutrición',
  trayEmpty: 'Su bandeja está vacía',
  mealsForWeek: 'Comidas para la Semana',
  downloadReport: 'Descargar Informe',
  // NavBar
  dayChallengeLink: 'Desafío 30 Días',
  // Chat
  chatPlaceholder: 'Preguntar sobre nutrición, alérgenos, artículos del menú...',
  chatTyping: 'Smart Menu IQ...',
  // Filters
  showAllItems: 'Mostrar Todos los Artículos',
  noFilterMatch: 'Ningún artículo del menú coincide con sus filtros',
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
  // ProfileSettingsModal
  myProfile: 'My Profile',
  privacyStatus: 'Privacy Status',
  optedOutGPC: '🔒 Opted Out (GPC Active)',
  standardMode: 'Standard Mode',
  gpcBannerTitle: 'Opt-Out Preference Signal Honored',
  gpcBannerBody: 'Your browser sent a Global Privacy Control (GPC) signal. Data processing has been limited accordingly.',
  disclaimerText: 'I understand that SmartMenuIQ provides <b>estimates only</b> and I am responsible for verifying ingredients and allergens directly with the restaurant or food service staff before consuming any item.',
  dietaryRestrictions: 'Dietary Restrictions',
  dietaryRestrictionsDesc: 'Select allergens or ingredients you need to avoid',
  severeAllergyTitle: 'Severe Allergy Flagged',
  severeAllergyBody: "You've flagged a severe allergy to {allergens}. While we highlight matching-free items, please <b>alert an Ingredient Ambassador</b> at our Marketplace — our data cannot track real-time kitchen cross-contamination or shared fryers.",
  dietaryPreferences: 'Dietary Preferences',
  dietaryPreferencesDesc: 'Choose your dietary lifestyle',
  aiMatchNote: 'SmartMenuIQ uses AI to match your profile with menu data. You can opt-out of AI-driven insights at any time in Settings.',
  healthGoals: 'Health Goals',
  healthGoalsDesc: 'Select your nutrition goals',
  downloadMyData: 'Download My Data',
  downloadMyDataDesc: 'Export all profile data associated with your anonymous session (going back to January 1, 2022) as a JSON file.',
  exportMyData: 'Export My Data',
  legalPrivacy: 'Legal & Privacy',
  legalPrivacyDesc: 'Access our legal documents directly — no login required.',
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',
  accessibility: 'Accessibility',
  language: 'Español',
  deleteProfile: 'Delete Profile',
  deleteProfileDesc: 'Permanently scrub your preferences from our active session cache. Exercises your "Right to be Forgotten."',
  deleteMyAccount: 'Delete My Account',
  confirmDeleteMsg: 'Are you absolutely sure? This cannot be undone.',
  cancel: 'Cancel',
  confirmDelete: 'Confirm Delete',
  deleting: 'Deleting...',
  saveProfile: 'Save Profile',
  saving: 'Saving...',
  // CoreMenus
  coreMenusLabel: 'Core Menus',
  askStaff: 'Items above are standard offerings. Ask staff for daily specials.',
  // TrayModal
  myNutritionTray: 'My Nutrition Tray',
  trayEmpty: 'Your tray is empty',
  mealsForWeek: 'Meals for the Week',
  downloadReport: 'Download Report',
  // NavBar
  dayChallengeLink: '30 Day Challenge',
  // Chat
  chatPlaceholder: 'Ask about nutrition, allergens, menu items...',
  chatTyping: 'Smart Menu IQ...',
  // Filters
  showAllItems: 'Show All Items',
  noFilterMatch: 'No menu items match your filters',
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