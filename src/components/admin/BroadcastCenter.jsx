import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getCurrentLocationId } from '@/utils';
import { Send, Mail, Smartphone, Loader2, CheckCircle, Radio } from 'lucide-react';

export default function BroadcastCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ push: true, in_app: true, email: false });
  const [emails, setEmails] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const locationId = getCurrentLocationId();

  const fetchHistory = async () => {
    try {
      const items = await base44.entities.Broadcast.filter({}, '-created_date', 10);
      setHistory(items);
    } catch (_e) { /* ignore */ }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    const selectedChannels = Object.keys(channels).filter(k => channels[k]);
    if (selectedChannels.length === 0) return;

    setSending(true);
    setResult(null);
    try {
      const emailList = channels.email
        ? emails.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
        : [];
      const response = await base44.functions.invoke('sendBroadcast', {
        title,
        message,
        location_id: locationId,
        channels: selectedChannels,
        emails: emailList,
      });
      setResult(response.data);
      if (response.data?.success) {
        setTitle('');
        setMessage('');
        setEmails('');
        fetchHistory();
      }
    } catch (e) {
      setResult({ success: false, error: e.message });
    } finally {
      setSending(false);
    }
  };

  const toggleActive = async (item) => {
    await base44.entities.Broadcast.update(item.id, { active: !item.active });
    fetchHistory();
  };

  const channelToggles = [
    { key: 'push', label: 'Push Notification', icon: Smartphone, desc: 'Sent to all subscribed devices via OneSignal' },
    { key: 'in_app', label: 'In-App Banner', icon: Radio, desc: 'Shows a dismissible banner at the top of the menu' },
    { key: 'email', label: 'Email', icon: Mail, desc: 'Send to a comma-separated list of addresses' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <Send className="w-4 h-4 text-teal-600" /> Broadcast Center
        </h3>
        <p className="text-[10px] text-gray-400 mt-1">Send updates to users across push, in-app, and email.</p>
      </div>

      {/* Composer */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Notification Title"
          className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Your message..."
          className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500 resize-none h-24"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />

        {/* Channel Toggles */}
        <div className="space-y-2">
          {channelToggles.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setChannels(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${channels[key] ? 'border-teal-500 bg-teal-50' : 'border-gray-100 bg-white'}`}
            >
              <div className={`p-2 rounded-lg ${channels[key] ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${channels[key] ? 'text-teal-900' : 'text-gray-600'}`}>{label}</p>
                <p className="text-[10px] text-gray-400">{desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${channels[key] ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                {channels[key] && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* Email List */}
        {channels.email && (
          <textarea
            placeholder="Enter email addresses, separated by commas..."
            className="w-full p-4 border rounded-xl bg-gray-50 text-sm font-bold border-gray-100 outline-none focus:ring-2 focus:ring-teal-500 resize-none h-20"
            value={emails}
            onChange={e => setEmails(e.target.value)}
          />
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full bg-teal-600 text-white p-4 rounded-xl font-bold uppercase text-xs shadow-xl active:scale-95 transition-all tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : 'Send Broadcast'}
        </button>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-xl text-xs font-bold ${result.success ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
            {result.success ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Broadcast sent!</p>
                {result.results?.push?.success && <p className="text-[10px]">Push: {result.results.push.recipients || 0} recipients</p>}
                {result.results?.push && !result.results.push.success && <p className="text-[10px]">Push failed: {result.results.push.error}</p>}
                {result.results?.in_app?.success && <p className="text-[10px]">In-App banner posted</p>}
                {result.results?.email?.success && <p className="text-[10px]">Email: {result.results.email.sent} sent, {result.results.email.failed} failed</p>}
              </div>
            ) : (
              <p>Error: {result.error}</p>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Recent Broadcasts</h4>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No broadcasts yet</p>
        ) : (
          <div className="space-y-2">
            {history.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-gray-700 truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{item.message}</p>
                  <div className="flex gap-1 mt-1">
                    {(item.channels || []).map(ch => (
                      <span key={ch} className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600">{ch}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(item)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${item.active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {item.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}