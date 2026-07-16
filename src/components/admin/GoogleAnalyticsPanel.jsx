import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, Users, MousePointerClick, Eye, Clock, RefreshCw, AlertTriangle, Activity,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const LS_KEY = 'ga_property_id';
const LS_DAYS_KEY = 'ga_days_range';
const RANGES = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
];

function formatGADate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  const y = parseInt(yyyymmdd.slice(0, 4));
  const m = parseInt(yyyymmdd.slice(4, 6));
  const d = parseInt(yyyymmdd.slice(6, 8));
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDuration(sec) {
  if (!sec || sec < 1) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function GoogleAnalyticsPanel() {
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [draftId, setDraftId] = useState(propertyId);
  const [days, setDays] = useState(() => {
    const saved = parseInt(localStorage.getItem(LS_DAYS_KEY));
    return RANGES.some((r) => r.value === saved) ? saved : 7;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchGA = async (id, rangeDays) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getAnalyticsMetrics', { propertyId: id, days: rangeDays });
      const d = res.data;
      if (d?.error) {
        if (d.error === 'Forbidden') {
          setError('Admins only.');
        } else if (d.error === 'Unauthorized') {
          setError('Please sign in as an admin to view analytics.');
        } else if (d.details && /permission|insufficient|does not have/i.test(d.details)) {
          setError('The connected Google account does not have access to this GA4 property. In Google Analytics, go to Admin → Property access management and add the Google account used to authorize this app as a Viewer (or re-authorize the connector with an account that already has access).');
        } else if (d.details) {
          setError(`Google Analytics: ${d.details.slice(0, 160)}`);
        } else {
          setError(d.error);
        }
        setData(null);
      } else {
        setData(d);
      }
    } catch {
      setError('Unable to reach the analytics service. Check your connection and try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (propertyId) fetchGA(propertyId, days); }, []);

  // Auto-refresh every 30s for real-time active users
  useEffect(() => {
    if (!propertyId) return;
    const interval = setInterval(() => fetchGA(propertyId, days), 30000);
    return () => clearInterval(interval);
  }, [propertyId, days]);

  const saveAndFetch = () => {
    const id = draftId.trim();
    setPropertyId(id);
    localStorage.setItem(LS_KEY, id);
    if (id) fetchGA(id, days);
  };

  const changeRange = (val) => {
    setDays(val);
    localStorage.setItem(LS_DAYS_KEY, String(val));
    if (propertyId) fetchGA(propertyId, val);
  };

  const kpis = data?.totals ? [
    { label: 'Active Users', value: data.totals.activeUsers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Sessions', value: data.totals.sessions, icon: MousePointerClick, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pageviews', value: data.totals.screenPageViews, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Session', value: fmtDuration(data.totals.avgSessionDuration), icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
  ] : [];

  const chartData = (data?.daily || []).map((d) => ({
    label: formatGADate(d.date),
    users: d.activeUsers,
    sessions: d.sessions,
  }));

  const daysLabel = RANGES.find((r) => r.value === data?.days)?.label || `Last ${days} Days`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" /> Google Analytics — {daysLabel}
        </h4>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => changeRange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            placeholder="GA4 Property ID (e.g. 123456789)"
            className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold w-56 outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={saveAndFetch} className="px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-700">Load</button>
          {data && <button onClick={() => fetchGA(propertyId, days)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg" aria-label="Refresh GA metrics"><RefreshCw className="w-4 h-4" /></button>}
        </div>
      </div>

      {data?.realtime && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 w-fit">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-base font-bold text-green-800 leading-none">{data.realtime.activeUsers}</span>
          <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Active Right Now</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-2">
                <div className={`${bg} p-2 rounded-lg shrink-0`}><Icon className={`w-4 h-4 ${color}`} /></div>
                <div>
                  <p className="text-lg font-bold text-slate-800 leading-none">{value}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Bar dataKey="users" fill="#0d9488" radius={[4, 4, 0, 0]} name="Active Users" />
                <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 text-xs uppercase tracking-widest py-8">
          Enter your GA4 Property ID to load engagement metrics
        </div>
      )}
    </div>
  );
}