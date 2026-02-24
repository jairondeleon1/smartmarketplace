import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

const DAILY_VALUES = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  saturated_fat: 20,
  sodium: 2300,
  fiber: 28,
  sugar: 50,
  cholesterol: 300,
  vitamin_a: 900,
  vitamin_c: 90,
  vitamin_d: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700
};

const COLORS = {
  protein: '#8b5cf6',
  carbs: '#f59e0b',
  fat: '#ef4444',
  saturated: '#dc2626',
  unsaturated: '#10b981'
};

export default function NutritionDetailView({ item }) {
  const [activeTab, setActiveTab] = useState('overview');

  const calculateDV = (nutrient, value) => {
    const dv = DAILY_VALUES[nutrient];
    return dv ? Math.round((value / dv) * 100) : 0;
  };

  const macroData = [
    { name: 'Protein', value: item.protein || 0, color: COLORS.protein },
    { name: 'Carbs', value: item.carbs || 0, color: COLORS.carbs },
    { name: 'Fat', value: item.fat || 0, color: COLORS.fat }
  ];

  const fatBreakdown = [
    { name: 'Saturated', value: item.saturated_fat || 0, dv: calculateDV('saturated_fat', item.saturated_fat || 0) },
    { name: 'Unsaturated', value: item.unsaturated_fat || 0, dv: 0 }
  ];

  const vitamins = [
    { name: 'Vitamin A', value: item.vitamin_a || 0, unit: 'mcg', dv: calculateDV('vitamin_a', item.vitamin_a || 0) },
    { name: 'Vitamin C', value: item.vitamin_c || 0, unit: 'mg', dv: calculateDV('vitamin_c', item.vitamin_c || 0) },
    { name: 'Vitamin D', value: item.vitamin_d || 0, unit: 'mcg', dv: calculateDV('vitamin_d', item.vitamin_d || 0) }
  ];

  const minerals = [
    { name: 'Calcium', value: item.calcium || 0, unit: 'mg', dv: calculateDV('calcium', item.calcium || 0) },
    { name: 'Iron', value: item.iron || 0, unit: 'mg', dv: calculateDV('iron', item.iron || 0) },
    { name: 'Potassium', value: item.potassium || 0, unit: 'mg', dv: calculateDV('potassium', item.potassium || 0) }
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {['overview', 'macros', 'micros'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'text-teal-700 border-b-2 border-teal-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {macroData.map(macro => (
                <div key={macro.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                    <span className="font-bold text-gray-700">{macro.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{macro.value}g</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 uppercase font-bold">Sodium</div>
              <div className="text-lg font-bold text-gray-900">{item.sodium || 0}mg</div>
              <div className="text-xs text-teal-600 font-bold">{calculateDV('sodium', item.sodium || 0)}% DV</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 uppercase font-bold">Fiber</div>
              <div className="text-lg font-bold text-gray-900">{item.fiber || 0}g</div>
              <div className="text-xs text-teal-600 font-bold">{calculateDV('fiber', item.fiber || 0)}% DV</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 uppercase font-bold">Sugar</div>
              <div className="text-lg font-bold text-gray-900">{item.sugar || 0}g</div>
              <div className="text-xs text-teal-600 font-bold">{calculateDV('sugar', item.sugar || 0)}% DV</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 uppercase font-bold">Cholesterol</div>
              <div className="text-lg font-bold text-gray-900">{item.cholesterol || 0}mg</div>
              <div className="text-xs text-teal-600 font-bold">{calculateDV('cholesterol', item.cholesterol || 0)}% DV</div>
            </div>
          </div>
        </div>
      )}

      {/* Macros Tab */}
      {activeTab === 'macros' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-700 mb-3">Total Fat: {item.fat || 0}g</h4>
            
            {(item.saturated_fat > 0 || item.unsaturated_fat > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={fatBreakdown} layout="horizontal">
                    <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis type="number" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-2">
                  {fatBreakdown.map(fat => (
                    <div key={fat.name} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">{fat.name} Fat</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{fat.value}g</span>
                        {fat.dv > 0 && <span className="text-teal-600 ml-2">({fat.dv}% DV)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-bold">Detailed fat breakdown not available for this item.</p>
                <p className="mt-1 text-amber-700">Total fat: {item.fat || 0}g</p>
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">Total Carbohydrates</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{item.carbs || 0}g</span>
                  <span className="text-teal-600 ml-2">({calculateDV('carbs', item.carbs || 0)}% DV)</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs pl-4">
                <span className="text-gray-600">Dietary Fiber</span>
                <span className="font-bold text-gray-900">{item.fiber || 0}g</span>
              </div>
              <div className="flex justify-between items-center text-xs pl-4">
                <span className="text-gray-600">Total Sugars</span>
                <span className="font-bold text-gray-900">{item.sugar || 0}g</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Protein</span>
              <div className="text-right">
                <span className="font-bold text-gray-900">{item.protein || 0}g</span>
                <span className="text-teal-600 ml-2">({calculateDV('protein', item.protein || 0)}% DV)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Micros Tab */}
      {activeTab === 'micros' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-700 mb-3 flex items-center gap-2">
              <Info className="w-3 h-3" /> Vitamins
            </h4>
            <div className="space-y-2">
              {vitamins.map(vitamin => (
                <div key={vitamin.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{vitamin.name}</span>
                    <span className="text-gray-900">
                      {vitamin.value}{vitamin.unit} 
                      <span className="text-teal-600 ml-2 font-bold">({vitamin.dv}% DV)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(vitamin.dv, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-xs font-bold uppercase text-gray-700 mb-3 flex items-center gap-2">
              <Info className="w-3 h-3" /> Minerals
            </h4>
            <div className="space-y-2">
              {minerals.map(mineral => (
                <div key={mineral.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{mineral.name}</span>
                    <span className="text-gray-900">
                      {mineral.value}{mineral.unit}
                      <span className="text-teal-600 ml-2 font-bold">({mineral.dv}% DV)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(mineral.dv, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3">
            <p className="text-xs text-blue-800">
              <span className="font-bold">Note:</span> Percent Daily Values (DV) are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer Footer */}
      <DisclaimerFooter />
    </div>
  );
}

function DisclaimerFooter() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-teal-600 font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
      >
        <Info className="w-3 h-3" />
        Nutrition Information based on FDA and USDA guidelines. View full disclaimer
      </button>
      {expanded && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-[11px] text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 mb-1 uppercase tracking-wide text-[10px]">Nutrition Information & Disclaimer</p>
          </div>
          <p>2,000 calories per day is used for general nutrition advice based on guidance from the <a href="https://www.fda.gov/food" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-bold hover:underline">U.S. Food and Drug Administration (FDA)</a>. However, individual calorie needs may vary.</p>
          <p>Nutrient values are based on data from the <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-bold hover:underline">U.S. Department of Agriculture (USDA)</a> FoodData Central database and information provided by our suppliers.</p>
          <p>Unplanned product substitutions, changes in product specifications, preparation methods, and portion sizes may result in variations in nutrient content.</p>
          <p>We handle and prepare egg, milk, wheat, shellfish, fish, soy, peanut, tree nut products, and other potential allergens in our Marketplace. Guests with food allergies or specific dietary concerns should speak with an Ingredient Ambassador for individualized assistance.</p>
          <p>Trans fat values reflect naturally occurring trans fat in animal proteins and dairy products. No added/artificial trans fats are used in our standard recipes.</p>
          <p><span className="font-bold text-gray-700">"-"</span> A dash indicates no value is currently available.</p>
          <p><span className="font-bold text-gray-700">"+"</span> A plus indicates the value was calculated using available data where some components were missing.</p>
          <p className="italic text-gray-500">This information is provided for transparency and informational purposes only and is not intended as medical advice.</p>
        </div>
      )}
    </div>
  );
}