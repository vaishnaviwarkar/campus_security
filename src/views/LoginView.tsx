import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, ShieldAlert, Wrench } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@campus.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      if (res.success) {
        setAuthToken(res.token);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-[#121214] border border-zinc-800 rounded-[2rem] p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">CampusAssetSecurity</h1>
          <p className="text-xs text-zinc-400">
            Smart Campus Asset Security, Recovery & Anti-Theft System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Campus Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@campus.edu"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating with MySQL...</span>
            ) : (
              <>
                <span>Access Security Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-zinc-800 space-y-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block text-center">
            Instant Demo Role Switcher
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRole('admin@campus.edu', 'admin123')}
              className={`p-2 rounded-xl border text-[11px] font-medium transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                email === 'admin@campus.edu'
                  ? 'bg-purple-950/50 border-purple-500/40 text-purple-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('staff@campus.edu', 'staff123')}
              className={`p-2 rounded-xl border text-[11px] font-medium transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                email === 'staff@campus.edu'
                  ? 'bg-blue-950/50 border-blue-500/40 text-blue-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Lab Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('security@campus.edu', 'security123')}
              className={`p-2 rounded-xl border text-[11px] font-medium transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                email === 'security@campus.edu'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
