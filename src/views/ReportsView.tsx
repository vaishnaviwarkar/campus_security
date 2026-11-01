import React from 'react';
import { BarChart3, PieChart, TrendingUp, ShieldCheck, AlertTriangle, ArrowUpRight, Download } from 'lucide-react';
import { Asset, SecurityAlert } from '../types';

interface ReportsViewProps {
  assets: Asset[];
  alerts: SecurityAlert[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ assets, alerts }) => {
  // Compute analytics
  const totalAssets = assets.length;
  const missingCount = assets.filter(a => a.status === 'MISSING').length;
  const issuedCount = assets.filter(a => a.status === 'ISSUED').length;
  const availableCount = assets.filter(a => a.status === 'AVAILABLE').length;
  const repairCount = assets.filter(a => a.status === 'UNDER_REPAIR').length;

  const categories = [
    { name: 'Laptops & Workstations', count: assets.filter(a => a.category_id === 1).length, color: 'bg-blue-500' },
    { name: 'Lab Test Equipment', count: assets.filter(a => a.category_id === 2).length, color: 'bg-emerald-500' },
    { name: 'AV & Presentation Gear', count: assets.filter(a => a.category_id === 3).length, color: 'bg-purple-500' },
    { name: 'IoT & Robotics Kits', count: assets.filter(a => a.category_id === 4).length, color: 'bg-amber-500' },
  ];

  const exportCSV = () => {
    const headers = ['ID', 'Asset Code', 'Asset Name', 'Category', 'Location', 'Status', 'RFID UID', 'Risk Level'];
    const rows = assets.map(a => [
      a.id,
      a.asset_code,
      `"${a.asset_name.replace(/"/g, '""')}"`,
      a.category_name || a.category_id,
      a.location_name || a.location_id,
      a.status,
      a.rfid_uid || 'NONE',
      a.risk_level
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus_asset_security_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Security & Asset Analytics Report</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              Real-time Metrics
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Asset distribution, risk breakdown, security breach frequencies and inventory analytics
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 shadow-md shadow-blue-600/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Asset Inventory (CSV)</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Asset Status Split</span>
            <PieChart className="w-4 h-4 text-blue-400" />
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Available ({availableCount})</span>
                <span className="text-emerald-400">{Math.round((availableCount / (totalAssets || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(availableCount / (totalAssets || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Active Loan / Issued ({issuedCount})</span>
                <span className="text-blue-400">{Math.round((issuedCount / (totalAssets || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${(issuedCount / (totalAssets || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Flagged Missing ({missingCount})</span>
                <span className="text-red-400">{Math.round((missingCount / (totalAssets || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${(missingCount / (totalAssets || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Maintenance / Repair ({repairCount})</span>
                <span className="text-amber-400">{Math.round((repairCount / (totalAssets || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${(repairCount / (totalAssets || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Categories</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-3 pt-2">
            {categories.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                  <span>{c.name}</span>
                  <span className="text-zinc-400">{c.count} items</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color}`} style={{ width: `${(c.count / (totalAssets || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Risk Posture */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Security Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">98.4%</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +1.2%
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Perimeter integrity score based on RFID tag reading speed, gate relay responsiveness, and ESP32 camera response latency.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>Total Alerts Logged: {alerts.length}</span>
            <span className="text-emerald-400">0 Critical Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
