import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, Calendar, Heart, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const SUGGESTIONS = [
  { text: "What is for lunch on Thursday?", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  { text: "Which items are low in sodium?", icon: Heart, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/30" },
  { text: "Show me high protein options", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
  { text: "Any shellfish allergens?", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30" }
];

function FormattedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => (part.startsWith('**') && part.endsWith('**')) ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}
    </span>
  );
}

function VisualMessage({ content }) {
  const lines = content.split('\n').filter(l => l.trim());
  const menuItemPattern = /^[\d\*\-•]?\s*\*?\*?([A-Z][^(]+?)\*?\*?\s*[-–:]?\s*(\d+)\s*cal/i;
  const parsedItems = [];
  let currentItem = null;

  lines.forEach(line => {
    const match = line.match(menuItemPattern);
    if (match) {
      if (currentItem) parsedItems.push(currentItem);
      currentItem = { name: match[1].trim(), calories: parseInt(match[2]), protein: null, carbs: null, description: '' };
    } else if (currentItem) {
      const proteinMatch = line.match(/(\d+)g?\s*prot/i);
      const carbsMatch = line.match(/(\d+)g?\s*carb/i);
      if (proteinMatch) currentItem.protein = parseInt(proteinMatch[1]);
      if (carbsMatch) currentItem.carbs = parseInt(carbsMatch[1]);
      if (!proteinMatch && !carbsMatch && line.trim()) currentItem.description += (currentItem.description ? ' ' : '') + line.trim();
    }
  });
  if (currentItem) parsedItems.push(currentItem);

  if (parsedItems.length > 0) {
    return (
      <div className="space-y-3">
        {parsedItems.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
            <div className="p-4">
              <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base leading-tight mb-3">{item.name}</h4>
              {item.description && <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-3">{item.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 dark:bg-slate-600 rounded-xl border border-gray-100/50 dark:border-slate-500">
                <div><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cals</span></div>
                {item.protein && <div><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Prot</span></div>}
                {item.carbs && <div><span className="block text-sm font-bold text-gray-700 dark:text-gray-200">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Carb</span></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('**') || line.includes('**')) return <div key={i} className="font-bold text-slate-800 dark:text-slate-100 text-base mb-2"><FormattedText text={line} /></div>;
        if (line.startsWith('-') || line.startsWith('•')) return (
          <div key={i} className="flex items-start gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 text-sm">{line.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
        return <p key={i} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: "Hello! I am your Marketplace Assistant. How may I assist your choices today?" }]);
  const [userQuery, setUserQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
    initialData: [],
  });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isTyping]);

  const handleSendChat = async (overrideText = null) => {
    const textToSend = overrideText || userQuery;
    if (!textToSend.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: textToSend }]);
    setUserQuery('');
    setIsTyping(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful nutrition assistant for a corporate cafeteria. Context Menu: ${JSON.stringify(menuItems)}. User question: ${textToSend}. Provide helpful, concise answers about the menu items, nutrition, allergens, etc.`
      });
      if (response) setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please check the menu directly for nutrition information!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-50 dark:bg-slate-950 z-40"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))', overscrollBehaviorY: 'none' }}>
      <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ overscrollBehaviorY: 'none' }}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm font-medium ${msg.role === 'user' ? 'bg-teal-800 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-slate-700'}`}>
              {msg.role === 'user' ? <p className="text-sm leading-relaxed">{msg.content}</p> : <VisualMessage content={msg.content} />}
            </div>
            {msg.role === 'ai' && idx === 0 && (
              <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-[85%] animate-in slide-in-from-bottom-2 duration-500">
                {SUGGESTIONS.map((s, i) => {
                  const IconComp = s.icon;
                  return (
                    <button key={i} onClick={() => handleSendChat(s.text)} className="text-left p-4 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all flex items-center gap-3 group shadow-sm active:scale-95">
                      <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><IconComp className="w-4 h-4" /></div>
                      <span className="flex-1 font-bold">{s.text}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 ml-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 inline-flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Smart Menu IQ...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-20" />
      </div>
      <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 p-4 flex gap-3 shrink-0"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom) + 4rem)' }}>
        <input
          type="text" value={userQuery}
          onChange={e => setUserQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendChat()}
          className="flex-1 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm tracking-tight dark:text-white dark:placeholder-slate-400"
          placeholder="Ask about nutrition, allergens, menu items..."
        />
        <button onClick={() => handleSendChat()} className="bg-teal-800 dark:bg-teal-600 text-white p-4 rounded-xl shadow-lg active:scale-90 transition-all hover:bg-teal-900">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}