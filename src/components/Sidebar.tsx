import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Package,
  CreditCard,
  ArrowLeftRight,
  Wrench,
  AlertTriangle,
  FileQuestion,
  RotateCcw,
  Activity,
  Camera,
  History,
  BarChart3,
  Users,
  Cpu,
  Lock
} from 'lucide-react';
import { UserRole } from '../types';

export type NavView =
  | 'dashboard'
  | 'live-monitoring'
  | 'assets'
  | 'rfid-management'
  | 'issue-return'
  | 'maintenance'
  | 'alerts'
  | 'missing-assets'
  | 'recovery'
  | 'device-health'
  | 'camera-evidence'
  | 'movement-history'
  | 'reports'
  | 'user-management'
  | 'hardware-bench';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  roles: string[];
  pulse?: boolean;
  badge?: number;
  badgeColor?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  userRole?: UserRole;
  alertCount: number;
  missingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  userRole,
  alertCount,
  missingCount
}) => {
  const sections: SidebarSection[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'] },
        { id: 'live-monitoring', label: 'Live Monitoring', icon: Radio, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'], pulse: true },
        { id: 'assets', label: 'Assets Catalog', icon: Package, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'] },
        { id: 'rfid-management', label: 'RFID Registry', icon: CreditCard, roles: ['ADMIN', 'LAB_STAFF'] }
      ]
    },
    {
      title: 'ASSET LIFECYCLE',
      items: [
        { id: 'issue-return', label: 'Issue / Return', icon: ArrowLeftRight, roles: ['ADMIN', 'LAB_STAFF'] },
        { id: 'maintenance', label: 'Maintenance Console', icon: Wrench, roles: ['ADMIN', 'LAB_STAFF'] },
        { id: 'missing-assets', label: 'Missing Assets', icon: FileQuestion, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'], badge: missingCount },
        { id: 'recovery', label: 'Recovery Console', icon: RotateCcw, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'] }
      ]
    },
    {
      title: 'SECURITY & HARDWARE',
      items: [
        { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'], badge: alertCount, badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30' },
        { id: 'device-health', label: 'Device Health (IoT)', icon: Activity, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'] },
        { id: 'camera-evidence', label: 'Camera Evidence', icon: Camera, roles: ['ADMIN', 'SECURITY'] },
        { id: 'movement-history', label: 'Movement Logs', icon: History, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'] }
      ]
    },
    {
      title: 'SYSTEM & ANALYTICS',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'LAB_STAFF'] },
        { id: 'user-management', label: 'User Management', icon: Users, roles: ['ADMIN'] },
        { id: 'hardware-bench', label: 'IoT Hardware Bench', icon: Cpu, roles: ['ADMIN', 'LAB_STAFF', 'SECURITY'] }
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-[#09090b] flex flex-col justify-between p-4 shrink-0 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const visibleItems = section.items.filter(
            item => !userRole || item.roles.includes(userRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-3">
                {section.title}
              </span>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectView(item.id as NavView)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'} ${item.pulse ? 'animate-pulse' : ''}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkpoint Status Footer Pill */}
      <div className="pt-4 mt-4 border-t border-zinc-800/80">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-medium text-zinc-300">ESP32 Checkpoint 1</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
};
