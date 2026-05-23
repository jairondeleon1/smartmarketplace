import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, Save, Eye, EyeOff, ExternalLink, FileText, Calendar } from 'lucide-react';

const EMPTY_RECORD = {
  title: "Dietitian's Wellness Corner",
  subtitle: '',
  dietitian_name: '',
  dietitian_bio: '',
  dietitian_photo_url: '',
  hero_image_url: '',
  links: [],
  featured_tiles: [],
  active: true,
};

const LINK_TYPES = [
  { value: 'pdf', label: 'PDF Document', icon: FileText },
  { value: 'website', label: 'Website / Article', icon: ExternalLink },
  { value: 'signup', label: 'Sign-Up / Booking', icon: Calendar },
];

export default function DietitianCornerAdmin() {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_RECORD);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.DietitianCorner.list()
      .then(results => {
        if (results?.[0]) {
          setRecord(results[0]);
          setForm({ ...EMPTY_RECORD, ...results[0] });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const uploadImage = async (file, field) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, [field]: file_url }));
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (record?.id) {
        await base44.entities.DietitianCorner.update(record.id, payload);
      } else {
        const created = await base44.entities.DietitianCorner.create(payload);
        setRecord(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Link helpers
  const addLink = () => setForm(prev => ({ ...prev, links: [...(prev.links || []), { label: '', url: '', type: 'website' }] }));
  const updateLink = (i, field, val) => setForm(prev => { const links = [...prev.links]; links[i] = { ...links[i], [field]: val }; return { ...prev, links }; });
  const removeLink = (i) => setForm(prev => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }));

  // Tile helpers
  const addTile = () => setForm(prev => ({ ...prev, featured_tiles: [...(prev.featured_tiles || []), { image_url: '', link_url: '', caption: '' }] }));
  const updateTile = (i, field, val) => setForm(prev => { const tiles = [...prev.featured_tiles]; tiles[i] = { ...tiles[i], [field]: val }; return { ...prev, featured_tiles: tiles }; });
  const removeTile = (i) => setForm(prev => ({ ...prev, featured_tiles: prev.featured_tiles.filter((_, idx) => idx !== i) }));
  const uploadTileImage = async (file, i) => {
    if (!file) return;
    setUploadingField(`tile-${i}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateTile(i, 'image_url', file_url);
    } catch (e) { alert('Upload failed: ' + e.message); }
    finally { setUploadingField(null); }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Dietitian's Wellness Corner</h3>
          <p className="text-xs text-gray-400 mt-0.5">Manage the wellness content shown to users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition ${form.active ? 'bg-green-50 border-green-400 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
          >
            {form.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.active ? 'Visible' : 'Hidden'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-700 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Section Info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Section Info</h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Section Title *</label>
            <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
              value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Dietitian's Wellness Corner" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Subtitle</label>
            <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              value={form.subtitle} onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Monthly nutrition tips & resources" />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Images</h4>

        {/* Hero image */}
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Hero / Banner Image</label>
          <div className="flex gap-3 items-start">
            {form.hero_image_url && <img src={form.hero_image_url} alt="hero" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />}
            <div className="flex-1 space-y-2">
              <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                value={form.hero_image_url} onChange={e => setForm(prev => ({ ...prev, hero_image_url: e.target.value }))} placeholder="Paste image URL or upload below" />
              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition">
                {uploadingField === 'hero_image_url' ? <Loader2 className="w-3 h-3 animate-spin" /> : '↑ Upload Image'}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => uploadImage(e.target.files[0], 'hero_image_url')} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Dietitian Profile */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Dietitian Profile</h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Name</label>
            <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              value={form.dietitian_name} onChange={e => setForm(prev => ({ ...prev, dietitian_name: e.target.value }))} placeholder="e.g. Monica Smith, RD" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Photo</label>
            <div className="flex gap-2 items-center">
              {form.dietitian_photo_url && <img src={form.dietitian_photo_url} alt="dietitian" className="w-10 h-10 rounded-full object-cover border border-gray-200" />}
              <div className="flex-1 space-y-1">
                <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.dietitian_photo_url} onChange={e => setForm(prev => ({ ...prev, dietitian_photo_url: e.target.value }))} placeholder="Paste photo URL or upload" />
                <label className="inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition">
                  {uploadingField === 'dietitian_photo_url' ? <Loader2 className="w-3 h-3 animate-spin" /> : '↑ Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => uploadImage(e.target.files[0], 'dietitian_photo_url')} />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Bio</label>
          <textarea className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none h-20"
            value={form.dietitian_bio} onChange={e => setForm(prev => ({ ...prev, dietitian_bio: e.target.value }))} placeholder="Short bio about the dietitian..." />
        </div>
      </div>

      {/* Links */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Resource Links / Buttons</h4>
          <button onClick={addLink} className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-100 transition">
            <Plus className="w-3 h-3" /> Add Link
          </button>
        </div>
        {(!form.links || form.links.length === 0) && (
          <p className="text-xs text-gray-400 italic">No links yet. Add PDFs, websites, or sign-up links.</p>
        )}
        {form.links?.map((link, i) => (
          <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="p-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} placeholder="Button label" />
                <select className="p-2.5 border border-gray-200 rounded-lg bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                  value={link.type} onChange={e => updateLink(i, 'type', e.target.value)}>
                  {LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <input className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-teal-500"
                value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder="https://... or paste PDF URL" />
            </div>
            <button onClick={() => removeLink(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition mt-0.5">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Featured Tiles */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Featured Image Tiles</h4>
          <button onClick={addTile} className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-100 transition">
            <Plus className="w-3 h-3" /> Add Tile
          </button>
        </div>
        {(!form.featured_tiles || form.featured_tiles.length === 0) && (
          <p className="text-xs text-gray-400 italic">No tiles yet. Add clickable image cards that link to recipes or articles.</p>
        )}
        {form.featured_tiles?.map((tile, i) => (
          <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3 border border-gray-100">
            {tile.image_url && <img src={tile.image_url} alt="" className="w-16 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <label className="flex items-center gap-1 cursor-pointer px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 transition">
                  {uploadingField === `tile-${i}` ? <Loader2 className="w-3 h-3 animate-spin" /> : '↑ Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => uploadTileImage(e.target.files[0], i)} />
                </label>
                <input className="flex-1 p-2 border border-gray-200 rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  value={tile.image_url} onChange={e => updateTile(i, 'image_url', e.target.value)} placeholder="Or paste image URL" />
              </div>
              <input className="w-full p-2 border border-gray-200 rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
                value={tile.link_url} onChange={e => updateTile(i, 'link_url', e.target.value)} placeholder="Link URL (website or PDF)" />
              <input className="w-full p-2 border border-gray-200 rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
                value={tile.caption} onChange={e => updateTile(i, 'caption', e.target.value)} placeholder="Caption (optional)" />
            </div>
            <button onClick={() => removeTile(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Save button bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-teal-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}