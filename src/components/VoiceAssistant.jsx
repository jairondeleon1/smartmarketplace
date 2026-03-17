import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Upload } from 'lucide-react';
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

const GREETING = "Hi, I'm Michelle! What can I help you with today?";
const STORAGE_KEY = 'michelle_avatar_url';
const DEFAULT_AVATAR = 'https://media.base44.com/images/public/698cee888040f55d6a3c5040/043a5423a_generated_image.png';

// Default cartoon Michelle SVG avatar
function DefaultAvatar({ phase }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Hair */}
      <ellipse cx="50" cy="38" rx="28" ry="30" fill="#4a2c0a" />
      {/* Face */}
      <ellipse cx="50" cy="50" rx="22" ry="24" fill="#f9c89b" />
      {/* Eyes */}
      <ellipse cx="42" cy="46" rx="3.5" ry="4" fill="#2d1a0e" />
      <ellipse cx="58" cy="46" rx="3.5" ry="4" fill="#2d1a0e" />
      {/* Eye shine */}
      <circle cx="43.5" cy="44.5" r="1.2" fill="white" />
      <circle cx="59.5" cy="44.5" r="1.2" fill="white" />
      {/* Eyebrows */}
      <path d="M38 41 Q42 39 46 41" stroke="#4a2c0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M54 41 Q58 39 62 41" stroke="#4a2c0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="50" cy="53" rx="2" ry="1.5" fill="#e8a87c" />
      {/* Mouth - changes by phase */}
      {phase === 'speaking' ? (
        <ellipse cx="50" cy="60" rx="6" ry="4" fill="#c0392b" />
      ) : phase === 'listening' ? (
        <path d="M44 59 Q50 63 56 59" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M44 59 Q50 64 56 59" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* Cheeks */}
      <ellipse cx="37" cy="57" rx="5" ry="3.5" fill="#f4a0a0" opacity="0.5" />
      <ellipse cx="63" cy="57" rx="5" ry="3.5" fill="#f4a0a0" opacity="0.5" />
      {/* Hair highlights */}
      <ellipse cx="35" cy="35" rx="8" ry="14" fill="#5c3610" opacity="0.6" transform="rotate(-15 35 35)" />
      {/* Outfit */}
      <path d="M28 80 Q30 70 50 68 Q70 70 72 80 L75 100 L25 100 Z" fill="#7c3aed" />
      {/* Collar */}
      <path d="M42 68 L50 78 L58 68" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function VoiceAssistant({ menuItems = [] }) {
  const [phase, setPhase] = useState('idle');
  const [history, setHistory] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_AVATAR);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const recRef = useRef(null);
  const mutedRef = useRef(false);
  const historyRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => { historyRef.current = history; }, [history]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setShowUploadHint(false);
    try {
      // Use AI to cartoonify the image
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const cartoonResult = await base44.integrations.Core.GenerateImage({
        prompt: 'Convert this photo into a friendly, cute cartoon avatar with big expressive eyes, soft round features, vibrant colors, and a cheerful smile. Style: Pixar/Disney 3D cartoon character, clean background.',
        existing_image_urls: [uploadResult.file_url]
      });
      const url = cartoonResult.url;
      setAvatarUrl(url);
      localStorage.setItem(STORAGE_KEY, url);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const startListening = useCallback(() => {
    stopSpeaking();
    const rec = createRecognition();
    if (!rec) { alert('Speech recognition requires Chrome or Safari.'); return; }
    recRef.current = rec;
    setPhase('listening');

    rec.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!transcript) { setPhase('idle'); return; }

      setPhase('processing');
      stopSpeaking();

      try {
        const slimMenu = menuItems.slice(0, 40).map(({ name, day, station, calories, protein, allergens, tags }) => ({
          name, day, station, calories, protein, allergens, tags
        }));

        const pastTurns = historyRef.current.slice(-6).map(m =>
          `${m.role === 'user' ? 'User' : 'Michelle'}: ${m.content}`
        ).join('\n');

        const response = await base44.integrations.Core.InvokeLLM({
          model: 'gpt_5_mini',
          prompt: `You are Michelle, a friendly voice assistant for a corporate cafe. Answer in 1-2 short sentences max, no markdown, no lists, speak naturally. Remember the conversation context.
Menu: ${JSON.stringify(slimMenu)}
${pastTurns ? `Conversation so far:\n${pastTurns}\n` : ''}User: "${transcript}"`
        });

        const aiText = typeof response === 'string' ? response : "I'm not sure about that one. Try asking about today's specials!";
        setHistory(prev => [...prev, { role: 'user', content: transcript }, { role: 'ai', content: aiText }]);

        setPhase('speaking');
        speak(aiText, {
          muted: mutedRef.current,
          onEnd: () => {
            setPhase('idle');
            setTimeout(() => {
              if (recRef.current !== null) startListening();
            }, 400);
          }
        });
      } catch {
        setPhase('idle');
      }
    };

    rec.onend = () => { if (recRef.current) setPhase('idle'); };
    rec.onerror = () => setPhase('idle');
    rec.start();
  }, [menuItems]);

  const stopAll = useCallback(() => {
    stopSpeaking();
    recRef.current?.stop();
    recRef.current = null;
    setPhase('idle');
  }, []);

  const handleClick = () => {
    if (phase === 'listening' || phase === 'speaking' || phase === 'processing') {
      stopAll();
      return;
    }
    if (phase === 'idle') {
      setPhase('greeting');
      speak(GREETING, {
        muted: mutedRef.current,
        onEnd: () => startListening()
      });
    }
  };

  const isActive = phase !== 'idle';

  // Phase-based animation styles
  const avatarAnimation =
    phase === 'listening'
      ? 'animate-bounce'
      : phase === 'speaking' || phase === 'greeting'
      ? 'scale-110'
      : phase === 'processing'
      ? 'animate-pulse'
      : 'hover:scale-110';

  const glowStyle =
    phase === 'listening'
      ? '0 0 0 4px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.4)'
      : phase === 'speaking' || phase === 'greeting'
      ? '0 0 0 4px rgba(139,92,246,0.6), 0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(139,92,246,0.3)'
      : phase === 'processing'
      ? '0 0 0 4px rgba(245,158,11,0.5), 0 0 20px rgba(245,158,11,0.3)'
      : '0 0 0 3px rgba(52,211,153,0.4), 0 0 12px rgba(52,211,153,0.2)';

  const statusLabel =
    phase === 'listening' ? '🎤 Listening...'
    : phase === 'speaking' ? '🔊 Speaking...'
    : phase === 'greeting' ? '👋 Hi!'
    : phase === 'processing' ? '💭 Thinking...'
    : '💬 Tap Michelle';

  return (
    <div
      className="fixed z-[60] flex flex-col items-center gap-1.5"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', right: '1rem' }}
    >
      {/* Status label */}
      <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full transition-all duration-300 ${
        phase === 'listening' ? 'bg-red-100 text-red-600' :
        phase === 'speaking' || phase === 'greeting' ? 'bg-violet-100 text-violet-700' :
        phase === 'processing' ? 'bg-amber-100 text-amber-700' :
        'bg-white/80 text-slate-500 shadow-sm'
      }`}>
        {statusLabel}
      </div>

      {/* Avatar button */}
      <button
        onClick={handleClick}
        aria-label="Voice Assistant - Michelle"
        className={`relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 active:scale-95 overflow-hidden ${avatarAnimation}`}
        style={{ boxShadow: glowStyle }}
      >
        {isUploading ? (
          <div className="w-full h-full bg-violet-700 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        ) : (
          <img src={avatarUrl} alt="Michelle" className="w-full h-full object-cover object-top" />
        )}

        {/* Ripple rings when listening */}
        {phase === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
            <span className="absolute -inset-2 rounded-full border-2 border-red-400 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
          </>
        )}

        {/* Glow pulse when speaking */}
        {(phase === 'speaking' || phase === 'greeting') && (
          <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-15" />
        )}
      </button>

      {/* Upload photo button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-5 h-5 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center hover:bg-slate-50 transition"
        aria-label="Upload avatar photo"
        title="Replace with your own cartoon photo"
      >
        <Upload className="w-2.5 h-2.5 text-slate-400" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
    </div>
  );
}