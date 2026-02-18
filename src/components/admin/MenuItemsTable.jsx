import React, { useState } from 'react';
import { Search, Download, Edit, Trash2, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

const DAY_OPTIONS = [
  { value: 'all', label: 'All Days' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Daily Special', label: 'Daily Special' },
];

export default function MenuItemsTable({ items, onDelete, onBulkEdit, onExport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterDay, setFilterDay] = useState('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.station?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = filterDay === 'all' || item.day === filterDay;
    return matchesSearch && matchesDay;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleBulkEdit = () => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    onBulkEdit(selectedItems);
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10"
          />
        </div>
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold"
        >
          <option value="all">All Days</option>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Daily Special">Daily Special</option>
        </select>
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-teal-800">
            {selectedIds.length} item(s) selected
          </span>
          <div className="flex gap-2">
            <Button onClick={handleBulkEdit} size="sm" className="bg-teal-600 hover:bg-teal-700">
              <Edit className="w-4 h-4 mr-2" /> Bulk Edit
            </Button>
            <Button 
              onClick={() => setSelectedIds([])} 
              variant="outline" 
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-600">Name</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-600">Day</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-600">Station</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-600">Calories</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-600">Tags</th>
                <th className="p-3 text-right text-xs font-bold uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-3">
                      <button onClick={() => toggleSelect(item.id)}>
                        {selectedIds.includes(item.id) ? (
                          <CheckSquare className="w-4 h-4 text-teal-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div>
                      )}
                    </td>
                    <td className="p-3 text-sm">{item.day}</td>
                    <td className="p-3 text-sm">{item.station}</td>
                    <td className="p-3 text-sm font-bold">{item.calories || 0}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-[10px] font-bold">
                            {tag}
                          </span>
                        ))}
                        {item.tags?.length > 2 && (
                          <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        onClick={() => onDelete(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  );
}