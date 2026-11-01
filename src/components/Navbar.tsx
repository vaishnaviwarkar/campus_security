import React from 'react';
import { Shield, Bell, Cpu, Volume2, VolumeX, LogOut, User as UserIcon, Radio, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenTestBench: () => void;
  activeAlarm: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  connectedClients: number;
  onResetAlarm?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenTestBench,
  activeAlarm,
  soundEnabled,
  onToggleSound,
  onResetAlarm
}) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'LAB_STAFF':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'SECURITY':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-[#0c0c0e]/90 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-white text-base">CampusAssetSecurity</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">v2.4</span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">IoT RFID & Vision-Grounded Perimeter Security</p>
        </div>
      </div>

      {/* Center Alarm Banner only if active */}
      {activeAlarm && (
        <div className="flex items-center gap-2">
          <div className="animate-pulse bg-red-950/90 border border-red-500/60 text-red-300 px-3.5 py-1.5 rounded-full flex items-center space-x-2 text-xs font-semibold shadow-lg shadow-red-900/40">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <span>SECURITY ALARM ENGAGED</span>
          </div>
          {onResetAlarm && (
            <button
              onClick={onResetAlarm}
              className="px-2.5 py-1 rounded-full bg-red-800/80 hover:bg-red-700 text-white text-[11px] font-bold border border-red-400/80 transition cursor-pointer flex items-center gap-1 shadow"
              title="Silence and dismiss alarm"
            >
              <span>Dismiss</span>
            </button>
          )}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Virtual Hardware Simulator / Test Bench Button */}
        <button
          onClick={onOpenTestBench}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition cursor-pointer"
          title="Open ESP32 Hardware Simulator & Live Test Bench"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="hidden md:inline">IoT Test Bench</span>
        </button>

        {/* Audio Alert Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            soundEnabled
              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
          }`}
          title={soundEnabled ? 'Siren Audio Enabled' : 'Siren Audio Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* User Info & Role Pill */}
        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-zinc-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-zinc-200">{user.name}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${getRoleBadge(user.role_code)}`}>
                {user.role_code.replace('_', ' ')}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
