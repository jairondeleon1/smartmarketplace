import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function TrayDetailsModal({ isOpen, onClose, plate, setPlate }) {
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
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('SmartMenu IQ', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`NUTRITION SUMMARY • ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

    pdf.setTextColor(30, 41, 59);
    let yPos = 55;

    pdf.setFillColor(6, 95, 70);
    pdf.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('MEALS FOR THE WEEK', 25, yPos + 2);
    yPos += 12;

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    plate.forEach(item => {
      if (yPos > 270) { pdf.addPage(); yPos = 20; }
      pdf.setFont(undefined, 'bold');
      pdf.text(item.name, 25, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Station: ${item.station || 'N/A'}`, 25, yPos + 5);
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${item.calories} CAL`, pageWidth - 20, yPos, { align: 'right' });
      pdf.setDrawColor(241, 245, 249);
      pdf.line(25, yPos + 7, pageWidth - 20, yPos + 7);
      yPos += 15;
    });

    yPos += 10;
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFillColor(249, 250, 251);
    pdf.rect(20, yPos, pageWidth - 40, 30, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(6, 95, 70);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans font-medium">
      <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-900 dark:bg-slate-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-teal-400" />
            <h3 className="font-bold text-xl uppercase tracking-tight">My Nutrition Tray</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showSuccess && <div className="bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 p-4 rounded-xl text-xs font-bold border border-teal-100 dark:border-teal-800 flex items-center gap-2 animate-in fade-in">Report Exported Successfully!</div>}
          {plate.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold uppercase text-sm tracking-widest">Your tray is empty</div>
          ) : (
            <>
              <h4 className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400 mb-3">Meals for the Week</h4>
              <div className="space-y-2">
                {plate.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 group">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate uppercase">{item.name}</p>
                      <div className="flex gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>{item.calories} Cal</span>
                        <span>{item.protein}g Prot</span>
                        {item.station && <span>• {item.station}</span>}
                      </div>
                    </div>
                    <button onClick={() => setPlate(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {plate.length > 0 && (
          <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 space-y-4 shrink-0">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[['Cals', totals.calories], ['Prot', `${totals.protein}g`], ['Carbs', `${totals.carbs}g`], ['Sod', `${totals.sodium}mg`]].map(([label, val]) => (
                <div key={label} className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{val}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
                </div>
              ))}
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