import React, { useState, useEffect } from 'react';
import { X, Check, User, AlertTriangle, Heart, Target, Trash2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const ALLERGENS = ['Milk', 'Wheat', 'Egg', 'Soy', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Gluten'];
const SEVERE_ALLERGENS = ['Shellfish', 'Tree Nuts', 'Peanuts', 'Fish'];
const DIET_PREFERENCES = ['Vegan', 'Vegetarian'];
const HEALTH_GOALS = ['High Protein', 'Low Carb', 'Low Sodium', 'High Fiber'];

export default function ProfileSettingsModal({ isOpen, onClose, user }) {
  const [restrictions, setRestrictions] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setRestrictions(user.dietary_restrictions || []);
      setPreferences(user.dietary_preferences || []);
      setGoals(user.health_goals || []);
    }
  }, [user]);

  // Optimistic toggle: update local state immediately, then persist in background
  const toggleItem = (item, list, setList, field) => {
    const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setList(newList);
    // Persist optimistically in the background
    const patch = {};
    if (field === 'restrictions') patch.dietary_restrictions = newList;
    if (field === 'preferences') patch.dietary_preferences = newList;
    if (field === 'goals') patch.health_goals = newList;
    base44.auth.updateMe(patch).then(() => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        dietary_restrictions: restrictions,
        dietary_preferences: preferences,
        health_goals: goals
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onClose();
    } catch (error) {
      alert('Error saving profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await base44.auth.logout('/');
    } catch (error) {
      alert('Error deleting account: ' + error.message);
      setIsDeletingAccount(false);
    }
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
                  onClick={() => toggleItem(allergen, restrictions, setRestrictions, 'restrictions')}
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
          </div>

          {/* Dietary Preferences */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Dietary Preferences</h4>
            </div>
            <p className="text-xs text-gray-600 mb-4">Choose your dietary lifestyle</p>
            <div className="flex flex-wrap gap-2">
              {DIET_PREFERENCES.map(pref => (
                <button
                  key={pref}
                  onClick={() => toggleItem(pref, preferences, setPreferences, 'preferences')}
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
                  onClick={() => toggleItem(goal, goals, setGoals, 'goals')}
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

          {/* Delete Account */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Delete Account</h4>
          </div>
          <p className="text-xs text-gray-600 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
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