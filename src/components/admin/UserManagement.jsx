import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, User } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  const changeRole = async (userId, newRole) => {
    setUpdating(userId);
    await base44.entities.User.update(userId, { role: newRole });
    await loadUsers();
    setUpdating(null);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
        <Shield className="w-4 h-4 text-teal-600" /> User Management
      </h3>
      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-full">
                <User className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800">{user.full_name || 'No Name'}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-teal-100 text-teal-800' : 'bg-gray-200 text-gray-600'}`}>
                {user.role || 'user'}
              </span>
              {updating === user.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              ) : (
                <button
                  onClick={() => changeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                  className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl border transition ${
                    user.role === 'admin'
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}