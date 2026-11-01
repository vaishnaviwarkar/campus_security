import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Phone, Building, CheckCircle2, Lock, Key } from 'lucide-react';
import { User } from '../types';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Dr. Robert Vance',
      email: 'admin@campus.edu',
      role_code: 'ADMIN',
      department: 'Information Technology',
      phone: '+1 (555) 019-2831',
      status: 'ACTIVE',
      created_at: '2024-01-10T08:00:00Z'
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      email: 'staff@campus.edu',
      role_code: 'LAB_STAFF',
      department: 'Computer Science Lab',
      phone: '+1 (555) 014-9922',
      status: 'ACTIVE',
      created_at: '2024-01-15T09:30:00Z'
    },
    {
      id: 3,
      name: 'Officer Marcus Kane',
      email: 'security@campus.edu',
      role_code: 'SECURITY',
      department: 'Campus Police & Safety',
      phone: '+1 (555) 011-8844',
      status: 'ACTIVE',
      created_at: '2024-02-01T14:00:00Z'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role_code: 'LAB_STAFF' as any,
    department: '',
    phone: ''
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const created: User = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
      role_code: newUser.role_code,
      department: newUser.department || 'General Campus',
      phone: newUser.phone || '+1 (555) 000-0000',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    setUsers([...users, created]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role_code: 'LAB_STAFF', department: '', phone: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">User Accounts & RBAC Privileges</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
              Role-Based Access Control
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage system administrators, lab staff custodians, and campus security officers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 shadow-md shadow-blue-600/20"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Operator Account</span>
        </button>
      </div>

      {/* Users Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-[#121214] border border-zinc-800 rounded-[1.75rem] p-6 flex flex-col justify-between hover:border-zinc-700 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                    {u.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{u.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-400">{u.department}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    u.role_code === 'ADMIN'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : u.role_code === 'LAB_STAFF'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {u.role_code.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono text-[11px] text-zinc-300">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono text-[11px] text-zinc-300">{u.phone}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                ACTIVE
              </span>
              <span>ID #{u.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-bold text-white">Create Operator User</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Officer James Cole"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. jcole@campus.edu"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Role Privilege</label>
                <select
                  value={newUser.role_code}
                  onChange={(e) => setNewUser({ ...newUser, role_code: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="LAB_STAFF">LAB_STAFF (Issue & Catalog)</option>
                  <option value="SECURITY">SECURITY (Perimeter & Camera)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g. Campus Safety"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Save Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
