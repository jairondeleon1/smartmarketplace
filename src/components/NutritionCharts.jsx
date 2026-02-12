import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X, TrendingUp, PieChart as PieIcon, BarChart3, Filter, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function NutritionCharts({ isOpen, onClose, menuItems }) {
  const [selectedDay, setSelectedDay] = useState('All Days');
  const [chartType, setChartType] = useState('nutrition');
  const [metric, setMetric] = useState('calories');

  const days = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Daily Special'];

  const filteredItems = useMemo(() => {
    if (selectedDay === 'All Days') return menuItems;
    return menuItems.filter(item => item.day === selectedDay || item.day === 'Daily Special');
  }, [menuItems, selectedDay]);

  // Nutrition by Day
  const nutritionByDay = useMemo(() => {
    const grouped = {};
    menuItems.forEach(item => {
      const day = item.day || 'Unknown';
      if (!grouped[day]) {
        grouped[day] = { day, calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, count: 0 };
      }
      grouped[day].calories += item.calories || 0;
      grouped[day].protein += item.protein || 0;
      grouped[day].carbs += item.carbs || 0;
      grouped[day].fat += item.fat || 0;
      grouped[day].sodium += item.sodium || 0;
      grouped[day].count += 1;
    });
    
    return Object.values(grouped).map(d => ({
      day: d.day,
      avgCalories: Math.round(d.calories / d.count),
      avgProtein: Math.round(d.protein / d.count),
      avgCarbs: Math.round(d.carbs / d.count),
      avgFat: Math.round(d.fat / d.count),
      avgSodium: Math.round(d.sodium / d.count),
    }));
  }, [menuItems]);

  // Allergen Distribution
  const allergenData = useMemo(() => {
    const allergenCount = {};
    filteredItems.forEach(item => {
      (item.allergens || []).forEach(allergen => {
        allergenCount[allergen] = (allergenCount[allergen] || 0) + 1;
      });
    });
    
    return Object.entries(allergenCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredItems]);

  // Top Items by Metric
  const topItems = useMemo(() => {
    const metricMap = {
      calories: 'calories',
      protein: 'protein',
      carbs: 'carbs',
      sodium: 'sodium',
      fiber: 'fiber'
    };
    
    return [...filteredItems]
      .filter(item => item[metricMap[metric]] > 0)
      .sort((a, b) => (b[metricMap[metric]] || 0) - (a[metricMap[metric]] || 0))
      .slice(0, 10)
      .map(item => ({
        name: item.name.length > 20 ? item.name.slice(0, 20) + '...' : item.name,
        value: item[metricMap[metric]] || 0
      }));
  }, [filteredItems, metric]);

  // Dietary Tags Distribution
  const tagData = useMemo(() => {
    const tagCount = {};
    filteredItems.forEach(item => {
      (item.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-xl uppercase tracking-tight">Data Analytics</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="font-bold">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nutrition">Nutrition Overview</SelectItem>
                <SelectItem value="allergens">Allergen Distribution</SelectItem>
                <SelectItem value="top">Top Items by Metric</SelectItem>
                <SelectItem value="tags">Dietary Tags</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="font-bold">
                <SelectValue placeholder="Filter by Day" />
              </SelectTrigger>
              <SelectContent>
                {days.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {chartType === 'top' && (
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="font-bold">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calories">Calories</SelectItem>
                  <SelectItem value="protein">Protein</SelectItem>
                  <SelectItem value="carbs">Carbs</SelectItem>
                  <SelectItem value="sodium">Sodium</SelectItem>
                  <SelectItem value="fiber">Fiber</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="flex-1 overflow-y-auto p-6">
          {chartType === 'nutrition' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">Average Nutrition by Day</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nutritionByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                    <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                    <Bar dataKey="avgCalories" fill="#10b981" name="Avg Calories" />
                    <Bar dataKey="avgProtein" fill="#3b82f6" name="Avg Protein (g)" />
                    <Bar dataKey="avgCarbs" fill="#f59e0b" name="Avg Carbs (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">Sodium & Fat Trends</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={nutritionByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                    <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="avgSodium" stroke="#ef4444" strokeWidth={3} name="Avg Sodium (mg)" />
                    <Line type="monotone" dataKey="avgFat" stroke="#8b5cf6" strokeWidth={3} name="Avg Fat (g)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartType === 'allergens' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">Allergen Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allergenData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allergenData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">Allergen Count</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={allergenData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 'bold' }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartType === 'top' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">
                Top 10 Items by {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} width={150} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartType === 'tags' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">Dietary Tags Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tagData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-lg mb-4 text-slate-800 uppercase tracking-tight">Tag Breakdown</h4>
                <div className="space-y-3">
                  {tagData.map((tag, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-bold text-sm">{tag.name}</span>
                      </div>
                      <span className="font-bold text-sm text-gray-600">{tag.value} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-4 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-emerald-600">{filteredItems.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Items</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(filteredItems.reduce((sum, item) => sum + (item.calories || 0), 0) / filteredItems.length) || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Avg Calories</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-amber-600">
                {Math.round(filteredItems.reduce((sum, item) => sum + (item.protein || 0), 0) / filteredItems.length) || 0}g
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Avg Protein</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-red-600">
                {filteredItems.filter(item => (item.allergens?.length || 0) > 0).length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">With Allergens</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}