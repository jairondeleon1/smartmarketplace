import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, ShieldCheck, User, Trash2, UserPlus } from 'lucide-react';

const ROLE_CONFIG = {
  admin:     { label: 'Admin',     color: 'bg-teal-100 text-teal-800',   icon: ShieldCheck },
  manager:   { label: 'Manager',   color: 'bg-purple-100 text-purple-800', icon: Shield },
  dietitian: { label: 'Dietitian', color: 'bg-green-100 text-green-800',  icon: User },
  user:      { label: 'User',      color: 'bg-gray-200 text-gray-600',    icon: User },
};

const ROLES = ['admin', 'manager', 'dietitian', 'user'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

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
    // normalize role from _app_role if available
    setCurrentUser(me ? { ...me, role: me._app_role || me.role } : me);
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

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail.trim()}! They must accept the email to activate their account.` });
      setInviteEmail('');
      setInviteRole('user');
      await loadData();
    } catch (err) {
      setInviteMsg({ type: 'error', text: err?.message || 'Failed to send invite.' });
    } finally {
      setInviting(false);
    }
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

      {/* Invite new user */}
      <form onSubmit={handleInvite} className="mt-4 p-4 bg-white border border-gray-100 rounded-2xl space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-teal-600" /> Invite New User
        </h4>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 p-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-teal-400"
            required
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="p-3 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-teal-400"
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="dietitian">Dietitian</option>
            {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-3 bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
          </button>
        </div>
        {inviteMsg && (
          <p className={`text-xs font-bold ${inviteMsg.type === 'success' ? 'text-teal-700' : 'text-red-600'}`}>
            {inviteMsg.text}
          </p>
        )}
      </form>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-bold uppercase tracking-widest space-y-1">
        <p>• <span className="text-teal-700">Admin</span> — Full access: change any role, delete any user</p>
        <p>• <span className="text-purple-700">Manager</span> — Upload, manage items, manual entry — no users/features/wellness</p>
        <p>• <span className="text-green-700">Dietitian</span> — Upload, manage items, wellness — no users/features</p>
        <p>• <span className="text-gray-600">User</span> — Standard access only</p>
      </div>
    </div>
  );
}