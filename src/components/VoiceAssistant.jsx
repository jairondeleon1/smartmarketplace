import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const INWORLD_VOICE = 'default-i-eyv3zmlf9hyqv3c7jmsg__michelle';
const INWORLD_TTS_URL = 'https://studio.api.inworld.ai/v1/ai/tts';

// --- Inworld TTS ---
async function speakWithInworld(text, inworldKey) {
  if (!inworldKey || !text) return null;
  const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/#{1,6}\s/g, '').trim().slice(0, 800);
  const res = await fetch(INWORLD_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${inworldKey}` },
    body: JSON.stringify({ text: cleanText, voiceName: INWORLD_VOICE, audioConfig: { audioEncoding: 'MP3' } })
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.audioContent) return null;
  const binary = atob(data.audioContent);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

// --- Speech Recognition ---
function useSpeechRecognition({ onResult, onEnd }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition is not supported in this browser. Try Chrome.'); return; }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => { setIsListening(false); onEnd(); };
    recognition.onerror = () => { setIsListening(false); onEnd(); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onResult, onEnd]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, start, stop };
}

// --- Conversation Bubble ---
function ConversationBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
          <Volume2 className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium shadow-sm ${
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function VoiceAssistant({ menuItems = [], inworldKey = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState([
    { role: 'ai', content: "Hi! I'm Michelle, your Marketplace voice assistant. Tap the mic and ask me anything about the menu, nutrition, or allergens!" }
  ]);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation, isProcessing]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    setIsSpeaking(false);
  }, []);

  const playTTS = useCallback(async (text) => {
    if (isMuted || !inworldKey) return;
    stopSpeaking();
    setIsSpeaking(true);
    const url = await speakWithInworld(text, inworldKey);
    if (!url) { setIsSpeaking(false); return; }
    audioUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setIsSpeaking(false); };
    audio.onerror = () => { setIsSpeaking(false); };
    audio.play().catch(() => setIsSpeaking(false));
  }, [isMuted, inworldKey, stopSpeaking]);

  const handleVoiceResult = useCallback(async (transcript) => {
    if (!transcript.trim()) return;
    setConversation(prev => [...prev, { role: 'user', content: transcript }]);
    setIsProcessing(true);
    stopSpeaking();
    try {
      const slimMenu = menuItems.slice(0, 60).map(({ name, day, station, calories, protein, carbs, fat, sodium, allergens, tags }) => ({
        name, day, station, calories, protein, carbs, fat, sodium, allergens, tags
      }));
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Michelle, a friendly voice nutrition assistant for a corporate Marketplace cafe. Keep your answer under 60 words and speak naturally (no bullet points, no markdown). Menu context: ${JSON.stringify(slimMenu)}. User question: "${transcript}"`
      });
      const aiText = typeof response === 'string' ? response : response?.content || "I'm not sure about that. Try asking about today's menu or nutrition info!";
      setConversation(prev => [...prev, { role: 'ai', content: aiText }]);
      await playTTS(aiText);
    } catch {
      const errMsg = "I'm having trouble connecting right now. Please try again!";
      setConversation(prev => [...prev, { role: 'ai', content: errMsg }]);
    } finally {
      setIsProcessing(false);
    }
  }, [menuItems, playTTS, stopSpeaking]);

  const { isListening, start: startListening, stop: stopListening } = useSpeechRecognition({
    onResult: handleVoiceResult,
    onEnd: () => {}
  });

  const handleMicClick = () => {
    if (isListening) { stopListening(); return; }
    if (isSpeaking) stopSpeaking();
    startListening();
  };

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Voice Assistant"
        className="fixed z-[60] bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl p-4 transition-all hover:scale-110 active:scale-95 border-4 border-white/30"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', right: '1.25rem' }}
      >
        <Mic className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
      </button>

      {/* Voice Assistant Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
            style={{ maxHeight: '80vh', minHeight: '420px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ${isSpeaking ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900 animate-pulse' : ''}`}>
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  {isSpeaking && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-ping" />}
                </div>
                <div>
                  <p className="font-bold text-white text-sm uppercase tracking-widest">Michelle</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isListening ? '🔴 Listening...' : isSpeaking ? '🔊 Speaking...' : isProcessing ? '⏳ Thinking...' : '✨ Voice Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsMuted(m => !m); if (!isMuted) stopSpeaking(); }} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {conversation.map((msg, i) => <ConversationBubble key={i} msg={msg} />)}
              {isProcessing && (
                <div className="flex justify-start mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-xs text-gray-500 font-medium">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mic Button Area */}
            <div className="p-5 border-t border-white/10 shrink-0 flex flex-col items-center gap-3">
              <button
                onClick={handleMicClick}
                disabled={isProcessing}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-500 scale-110 ring-4 ring-red-400/50 ring-offset-2 ring-offset-slate-800'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105'
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                )}
              </button>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                {isListening ? 'Tap to stop' : isProcessing ? 'Processing...' : 'Tap mic to speak'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}