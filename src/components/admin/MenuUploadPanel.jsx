import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Upload, Loader2, CheckCircle, XCircle, Sparkles,
  Calendar, FileText, AlertTriangle, Info
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special', 'All Days'];

function normalizeStation(station) {
  const s = (station || '').toLowerCase().trim();
  if (s.includes('main') || s.includes('comfort') || s.includes('entree')) return 'Entree';
  return station;
}

function normalizeRecipeNum(num) {
  return String(num || '').trim().replace(/^0+/, '').toLowerCase();
}

export default function MenuUploadPanel({ menuItems, onPublish }) {
  const [user, setUser] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, ingredients: null, allergenFile: null });
  const [uploading, setUploading] = useState(null); // which slot is uploading
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState('');
  const [progress, setProgress] = useState(0);

  // Check if user is Admin or Dietitian (roles that can see allergens)
  const canManageAllergens = user && (user.role === 'admin' || user.role === 'dietitian');

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Extract text from a PDF file client-side using pdfjs
  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileSelect = async (slotKey, file) => {
    if (!file) return;
    setUploading(slotKey);
    try {
      let text = '';
      if (file.name.endsWith('.csv')) {
        // CSV — read as text
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
      } else {
        // PDF — extract text client-side, no upload needed
        text = await extractPdfText(file);
      }
      if (!text || text.trim().length === 0) throw new Error('File is empty or could not be read');
      setUploadedFiles(prev => ({ ...prev, [slotKey]: { text, name: file.name } }));
    } catch (err) {
      alert(`❌ ${slotKey} upload failed: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleProcessAndPublish = async () => {
    const { weekMenu, fda, ingredients, allergenFile } = uploadedFiles;
    if (!weekMenu && !fda && !ingredients && !allergenFile) {
      alert('Please upload at least one file first.');
      return;
    }

    setPublishing(true);
    setProgress(10);

    try {
      setStep('Processing files on server...');
      
      const response = await base44.functions.invoke('processMenu', {
        weekMenuText: weekMenu?.text || '',
        fdaText: fda?.text || '',
        ingredientsText: ingredients?.text || '',
        allergenText: allergenFile?.text || ''
      });
      
      const finalItems = response.items || [];
      
      setProgress(95);
      setStep('Publishing menu...');
      
      await onPublish(finalItems);

      setUploadedFiles({ weekMenu: null, fda: null, ingredients: null, allergenFile: null });
      setProgress(100);
      setStep('');
      alert(`✅ Published ${finalItems.length} menu items successfully!`);
    } catch (err) {
      console.error('Upload error details:', err);
      let errorMsg = err.message;
      if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        errorMsg = 'Network error: Please check your internet connection and try again.';
      }
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setPublishing(false);
      setProgress(0);
      setStep('');
    }
  };

  const baseSlots = [
    {
      key: 'weekMenu',
      label: '1. Week Menu PDF',
      desc: 'Menu items with recipe numbers',
      icon: Calendar,
      accept: '.pdf',
    },
    {
      key: 'fda',
      label: '2. FDA Nutrition File',
      desc: 'PDF with nutrition data',
      icon: Sparkles,
      accept: '.pdf',
    },
    {
      key: 'ingredients',
      label: '3. Ingredients CSV',
      desc: 'CSV matched by recipe number',
      icon: FileText,
      accept: '.csv',
    },
  ];

  const slots = canManageAllergens
    ? [
        ...baseSlots,
        {
          key: 'allergenFile',
          label: '4. Allergen File',
          desc: 'PDF/CSV with allergen info by recipe #',
          icon: AlertTriangle,
          accept: '.csv,.pdf',
        },
      ]
    : baseSlots;

  const anyUploaded = Object.values(uploadedFiles).some(Boolean);

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <Upload className="w-4 h-4 text-teal-600" /> Weekly Menu Sync
        </h3>
        <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
          {menuItems.length} Items Loaded
        </span>
      </div>

      {/* File slots */}
      <div className="space-y-3">
        {slots.map(slot => {
          const isUploading = uploading === slot.key;
          const uploaded = uploadedFiles[slot.key];
          return (
            <div key={slot.key}>
              <input
                type="file"
                accept={slot.accept}
                id={`upload-${slot.key}`}
                className="hidden"
                disabled={isUploading || publishing}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  handleFileSelect(slot.key, file);
                }}
              />
              <label
                htmlFor={`upload-${slot.key}`}
                className={`w-full p-5 border-2 border-dashed rounded-2xl flex items-center gap-4 transition cursor-pointer ${
                  uploaded
                    ? 'border-green-300 bg-green-50'
                    : 'border-teal-100 hover:bg-teal-50'
                } ${isUploading || publishing ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <Loader2 className="animate-spin w-6 h-6 text-teal-600 shrink-0" />
                ) : uploaded ? (
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-100 shrink-0">
                    {React.createElement(slot.icon, { className: "w-5 h-5 text-teal-600" })}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-800">
                    {slot.label}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {uploaded ? `✓ ${uploaded.name}` : slot.desc}
                  </div>
                </div>
                {uploaded && !isUploading && (
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setUploadedFiles(prev => ({ ...prev, [slot.key]: null })); }}
                    className="p-1 text-gray-400 hover:text-red-500 transition shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </label>
            </div>
          );
        })}
      </div>

      {/* Status / progress */}
      {publishing ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-teal-700">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-bold">{step}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleProcessAndPublish}
          disabled={!anyUploaded}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Process & Publish Menu
        </button>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
        <div className="font-bold mb-1 flex items-center gap-2">
          <Info className="w-4 h-4" /> How it works
        </div>
        <ul className="space-y-1 text-blue-700 list-disc list-inside">
          <li>Week Menu PDF extracts item names, recipe #s, stations, and days</li>
          <li>FDA file matches nutrition data by recipe number</li>
          <li>Ingredients CSV merges ingredient lists and dietary tags</li>
          <li>Missing descriptions are auto-generated by AI</li>
          {canManageAllergens && (
            <li>Allergen File extracts allergens by recipe number (Admin/Dietitian only)</li>
          )}
        </ul>
      </div>
    </div>
  );
}