import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Upload, Loader2, CheckCircle, XCircle, Sparkles,
  Calendar, FileText, Info
} from 'lucide-react';

export default function MenuUploadPanel({ menuItems, onPublish }) {
  const [uploadedFiles, setUploadedFiles] = useState({ weekMenu: null, fda: null, ingredients: null });
  const [uploading, setUploading] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (slotKey, file) => {
    if (!file) return;
    setUploading(slotKey);
    try {
      let text = '';
      if (file.name.endsWith('.csv')) {
        // CSV — read as text directly
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
      } else {
        // PDF — convert to base64 and upload via backend function
        const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        
        const uploadRes = await base44.functions.invoke('uploadMenuFile', {
          fileBase64,
          fileName: file.name,
          mimeType: file.type
        });
        
        const fileUrl = uploadRes?.data?.file_url;
        if (!fileUrl) {
          throw new Error('Upload failed - no file URL returned');
        }
        
        text = fileUrl;
      }
      if (!text || text.trim().length === 0) throw new Error('File upload failed');
      setUploadedFiles(prev => ({ ...prev, [slotKey]: { text, name: file.name } }));
    } catch (err) {
      console.error('Upload error:', err);
      alert(`❌ ${slotKey} upload failed: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleProcessAndPublish = async () => {
    const { weekMenu, fda, ingredients } = uploadedFiles;
    if (!weekMenu && !fda && !ingredients) {
      alert('Please upload at least one file first.');
      return;
    }

    setPublishing(true);
    setProgress(0);

    try {
      setStep('Processing all files with AI...');
      setProgress(50);

      // Call backend function to process all files with a single LLM call
      const result = await base44.functions.invoke('processMenuFiles', {
        weekMenuUrl: weekMenu?.text,
        fdaUrl: fda?.text,
        ingredientsData: ingredients?.text
      });

      const finalItems = result.data?.items || [];

      setProgress(95);
      setStep('Publishing menu...');

      await onPublish(finalItems);

      setUploadedFiles({ weekMenu: null, fda: null, ingredients: null });
      setProgress(100);
      setStep('');
      alert(`✅ Published ${finalItems.length} menu items successfully!`);
    } catch (err) {
      console.error('Publish error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setPublishing(false);
      setProgress(0);
      setStep('');
    }
  };

  const slots = [
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
          <li>AI combines all data into complete menu items</li>
        </ul>
      </div>
    </div>
  );
}