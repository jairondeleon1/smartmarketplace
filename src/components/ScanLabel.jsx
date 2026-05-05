import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ScanLine, Search, Loader2, AlertCircle, ChevronDown, ChevronUp, Barcode, Camera, CheckCircle, ArrowLeft, Upload, Sparkles } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { base44 } from '@/api/base44Client';
import ProductResult from './scan/ProductResult';
import AddProductFlow from './scan/AddProductFlow';

// --- Barcode Scanner ---
function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current,
      (result, err) => {
        if (result) {
          codeReader.reset();
          onDetected(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          setError('Camera error: ' + err.message);
        }
      }
    ).catch(() => {
      setError('Camera access denied. Please allow camera permission or use manual entry below.');
    });

    return () => { codeReader.reset(); };
  }, [onDetected]);

  return (
    <div className="flex flex-col items-center gap-4 p-5">
      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 text-center">{error}</div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-32">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-teal-400/60 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      {!error && (
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center">Point camera at barcode</p>
      )}
    </div>
  );
}

export default function ScanLabel({ onClose }) {
  const [phase, setPhase] = useState('scan'); // scan | loading | result | unknown | adding
  const [manualBarcode, setManualBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const lookup = useCallback(async (barcode) => {
    setCurrentBarcode(barcode);
    setPhase('loading');
    try {
      // Check our own database first
      const existing = await base44.entities.ScannedProduct.filter({ barcode });
      if (existing && existing.length > 0) {
        setProduct(existing[0]);
        setPhase('result');
        return;
      }
      // Not found → ask user to add it
      setPhase('unknown');
    } catch {
      setPhase('unknown');
    }
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) lookup(manualBarcode.trim());
  };

  const handleProductAdded = (savedProduct) => {
    setProduct(savedProduct);
    setPhase('result');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ height: '92dvh', maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between shrink-0 rounded-t-[2.5rem] sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            {(phase === 'unknown' || phase === 'adding') && (
              <button onClick={() => setPhase('scan')} className="p-1 hover:bg-white/10 rounded-full transition">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <Barcode className="w-5 h-5 text-teal-400" />
            <h3 className="text-white font-bold text-base uppercase tracking-widest">
              {phase === 'result' ? 'Product Score' : phase === 'unknown' ? 'Unknown Product' : phase === 'adding' ? 'Add Product' : 'Scan Barcode'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

          {phase === 'scan' && (
            <div>
              <CameraScanner onDetected={lookup} />
              <div className="px-5 pb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">or enter barcode manually</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 0123456789012"
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                    value={manualBarcode}
                    onChange={e => setManualBarcode(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition">
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Looking up product...</p>
            </div>
          )}

          {phase === 'unknown' && (
            <div className="flex flex-col items-center justify-center py-12 px-6 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Barcode className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-black text-gray-900">Unknown Product</p>
                <p className="text-sm text-gray-400 mt-1">Barcode: {currentBarcode}</p>
                <p className="text-sm text-gray-500 mt-3">This product isn't in our database yet. Help the community by adding it!</p>
              </div>
              <button
                onClick={() => setPhase('adding')}
                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Fill in the information
              </button>
              <button onClick={() => setPhase('scan')} className="text-sm text-gray-400 font-bold">
                Scan a different product
              </button>
            </div>
          )}

          {phase === 'adding' && (
            <AddProductFlow
              barcode={currentBarcode}
              onComplete={handleProductAdded}
              onCancel={() => setPhase('scan')}
            />
          )}

          {phase === 'result' && product && (
            <div className="pb-6">
              <ProductResult product={product} />
              <div className="px-5 pt-2">
                <button onClick={() => { setPhase('scan'); setProduct(null); }}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition flex items-center justify-center gap-2">
                  <ScanLine className="w-4 h-4" /> Scan Another
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}