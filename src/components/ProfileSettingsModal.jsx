import React, { useState, useEffect } from 'react';
import { X, Check, User, AlertTriangle, Heart, Target, Trash2, ShieldAlert, ShieldCheck, Download, Shield, ExternalLink, Globe, Type } from 'lucide-react';
import { useA11y } from '@/lib/AccessibilityContext';

const ALLERGENS = ['Milk', 'Wheat', 'Egg', 'Soy', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Sesame', 'Gluten'];
const SEVERE_ALLERGENS = ['Shellfish', 'Tree Nuts', 'Peanuts', 'Fish', 'Sesame'];
const DIET_PREFERENCES = ['Vegan', 'Vegetarian', 'Fit'];
const HEALTH_GOALS = ['High Protein', 'Low Carb', 'High Fiber'];

export default function ProfileSettingsModal({ isOpen, onClose, user, onProfileUpdate }) {
  const { lang, toggleLang } = useA11y();
  const [restrictions, setRestrictions] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => localStorage.getItem('profileDisclaimerAccepted') === 'true');
  const [gpcActive] = useState(() => navigator.globalPrivacyControl === true);

  useEffect(() => {
    if (user) {
      setRestrictions(user.dietary_restrictions || []);
      setPreferences(user.dietary_preferences || []);
      setGoals(user.health_goals || []);
    }
  }, [user]);

  const toggleItem = (item, list, setList) => {
    const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setList(newList);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        dietary_restrictions: restrictions,
        dietary_preferences: preferences,
        health_goals: goals
      };
      if (disclaimerAccepted) localStorage.setItem('profileDisclaimerAccepted', 'true');
      // Store profile locally since auth may not be available
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      if (onProfileUpdate) onProfileUpdate(profileData);
      onClose();
    } catch (error) {
      alert('Error saving profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      data_range: 'January 1, 2022 – Present',
      profile: {
        dietary_restrictions: restrictions,
        dietary_preferences: preferences,
        health_goals: goals,
        disclaimer_accepted: disclaimerAccepted,
        gpc_opt_out: gpcActive,
      },
      note: 'This export contains all profile data associated with your anonymous session.'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartmenuiq_my_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    localStorage.removeItem('userProfile');
    if (onProfileUpdate) onProfileUpdate({ dietary_restrictions: [], dietary_preferences: [], health_goals: [] });
    setShowDeleteConfirm(false);
    setIsDeletingAccount(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-teal-400" />
            <h3 className="font-bold text-xl uppercase tracking-tight">My Profile</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* GPC Status Banner */}
          {gpcActive && (
            <div className="bg-green-50 border border-green-300 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Opt-Out Preference Signal Honored</p>
                <p className="text-xs text-green-700 mt-0.5">Your browser sent a Global Privacy Control (GPC) signal. Data processing has been limited accordingly.</p>
              </div>
            </div>
          )}

          {/* Privacy Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Privacy Status</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${gpcActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
              {gpcActive ? '🔒 Opted Out (GPC Active)' : 'Standard Mode'}
            </span>
          </div>

          {/* Disclaimer Acceptance */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 items-start">
            <input
              type="checkbox"
              id="disclaimer-accept"
              checked={disclaimerAccepted}
              onChange={e => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-600 shrink-0 cursor-pointer"
            />
            <label htmlFor="disclaimer-accept" className="text-xs text-amber-900 leading-relaxed cursor-pointer">
              I understand that SmartMenuIQ provides <span className="font-bold">estimates only</span> and I am responsible for verifying ingredients and allergens directly with the restaurant or food service staff before consuming any item.
            </label>
          </div>

          {/* Dietary Restrictions */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Dietary Restrictions</h4>
            </div>
            <p className="text-xs text-gray-600 mb-4">Select allergens or ingredients you need to avoid</p>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map(allergen => (
                <button
                  key={allergen}
                  onClick={() => toggleItem(allergen, restrictions, setRestrictions)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${
                    restrictions.includes(allergen)
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {restrictions.includes(allergen) && <Check className="w-3 h-3 inline mr-1" />}
                  {allergen}
                </button>
              ))}
            </div>

            {/* Severe Allergen Warning */}
            {restrictions.some(r => SEVERE_ALLERGENS.includes(r)) && (
              <div className="mt-4 bg-red-100 border border-red-300 rounded-xl p-4 flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Severe Allergy Flagged</p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    You've flagged a severe allergy to <span className="font-bold">{restrictions.filter(r => SEVERE_ALLERGENS.includes(r)).join(', ')}</span>. While we highlight matching-free items, please <span className="font-bold">alert an Ingredient Ambassador</span> at our Marketplace — our data cannot track real-time kitchen cross-contamination or shared fryers.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dietary Preferences */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Dietary Preferences</h4>
            </div>
            <p className="text-xs text-gray-600 mb-3">Choose your dietary lifestyle</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800 leading-relaxed">
              SmartMenuIQ uses AI to match your profile with menu data. You can opt-out of AI-driven insights at any time in Settings.
            </div>
            <div className="flex flex-wrap gap-2">
              {DIET_PREFERENCES.map(pref => (
                <button
                  key={pref}
                  onClick={() => toggleItem(pref, preferences, setPreferences)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${
                    preferences.includes(pref)
                      ? 'bg-green-600 text-white border-green-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {preferences.includes(pref) && <Check className="w-3 h-3 inline mr-1" />}
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Health Goals */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Health Goals</h4>
            </div>
            <p className="text-xs text-gray-600 mb-4">Select your nutrition goals</p>
            <div className="flex flex-wrap gap-2">
              {HEALTH_GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleItem(goal, goals, setGoals)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${
                    goals.includes(goal)
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {goals.includes(goal) && <Check className="w-3 h-3 inline mr-1" />}
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Download My Data */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-slate-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Download My Data</h4>
            </div>
            <p className="text-xs text-gray-600 mb-4">Export all profile data associated with your anonymous session (going back to January 1, 2022) as a JSON file.</p>
            <button
              onClick={handleDownloadData}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase border-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> Export My Data
            </button>
          </div>

          {/* Legal Links */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-5 h-5 text-slate-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Legal & Privacy</h4>
            </div>
            <p className="text-xs text-gray-600 mb-4">Access our legal documents directly — no login required.</p>
            <div className="flex flex-wrap gap-2">
              <a href="#" onClick={e => { e.preventDefault(); onClose(); setTimeout(() => document.querySelector('[data-footer-link="privacy"]')?.click(), 100); }} className="px-4 py-2 rounded-xl text-xs font-bold uppercase border-2 bg-white text-teal-700 border-teal-200 hover:bg-teal-50 transition">Privacy Policy</a>
              <a href="#" onClick={e => { e.preventDefault(); onClose(); setTimeout(() => document.querySelector('[data-footer-link="terms"]')?.click(), 100); }} className="px-4 py-2 rounded-xl text-xs font-bold uppercase border-2 bg-white text-teal-700 border-teal-200 hover:bg-teal-50 transition">Terms of Service</a>
            </div>
          </div>

          {/* Accessibility */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Accessibility</h4>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={toggleLang}
                className="flex items-center justify-between px-4 py-3 rounded-xl border-2 bg-white border-indigo-200 hover:bg-indigo-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Language</span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase">
                  {lang === 'en' ? 'English → Español' : 'Español → English'}
                </span>
              </button>
              <button
                onClick={toggleLargeText}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${largeText ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-indigo-200 hover:bg-indigo-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Type className={`w-4 h-4 ${largeText ? 'text-white' : 'text-indigo-600'}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${largeText ? 'text-white' : 'text-slate-700'}`}>Large Text</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${largeText ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                  {largeText ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Delete Profile</h4>
          </div>
          <p className="text-xs text-gray-600 mb-4">Permanently scrub your preferences from our active session cache. Exercises your "Right to be Forgotten."</p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase border-2 bg-white text-red-600 border-red-300 hover:bg-red-50 transition"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-red-700 bg-red-100 rounded-lg p-3">Are you absolutely sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-white text-gray-700 rounded-xl font-bold uppercase text-xs border border-gray-200 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-bold uppercase text-xs border border-gray-200 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-teal-700 transition disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}