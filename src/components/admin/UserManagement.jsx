import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, ShieldCheck, User, Trash2 } from 'lucide-react';

const ROLE_CONFIG = {
  admin:   { label: 'Admin',   color: 'bg-teal-100 text-teal-800',   icon: ShieldCheck },
  manager: { label: 'Manager', color: 'bg-purple-100 text-purple-800', icon: Shield },
  user:    { label: 'User',    color: 'bg-gray-200 text-gray-600',    icon: User },
};

const ROLES = ['admin', 'manager', 'user'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [data, me] = await Promise.all([
      base44.entities.User.list(),
      base44.auth.me(),
    ]);
    setUsers(data);
    setCurrentUser(me);
    setLoading(false);
  };

  const changeRole = async (targetUser, newRole) => {
    setUpdating(targetUser.id);
    await base44.entities.User.update(targetUser.id, { role: newRole });
    await loadData();
    setUpdating(null);
  };

  const deleteUser = async (targetUser) => {
    if (!confirm(`Delete user ${targetUser.email}? This cannot be undone.`)) return;
    setUpdating(targetUser.id);
    await base44.entities.User.delete(targetUser.id);
    await loadData();
    setUpdating(null);
  };

  // Can the current user change the role of a target user?
  const canChangeRole = (target) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return target.id !== currentUser.id; // admin can change anyone except self
    if (currentUser.role === 'manager') return target.role !== 'admin' && target.id !== currentUser.id; // manager cannot touch admins
    return false;
  };

  // Can the current user delete a target user?
  const canDelete = (target) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return target.id !== currentUser.id; // admin can delete anyone except self
    return false; // managers cannot delete
  };

  // Which roles can the current user assign?
  const allowedRolesFor = (target) => {
    if (currentUser?.role === 'admin') return ROLES.filter(r => r !== target.role);
    if (currentUser?.role === 'manager') return ROLES.filter(r => r !== target.role && r !== 'admin');
    return [];
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600" /> User Management
        </h3>
        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block"/>Admin</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"/>Manager</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/>User</span>
        </div>
      </div>

      <div className="space-y-3">
        {users.map(u => {
          const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.user;
          const RoleIcon = config.icon;
          const isMe = currentUser?.id === u.id;
          const roleOptions = allowedRolesFor(u);
          const canDel = canDelete(u);
          const canChange = canChangeRole(u);

          return (
            <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${config.color}`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {u.full_name || 'No Name'}
                    {isMe && <span className="ml-2 text-[9px] text-teal-600 uppercase tracking-widest">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${config.color}`}>
                  {config.label}
                </span>

                {updating === u.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                ) : (
                  <>
                    {canChange && roleOptions.length > 0 && (
                      <select
                        className="text-[10px] font-bold uppercase border border-gray-200 rounded-xl px-2 py-1.5 bg-white text-gray-700 cursor-pointer outline-none hover:border-teal-300 transition"
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) changeRole(u, e.target.value); e.target.value = ''; }}
                      >
                        <option value="" disabled>Set Role</option>
                        {roleOptions.map(r => (
                          <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                        ))}
                      </select>
                    )}
                    {canDel && (
                      <button
                        onClick={() => deleteUser(u)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-bold uppercase tracking-widest space-y-1">
        <p>• <span className="text-teal-700">Admin</span> — Full access: change any role, delete any user</p>
        <p>• <span className="text-purple-700">Manager</span> — Can change roles of non-admins, cannot delete users</p>
        <p>• <span className="text-gray-600">User</span> — Standard access only</p>
      </div>
    </div>
  );
}