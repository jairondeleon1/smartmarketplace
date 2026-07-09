import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Utensils, ScanLine, BarChart2, TrendingUp, Calendar, ShoppingBag, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import GoogleAnalyticsPanel from './GoogleAnalyticsPanel';

export default function AnalyticsDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [items, products] = await Promise.all([
        base44.entities.MenuItem.list('-created_date', 200),
        base44.entities.ScannedProduct.list('-created_date', 200),
      ]);
      setMenuItems(items || []);
      setScannedProducts(products || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  // Menu items by day
  const menuByDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special'].map(day => ({
    day,
    count: menuItems.filter(i => i.day === day).length,
  }));

  // Menu items by station
  const stationMap = {};
  menuItems.forEach(i => {
    const s = i.station || 'Other';
    stationMap[s] = (stationMap[s] || 0) + 1;
  });
  const menuByStation = Object.entries(stationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([station, count]) => ({ station, count }));

  // Scanned products by date (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const scansByDay = last7.map(date => {
    const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const count = scannedProducts.filter(p => {
      const pd = new Date(p.created_date);
      return pd.toDateString() === date.toDateString();
    }).length;
    return { label, count };
  });

  // Tags breakdown
  const tagMap = {};
  menuItems.forEach(i => (i.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; }));
  const tagBreakdown = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => ({ tag, count }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Analytics Overview</h3>
        </div>
        <button onClick={loadData} className="text-xs text-teal-600 font-bold uppercase tracking-widest hover:underline">Refresh</button>
      </div>

      <GoogleAnalyticsPanel />

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-xs text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <span>This dashboard shows menu and scan activity. For detailed visitor traffic analytics, contact your administrator to access the SmartMenuIQ Analytics dashboard.</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Menu Items', value: menuItems.length, icon: Utensils, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Products Scanned', value: scannedProducts.length, icon: ScanLine, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Unique Stations', value: Object.keys(stationMap).length, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Scans This Week', value: scansByDay.reduce((s, d) => s + d.count, 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
            <div className={`${bg} p-3 rounded-xl shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Label Scans This Week */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Label Scans — Last 7 Days
        </h4>
        {scannedProducts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8 font-bold uppercase tracking-widest">No scan data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scansByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Scans" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Menu Items by Day */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
          <Utensils className="w-4 h-4" /> Menu Items by Day
        </h4>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={menuByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700 }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Items" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Diet Tag Breakdown */}
      {tagBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Dietary Tag Breakdown
          </h4>
          <div className="space-y-3">
            {tagBreakdown.map(({ tag, count }) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 w-28 shrink-0 uppercase tracking-wide">{tag}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (count / menuItems.length) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}