import React, { useState } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Radio,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Camera,
  Cpu,
  Wifi,
  Terminal,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Filter
} from 'lucide-react';
import { Asset, RFIDScan, SecurityAlert } from '../types';
import { formatTimeSafe } from '../utils/formatDate';

interface DashboardViewProps {
  stats: any;
  recentScans: RFIDScan[];
  recentAlerts: SecurityAlert[];
  onOpenTestBench: () => void;
  onNavigate: (view: any) => void;
  onSelectAsset?: (assetId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentScans,
  recentAlerts,
  onOpenTestBench,
  onNavigate
}) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<'ALL' | 1 | 2>('ALL');

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'AUTHORIZED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'UNAUTHORIZED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'MISSING_ASSET':
        return 'bg-red-950 text-red-300 border-red-500 font-bold animate-pulse';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  // Checkpoint Telemetry Derivations
  const cp1Breakdown = stats?.checkpointBreakdown?.cp1;
  const cp2Breakdown = stats?.checkpointBreakdown?.cp2;

  const cp1LastScan = recentScans?.find(
    (s) => s.checkpoint_id === 1 || s.checkpointId === 1 || s.device_code === 'ESP32-CP01-GATE'
  );
  const cp2LastScan = recentScans?.find(
    (s) =>
      s.checkpoint_id === 2 ||
      s.checkpointId === 2 ||
      s.device_code === 'ESP32-CP02-GATE' ||
      s.device_code === 'ESP32-CP02-LAB'
  );

  const displayedScans =
    selectedCheckpoint === 'ALL'
      ? recentScans
      : recentScans.filter((s) => {
          if (selectedCheckpoint === 1) {
            return (
              s.checkpoint_id === 1 ||
              s.checkpointId === 1 ||
              s.device_code === 'ESP32-CP01-GATE' ||
              s.checkpoint_name?.includes('Checkpoint 1')
            );
          }
          if (selectedCheckpoint === 2) {
            return (
              s.checkpoint_id === 2 ||
              s.checkpointId === 2 ||
              s.device_code === 'ESP32-CP02-GATE' ||
              s.device_code === 'ESP32-CP02-LAB' ||
              s.checkpoint_name?.includes('Checkpoint 2')
            );
          }
          return true;
        });

  const displayedAlerts =
    selectedCheckpoint === 'ALL'
      ? recentAlerts
      : recentAlerts.filter((a) => {
          if (selectedCheckpoint === 1) {
            return (
              a.checkpoint_id === 1 ||
              a.checkpointId === 1 ||
              a.device_code?.includes('CP01') ||
              a.checkpoint_name?.includes('Checkpoint 1')
            );
          }
          if (selectedCheckpoint === 2) {
            return (
              a.checkpoint_id === 2 ||
              a.checkpointId === 2 ||
              a.device_code?.includes('CP02') ||
              a.checkpoint_name?.includes('Checkpoint 2')
            );
          }
          return true;
        });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Checkpoint Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121214] border border-zinc-800 rounded-[2rem] p-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Dual-Checkpoint Perimeter Security
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
              2 NODES ACTIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Edge controller telemetry & transit access logs across Main Entrance and Lab Gates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Checkpoint Selector */}
          <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-400" />
              View:
            </span>
            <button
              onClick={() => setSelectedCheckpoint('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCheckpoint === 'ALL'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>All Gates</span>
            </button>
            <button
              onClick={() => setSelectedCheckpoint(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCheckpoint === 1
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>CP1: Main Gate</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-950 text-blue-200 border border-blue-400/30">Cam</span>
            </button>
            <button
              onClick={() => setSelectedCheckpoint(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCheckpoint === 2
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>CP2: Lab Gate</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">No Cam</span>
            </button>
          </div>

          <button
            onClick={onOpenTestBench}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Virtual Hardware Bench</span>
          </button>
        </div>
      </div>

      {/* DEDICATED TWO-CHECKPOINT STATUS PANELS (CP1 & CP2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHECKPOINT 1 STATUS CARD */}
        <div
          className={`bg-[#121214] border rounded-[2rem] p-5 space-y-4 transition-all duration-300 relative overflow-hidden ${
            selectedCheckpoint === 1 || selectedCheckpoint === 'ALL'
              ? 'border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20'
              : 'border-zinc-800/80 opacity-75'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                    CP1
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Checkpoint 1 – Main Entrance
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Node: ESP32-CP01-GATE • Perimeter Gate 1
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">192.168.1.101</span>
            </div>
          </div>

          {/* Key Metrics Grid for CP1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* Last RFID Scan */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Last RFID Scan</span>
              <div className="mt-1">
                <div className="text-xs font-mono font-bold text-white tracking-tight">
                  {cp1LastScan?.rfid_uid || cp1Breakdown?.last_rfid_scan || 'B72A5C19'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {cp1LastScan?.asset_name || 'MacBook Pro M3'}
                </div>
              </div>
            </div>

            {/* Last Scan Result */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Last Result</span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getResultBadge(
                    cp1LastScan?.result || cp1Breakdown?.last_scan_result || 'AUTHORIZED'
                  )}`}
                >
                  {(cp1LastScan?.result || cp1Breakdown?.last_scan_result || 'AUTHORIZED').replace('_', ' ')}
                </span>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                  {formatTimeSafe(cp1LastScan?.created_at || cp1LastScan?.timestamp || cp1Breakdown?.last_scan_time)}
                </div>
              </div>
            </div>

            {/* Optical Auto-Capture */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Auto Capture</span>
              <div className="mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-mono font-bold text-blue-400">
                  AUTO-SNAP
                </span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">On Unauthorized Exit</span>
            </div>

            {/* Camera Unit */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Camera Unit</span>
              <div className="mt-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ARMED
                </span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">ESP32-CAM OV2640</span>
            </div>
          </div>

          {/* Sub Telemetry Specs Row */}
          <div className="bg-black/40 border border-zinc-850 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>RSSI: <strong className="text-zinc-200 font-mono">-58 dBm</strong> (Strong)</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>RFID: <strong className="text-zinc-200 font-mono">MFRC522 SPI Active</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Firmware: <strong className="text-zinc-200 font-mono">v2.4.1 FreeRTOS</strong></span>
            </div>
          </div>
        </div>

        {/* CHECKPOINT 2 STATUS CARD */}
        <div
          className={`bg-[#121214] border rounded-[2rem] p-5 space-y-4 transition-all duration-300 relative overflow-hidden ${
            selectedCheckpoint === 2 || selectedCheckpoint === 'ALL'
              ? 'border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.1)] ring-1 ring-purple-500/20'
              : 'border-zinc-800/80 opacity-75'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs font-bold">
                    CP2
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Checkpoint 2 – Lab/Secondary Gate
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Node: ESP32-CP02-GATE • Turing Hall CS Lab
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">192.168.1.105</span>
            </div>
          </div>

          {/* Key Metrics Grid for CP2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* Last RFID Scan */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Last RFID Scan</span>
              <div className="mt-1">
                <div className="text-xs font-mono font-bold text-white tracking-tight">
                  {cp2LastScan?.rfid_uid || cp2Breakdown?.last_rfid_scan || 'C48E10AB'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {cp2LastScan?.asset_name || 'Dell Precision 5820'}
                </div>
              </div>
            </div>

            {/* Last Scan Result */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Last Result</span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getResultBadge(
                    cp2LastScan?.result || cp2Breakdown?.last_scan_result || 'AUTHORIZED'
                  )}`}
                >
                  {(cp2LastScan?.result || cp2Breakdown?.last_scan_result || 'AUTHORIZED').replace('_', ' ')}
                </span>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                  {formatTimeSafe(cp2LastScan?.created_at || cp2LastScan?.timestamp || cp2Breakdown?.last_scan_time)}
                </div>
              </div>
            </div>

            {/* Logging Policy */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Logging Policy</span>
              <div className="mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400">
                  SECURE LOG
                </span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">RFID + Siren Alert</span>
            </div>

            {/* Camera Unit: Not Installed */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Camera Unit</span>
              <div className="mt-1">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-950 text-zinc-400 border border-zinc-800">
                  Not Installed
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">No hardware sensor</span>
            </div>
          </div>

          {/* Sub Telemetry Specs Row */}
          <div className="bg-black/40 border border-zinc-850 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>RSSI: <strong className="text-zinc-200 font-mono">-52 dBm</strong> (Strong)</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>RFID: <strong className="text-zinc-200 font-mono">MFRC522 SPI Active</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Firmware: <strong className="text-zinc-200 font-mono">v2.4.1 FreeRTOS</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layer 1: Core Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Total Assets */}
        <div
          onClick={() => onNavigate('assets')}
          className="bg-[#121214] border border-zinc-800 hover:border-zinc-700 rounded-[1.75rem] p-4 flex flex-col justify-between cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Total Assets</span>
            <div className="p-2 bg-zinc-900 rounded-xl text-zinc-400 group-hover:text-white transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{stats?.totalAssets ?? 6}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">100%</span> tracked via RFID
            </div>
          </div>
        </div>

        {/* Available */}
        <div
          onClick={() => onNavigate('assets')}
          className="bg-[#121214] border border-zinc-800 hover:border-emerald-500/30 rounded-[1.75rem] p-4 flex flex-col justify-between cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Available</span>
            <div className="p-2 bg-emerald-950/40 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats?.availableAssets ?? 3}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Ready in lab stock</div>
          </div>
        </div>

        {/* Issued */}
        <div
          onClick={() => onNavigate('issue-return')}
          className="bg-[#121214] border border-zinc-800 hover:border-blue-500/30 rounded-[1.75rem] p-4 flex flex-col justify-between cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Issued Out</span>
            <div className="p-2 bg-blue-950/40 rounded-xl text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-400 tracking-tight">{stats?.issuedAssets ?? 1}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Active student/staff loans</div>
          </div>
        </div>

        {/* Maintenance / Repair */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-[#121214] border border-zinc-800 hover:border-amber-500/30 rounded-[1.75rem] p-4 flex flex-col justify-between cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Under Repair</span>
            <div className="p-2 bg-amber-950/40 rounded-xl text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400 tracking-tight">{stats?.maintenanceAssets ?? 1}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Defective / in service</div>
          </div>
        </div>

        {/* Missing Assets */}
        <div
          onClick={() => onNavigate('missing-assets')}
          className="bg-[#121214] border border-red-900/40 hover:border-red-500/50 rounded-[1.75rem] p-4 flex flex-col justify-between cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Missing Flag</span>
            <div className="p-2 bg-red-950 rounded-xl text-red-400 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-400 tracking-tight">{stats?.missingAssets ?? 1}</div>
            <div className="text-[11px] text-red-300/80 mt-0.5">Armed at all gates</div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layer 2: Live RFID Scan Stream & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time RFID Scan Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Live RFID Scan Stream {selectedCheckpoint !== 'ALL' ? `(Filtered: Checkpoint ${selectedCheckpoint})` : '(CP1 + CP2)'}
                </h3>
                <p className="text-[11px] text-zinc-400">Edge controller MFRC522 event log</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('live-monitoring')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
            >
              <span>Full Gate Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scans Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold">
                  <th className="pb-3 pl-2">Time</th>
                  <th className="pb-3">RFID UID</th>
                  <th className="pb-3">Asset / Item</th>
                  <th className="pb-3">Checkpoint Gate</th>
                  <th className="pb-3">Security Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {displayedScans && displayedScans.length > 0 ? (
                  displayedScans.slice(0, 5).map((scan) => (
                    <tr key={scan.id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3 pl-2 text-zinc-400 font-mono text-[11px]">
                        {formatTimeSafe(scan.created_at || scan.timestamp)}
                      </td>
                      <td className="py-3 font-mono font-bold text-zinc-200">{scan.rfid_uid}</td>
                      <td className="py-3 text-zinc-300 font-medium">
                        {scan.asset_name || <span className="text-zinc-500 italic">Unregistered Card</span>}
                      </td>
                      <td className="py-3 text-zinc-400 text-[11px]">
                        <span className="font-semibold text-zinc-300">
                          {scan.checkpoint_name || (scan.checkpoint_id === 2 ? 'Checkpoint 2 (Lab)' : 'Checkpoint 1 (Main)')}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getResultBadge(
                            scan.result
                          )}`}
                        >
                          {scan.result.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-500 text-xs">
                      No scans recorded for this checkpoint yet. Tap an RFID card on the IoT Test Bench.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Alerts Column (1 Col) */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Active Alerts {selectedCheckpoint !== 'ALL' ? `(CP${selectedCheckpoint})` : ''}
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">Live Socket</span>
            </div>

            <div className="space-y-3 mt-4">
              {displayedAlerts && displayedAlerts.length > 0 ? (
                displayedAlerts.slice(0, 3).map((al) => (
                  <div
                    key={al.id}
                    className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          al.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {al.severity}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatTimeSafe(al.created_at || al.timestamp, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 leading-snug">{al.message}</p>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      {al.checkpoint_name || (al.checkpoint_id === 2 ? 'Checkpoint 2 (Lab Gate)' : 'Checkpoint 1 (Main Gate)')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  All perimeter checkpoints secure.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('alerts')}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
          >
            Manage Security Incidents
          </button>
        </div>
      </div>
    </div>
  );
};
