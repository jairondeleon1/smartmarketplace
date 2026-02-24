import React from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, MessageSquare, Info } from 'lucide-react';

const POINTS = [
  {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Information, Not Advice',
    body: 'AI insights are for informational purposes only. Our AI is not a doctor or registered dietitian. Always verify ingredients with restaurant staff if you have a life-threatening allergy.'
  },
  {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Accuracy',
    body: 'AI can occasionally "hallucinate" or provide inaccurate data. Always cross-reference high-stakes nutritional info.'
  },
  {
    icon: ShieldCheck,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    title: 'Data Handling',
    body: 'Your chat is stored locally for your current session. We do not sell your conversations, but prompts are processed by third-party AI partners (like OpenAI or Google) to generate responses.'
  },
  {
    icon: MessageSquare,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Privacy',
    body: 'Avoid entering sensitive personal details (e.g., medical IDs or financial info) into the chat.'
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