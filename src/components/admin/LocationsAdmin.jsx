import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, X, MapPin, Loader2 } from 'lucide-react';

const EMPTY = { name: '', subdomain: '', zip_code: '', address: '', city: '', state: '' };

export default function LocationsAdmin() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // record or EMPTY for new
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['locations'] });

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!editing.name?.trim() || !editing.subdomain?.trim()) {
      setError('Name and subdomain are required.');
      return;
    }
    setSaving(true);
    try {
      const clean = {
        name: editing.name.trim(),
        subdomain: editing.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        zip_code: editing.zip_code?.trim() || '',
        address: editing.address?.trim() || '',
        city: editing.city?.trim() || '',
        state: editing.state?.trim() || '',
      };
      if (editing.id) {
        await base44.entities.Location.update(editing.id, clean);
      } else {
        await base44.entities.Location.create(clean);
      }
      await refresh();
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loc) => {
    if (!confirm(`Delete "${loc.name}"? This removes the location from the picker.`)) return;
    try {
      await base44.entities.Location.delete(loc.id);
      await refresh();
    } catch (err) {
      alert('Failed to delete: ' + (err.message || err));
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">
            {editing.id ? 'Edit Location' : 'Add Location'}
          </h3>
          <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Location Name *</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Main Campus Cafe" className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Subdomain * (becomes the URL)</label>
              <div className="flex items-center gap-1">
                <input value={editing.subdomain || ''} onChange={(e) => setEditing({ ...editing, subdomain: e.target.value })} placeholder="e.g. main" className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500" />
                <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">.smartmenuiq.app</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">ZIP Code</label>
              <input value={editing.zip_code || ''} onChange={(e) => setEditing({ ...editing, zip_code: e.target.value })} placeholder="e.g. 30303" className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Address</label>
              <input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} placeholder="Street address" className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">City</label>
              <input value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} placeholder="City" className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">State</label>
              <input value={editing.state || ''} onChange={(e) => setEditing({ ...editing, state: e.target.value })} placeholder="State" className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-teal-600 text-white p-4 rounded-xl font-bold uppercase text-xs hover:bg-teal-700 transition-all shadow-lg active:scale-95 tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editing.id ? 'Save Changes' : 'Add Location'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="px-6 bg-gray-100 text-gray-600 p-4 rounded-xl font-bold uppercase text-xs hover:bg-gray-200 transition tracking-widest">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" /> Locations
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Manage which locations appear on the welcome picker
          </p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="bg-slate-900 text-white px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" /></div>
      ) : locations.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-xs uppercase tracking-widest border border-dashed border-gray-200 rounded-2xl">
          No locations yet — click "Add" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-teal-100 p-2.5 rounded-xl"><MapPin className="w-5 h-5 text-teal-700" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm uppercase tracking-tight truncate">{loc.name}</p>
                <p className="text-[11px] text-gray-500 font-medium truncate">
                  <span className="text-teal-700 font-bold">{loc.subdomain}.smartmenuiq.app</span>
                  {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).length > 0 && (
                    <> — {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(', ')}</>
                  )}
                </p>
              </div>
              <button onClick={() => setEditing(loc)} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(loc)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}