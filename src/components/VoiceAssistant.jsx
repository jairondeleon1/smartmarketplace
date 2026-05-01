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
const DEFAULT_AVATAR = 'https://media.base44.com/images/public/698cee888040f55d6a3c5040/553685004_b87fc78a5_generated_image.png';


export default function VoiceAssistant({ menuItems = [] }) {
  const [phase, setPhase] = useState('idle');
  const [history, setHistory] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_AVATAR);
  const [isUploading, setIsUploading] = useState(false);
  const recRef = useRef(null);
  const mutedRef = useRef(false);
  const historyRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => { historyRef.current = history; }, [history]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);

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

      // Only say a search acknowledgment for actual menu/food questions, not conversational phrases
      const isConversational = /^(thank|thanks|thank you|ok|okay|cool|great|got it|bye|goodbye|hello|hi|hey|awesome|perfect|sure|no|yes|nope|yep|yup|alright|sounds good)/i.test(transcript.trim());
      const isAllergenQuestion = /allergen|allergy|allergic|contains|ingredient/i.test(transcript);
      if (!isConversational && !isAllergenQuestion) {
        const acks = ["Let me check the menu for you!", "One moment!", "Looking that up for you!"];
        const ack = acks[Math.floor(Math.random() * acks.length)];
        speak(ack, { muted: mutedRef.current });
      }

      try {
        // Only send top 20 items and minimal fields to reduce payload
        const slimMenu = menuItems.slice(0, 20).map(({ name, day, station, calories, allergens, tags }) => ({
          name, day, station, calories, allergens, tags
        }));

        const pastTurns = historyRef.current.slice(-4).map(m =>
          `${m.role === 'user' ? 'U' : 'M'}: ${m.content}`
        ).join('\n');

        const response = await base44.integrations.Core.InvokeLLM({
          model: 'gpt_5_mini',
          prompt: `You are Michelle, cafe voice assistant. Reply in 1 short sentence, no markdown.
Menu: ${JSON.stringify(slimMenu)}
${pastTurns ? `Context:\n${pastTurns}\n` : ''}IMPORTANT: If the user asks about allergens or allergen information, always say: "For allergen information, please contact one of the Ingredient Ambassadors in the Marketplace!" and nothing else about allergens.
U: "${transcript}"`
        });

        const aiText = typeof response === 'string' ? response : "Try asking about today's specials!";
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

    rec.onend = () => {
      // Only reset to idle if we're still in listening phase — don't interrupt processing/speaking
      setPhase(prev => prev === 'listening' ? 'idle' : prev);
    };
    rec.onerror = () => setPhase(prev => prev === 'listening' ? 'idle' : prev);
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
    : phase === 'processing' ? '🔍 Looking it up...'
    : '💬 Talk to Michelle';

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