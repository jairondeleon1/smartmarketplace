import React, { useState } from 'react';
import { UtensilsCrossed, Flame, Salad } from 'lucide-react';
import MenuItemCard from '../pages/Home';

const CORE_STATIONS = [
  { id: 'grill', label: 'Grill', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'deli', label: 'Deli', icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'salad-bar', label: 'Salad Bar', icon: Salad, color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' },
];

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