import React, { useState } from 'react';
import { UtensilsCrossed, Flame, Salad } from 'lucide-react';

const CORE_STATIONS = [
  { id: 'grill', label: 'Grill', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'deli', label: 'Deli', icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'salad-bar', label: 'Salad Bar', icon: Salad, color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' },
];

// MenuItemCard component
function MenuItemCard({ item, addToPlate, customVegUrl, customVeganUrl }) {
  const [showDetails, setShowDetails] = useState(false);
  const isRecommended = item.matchesGoal;
  
  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 font-sans hover:shadow-md font-medium ${
      isRecommended ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-100'
    }`}>
      <div className="p-5 flex-1 font-sans font-bold font-medium space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{item.station}</span>
          <span className="text-[10px] font-bold text-gray-400">{item.day}</span>
        </div>
        <h4 className="font-bold text-gray-800 text-lg leading-tight">{item.name}</h4>
        {item.description && <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>}
        <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-xl border border-gray-100/50">
          <div><span className="block text-sm font-bold text-gray-700">{item.calories}</span><span className="text-[9px] text-gray-400 uppercase">Cals</span></div>
          <div><span className="block text-sm font-bold text-gray-700">{item.protein}g</span><span className="text-[9px] text-gray-400 uppercase">Prot</span></div>
          <div><span className="block text-sm font-bold text-gray-700">{item.carbs}g</span><span className="text-[9px] text-gray-400 uppercase">Carb</span></div>
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-2">
        <button onClick={() => setShowDetails(!showDetails)} className="flex-1 py-2 text-xs font-bold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100">Info</button>
        <button onClick={() => addToPlate(item)} className="w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-black">+</button>
      </div>
    </div>
  );
}

export default function CoreStationTabs({ items, addToPlate, customVegUrl, customVeganUrl }) {
  const [activeStation, setActiveStation] = useState('grill');

  // Filter items by station type
  const getItemsByStation = (stationId) => {
    const stationMap = {
      'grill': items.filter(i => i.station?.toLowerCase().includes('grill')),
      'deli': items.filter(i => i.station?.toLowerCase().includes('deli')),
      'salad-bar': items.filter(i => i.station?.toLowerCase().includes('salad')),
    };
    return stationMap[stationId] || [];
  };

  const stationItems = getItemsByStation(activeStation);
  const currentStation = CORE_STATIONS.find(s => s.id === activeStation);
  const IconComp = currentStation?.icon;

  if (items.length === 0) return null;

  return (
    <div className="space-y-6 px-2">
      {/* Tabs Header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Core Menu Stations
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {/* Station Tabs */}
      <div className="flex gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
        {CORE_STATIONS.map(station => {
          const TabIcon = station.icon;
          const stationCount = getItemsByStation(station.id).length;
          return (
            <button
              key={station.id}
              onClick={() => setActiveStation(station.id)}
              disabled={stationCount === 0}
              className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeStation === station.id 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {station.label}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      {stationItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stationItems.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              addToPlate={addToPlate} 
              customVegUrl={customVegUrl} 
              customVeganUrl={customVeganUrl} 
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
          No items available for {currentStation?.label}
        </div>
      )}
    </div>
  );
}