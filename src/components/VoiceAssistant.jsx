import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
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

export default function VoiceAssistant({ menuItems = [] }) {
  const [phase, setPhase] = useState('idle'); // idle | greeting | listening | processing | speaking
  const recRef = useRef(null);
  const mutedRef = useRef(false);

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
        // Minimal menu context — only what's needed for fast LLM response
        const slimMenu = menuItems.slice(0, 40).map(({ name, day, station, calories, protein, allergens, tags }) => ({
          name, day, station, calories, protein, allergens, tags
        }));

        // Kick off LLM and TTS in the fastest path possible
        const response = await base44.integrations.Core.InvokeLLM({
          model: 'gpt_5_mini',
          prompt: `You are Michelle, a friendly voice assistant for a corporate cafe. Answer in 1-2 short sentences max, no markdown, no lists, speak naturally. Menu: ${JSON.stringify(slimMenu)}. User: "${transcript}"`
        });

        const aiText = typeof response === 'string' ? response : "I'm not sure about that one. Try asking about today's specials!";
        setPhase('speaking');

        // Start TTS immediately
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

  const handleMicClick = () => {
    if (phase === 'listening' || phase === 'speaking' || phase === 'processing') {
      stopAll();
      return;
    }
    if (phase === 'idle') {
      // First click: Michelle greets then starts listening
      setPhase('greeting');
      speak(GREETING, {
        muted: mutedRef.current,
        onEnd: () => startListening()
      });
    }
  };

  const icon = phase === 'listening'
    ? <MicOff className="w-6 h-6" />
    : phase === 'processing' || phase === 'greeting'
    ? <Loader2 className="w-6 h-6 animate-spin" />
    : <Mic className="w-6 h-6" />;

  const isActive = phase !== 'idle';

  return (
    <button
      onClick={handleMicClick}
      aria-label="Voice Assistant"
      className={`fixed z-[60] text-white rounded-full shadow-2xl p-4 transition-all hover:scale-110 active:scale-95 ${
        phase === 'listening'
          ? 'bg-red-500 ring-4 ring-red-400/40'
          : phase === 'speaking'
          ? 'bg-violet-600 ring-4 ring-violet-400/40'
          : 'bg-gradient-to-br from-violet-600 to-purple-700'
      }`}
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', right: '1.25rem' }}
    >
      {icon}
      {phase === 'listening' && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />}
      {!isActive && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />}
    </button>
  );
}