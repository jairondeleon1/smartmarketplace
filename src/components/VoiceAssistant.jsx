import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// --- Inworld TTS via backend ---
let currentAudio = null;

async function speak(text, { onEnd, muted } = {}) {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (muted) { onEnd?.(); return; }

  try {
    const response = await base44.functions.invoke('inworldTTS', { text });
    const audioContent = response?.data?.audioContent;
    if (!audioContent) throw new Error('No audio returned');

    const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
    currentAudio = audio;
    audio.onended = () => { currentAudio = null; onEnd?.(); };
    audio.onerror = () => { currentAudio = null; onEnd?.(); };
    await audio.play();
  } catch {
    // Fallback to browser TTS if Inworld fails
    const utt = new SpeechSynthesisUtterance(text.replace(/[*_~`#]/g, '').trim().slice(0, 500));
    utt.rate = 0.97;
    utt.onend = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utt);
  }
}

function stopSpeaking() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  window.speechSynthesis.cancel();
}

// --- Speech Recognition ---
function createRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = 'en-US';
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.continuous = false;
  return r;
}

// --- Bubble ---
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-md">
          <Volume2 className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'bg-teal-600 text-white rounded-tr-sm font-medium'
          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm font-medium'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

// --- Listening animation ---
function ListeningWave() {
  return (
    <div className="flex items-end gap-1 h-8">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-red-400"
          style={{
            height: `${Math.random() * 20 + 8}px`,
            animation: `wave 0.8s ease-in-out ${i * 0.12}s infinite alternate`
          }}
        />
      ))}
      <style>{`@keyframes wave { from { transform: scaleY(0.4); } to { transform: scaleY(1.4); } }`}</style>
    </div>
  );
}

export default function VoiceAssistant({ menuItems = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | listening | processing | speaking
  const [conversation, setConversation] = useState([
    { role: 'ai', content: "Hi! I'm Michelle, your Marketplace assistant. Tap the mic to start — ask me anything about the menu, nutrition, or allergens!" }
  ]);
  const scrollRef = useRef(null);
  const recRef = useRef(null);
  const mutedRef = useRef(isMuted);

  // Keep mutedRef in sync
  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation, phase]);

  const startListening = useCallback(() => {
    stopSpeaking();
    const rec = createRecognition();
    if (!rec) { alert('Speech recognition requires Chrome or Safari.'); return; }
    recRef.current = rec;
    setPhase('listening');

    rec.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!transcript) { setPhase('idle'); return; }

      setConversation(prev => [...prev, { role: 'user', content: transcript }]);
      setPhase('processing');
      stopSpeaking();

      try {
        const slimMenu = menuItems.slice(0, 60).map(({ name, day, station, calories, protein, carbs, fat, sodium, allergens, tags }) => ({
          name, day, station, calories, protein, carbs, fat, sodium, allergens, tags
        }));
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Michelle, a warm and friendly voice nutrition assistant for a corporate Marketplace cafe. 
Keep your answer conversational, under 50 words, no bullet points, no markdown, no asterisks — speak naturally as if talking.
Menu context: ${JSON.stringify(slimMenu)}.
User said: "${transcript}"`
        });
        const aiText = typeof response === 'string' ? response : "I'm not sure about that one. Try asking about today's specials or any nutrition info!";
        setConversation(prev => [...prev, { role: 'ai', content: aiText }]);
        setPhase('speaking');
        speak(aiText, {
          muted: mutedRef.current,
          onEnd: () => {
            setPhase('idle');
            // Auto-restart listening for hands-free conversation
            setTimeout(() => {
              if (recRef.current !== null) startListening();
            }, 400);
          }
        });
      } catch {
        const err = "Sorry, I'm having trouble right now. Please try again!";
        setConversation(prev => [...prev, { role: 'ai', content: err }]);
        setPhase('idle');
      }
    };

    rec.onend = () => {
      if (phase === 'listening') setPhase('idle');
    };
    rec.onerror = () => setPhase('idle');
    rec.start();
  }, [menuItems, phase]);

  const stopAll = useCallback(() => {
    stopSpeaking();
    recRef.current?.stop();
    recRef.current = null;
    setPhase('idle');
  }, []);

  const handleMicClick = () => {
    if (phase === 'listening') { stopAll(); return; }
    if (phase === 'speaking') { stopAll(); return; }
    startListening();
  };

  const handleClose = () => {
    stopAll();
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Auto-start listening when opened
    setTimeout(() => startListening(), 600);
  };

  const micLabel = phase === 'listening' ? 'Tap to stop' : phase === 'speaking' ? 'Tap to interrupt' : phase === 'processing' ? 'Processing...' : 'Tap to speak';

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={handleOpen}
        aria-label="Open Voice Assistant"
        className="fixed z-[60] bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-full shadow-2xl p-4 transition-all hover:scale-110 active:scale-95"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', right: '1.25rem' }}
      >
        <Mic className="w-6 h-6" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div
            className="relative w-full sm:max-w-sm bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
            style={{ maxHeight: '75vh', minHeight: '400px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg ${phase === 'speaking' ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900' : ''}`}>
                  <Volume2 className="w-4 h-4 text-white" />
                  {phase === 'speaking' && <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-25" />}
                </div>
                <div>
                  <p className="font-bold text-white text-xs uppercase tracking-widest">Michelle</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {phase === 'listening' ? '🔴 Listening...' : phase === 'speaking' ? '🔊 Speaking...' : phase === 'processing' ? '⏳ Thinking...' : '✨ Voice Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIsMuted(m => !m); if (!isMuted) window.speechSynthesis.cancel(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-800/50">
              {conversation.map((msg, i) => <Bubble key={i} msg={msg} />)}
              {phase === 'processing' && (
                <div className="flex justify-start mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: `${i*150}ms`}} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mic area */}
            <div className="px-5 py-5 border-t border-white/10 shrink-0 flex flex-col items-center gap-3 bg-slate-900"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
              {phase === 'listening' && <ListeningWave />}
              <button
                onClick={handleMicClick}
                disabled={phase === 'processing'}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  phase === 'listening'
                    ? 'bg-red-500 ring-4 ring-red-400/40 ring-offset-2 ring-offset-slate-900'
                    : phase === 'speaking'
                    ? 'bg-violet-600 ring-4 ring-violet-400/40 ring-offset-2 ring-offset-slate-900'
                    : 'bg-gradient-to-br from-violet-500 to-purple-700 hover:scale-105'
                }`}
              >
                {phase === 'listening' ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
                {phase === 'listening' && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />}
              </button>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{micLabel}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}