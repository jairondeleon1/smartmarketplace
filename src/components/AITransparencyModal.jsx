import React from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, MessageSquare, Info } from 'lucide-react';

const POINTS = [
  {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'How Our AI Works',
    body: 'SmartMenuIQ uses large language models (LLMs) and prompt engineering to compare your dietary profile against menu databases — highlighting matches and potential risks. It is a decision-support tool, not a certified nutritionist or medical diagnostic tool. You maintain final responsibility for food choices.'
  },
  {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Accuracy & Allergy Warning',
    body: 'AI can occasionally "hallucinate" or provide outdated data. Menu formulations can change without notice, so our AI may not always reflect real-world kitchen practices. Always verify critical allergen information directly with an Ingredient Ambassador.'
  },
  {
    icon: ShieldCheck,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    title: 'Third-Party Processing & Anonymization',
    body: 'Your queries may be transmitted to third-party AI infrastructure providers to generate responses. We strip direct identifiers from your profile before sending prompts. We contractually request that providers do not use SmartMenuIQ prompts to train their future public models.'
  },
  {
    icon: MessageSquare,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Session Persistence & Privacy',
    body: 'SmartMenuIQ does not maintain a permanent, searchable database of your chat history. Once you clear your cache or end your session, conversational context is purged from active memory. Avoid entering sensitive personal details (e.g., medical IDs) into the chat.'
  }
];

export default function AITransparencyModal({ isOpen, onAccept }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg uppercase tracking-widest">AI Transparency Notice</h2>
              <p className="text-white/70 text-[11px] font-medium mt-0.5">SmartMenuIQ uses advanced AI to analyze menus and provide dietary insights.</p>
            </div>
          </div>
        </div>

        {/* Points */}
        <div className="p-6 space-y-3">
          {POINTS.map(({ icon: Icon, color, bg, title, body }) => (
            <div key={title} className={`flex gap-3 p-3 rounded-xl ${bg}`}>
              <div className={`mt-0.5 shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${color} mb-0.5`}>{title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onAccept}
            className="w-full py-4 bg-slate-900 text-white font-bold uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg hover:bg-black"
          >
            I Understand — Continue to AI Chat
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-3">
            By continuing, you acknowledge these terms. View our full <span className="text-teal-600 font-bold">Privacy Policy</span> in the footer.
          </p>
        </div>
      </div>
    </div>
  );
}