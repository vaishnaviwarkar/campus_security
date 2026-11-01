import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw
} from 'lucide-react';
import { RFIDScan, IoTDevice, SecurityAlert } from '../types';
import { api } from '../services/api';
import { formatTimeSafe } from '../utils/formatDate';

interface LiveMonitoringViewProps {
  scans: RFIDScan[];
  alerts: SecurityAlert[];
  devices: IoTDevice[];
  activeAlarm: boolean;
  onOpenTestBench: () => void;
  onResetAlarm: () => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  scans,
  alerts,
  devices,
  activeAlarm,
  onOpenTestBench,
  onResetAlarm
}) => {
  const [selectedGate, setSelectedGate] = useState<string>('ALL');

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'AUTHORIZED':
        return {
          pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          text: 'AUTHORIZED PASS'
        };
      case 'UNAUTHORIZED':
        return {
          pill: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: XCircle,
          text: 'UNAUTHORIZED CHECKOUT'
        };
      case 'MISSING_ASSET':
        return {
          pill: 'bg-red-950 text-red-300 border-red-500 animate-pulse font-bold',
          icon: ShieldAlert,
          text: 'MISSING ASSET BREACH'
        };
      default:
        return {
          pill: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          icon: AlertTriangle,
          text: 'UNKNOWN RFID TAG'
        };
    }
  };

  const filteredScans = selectedGate === 'ALL'
    ? scans
    : scans.filter(s => {
        if (selectedGate === 'CP1') {
          return s.checkpoint_id === 1 || s.checkpointId === 1 || s.device_code === 'ESP32-CP01-GATE' || s.checkpoint_name?.includes('Checkpoint 1');
        }
        if (selectedGate === 'CP2') {
          return s.checkpoint_id === 2 || s.checkpointId === 2 || s.device_code === 'ESP32-CP02-GATE' || s.device_code === 'ESP32-CP02-LAB' || s.checkpoint_name?.includes('Checkpoint 2');
        }
        return s.device_code === selectedGate || s.checkpoint_name?.includes(selectedGate);
      });

  const cp1Device = devices.find(d => d.device_code === 'ESP32-CP01-GATE' || d.checkpoint_id === 1);
  const cp2Device = devices.find(d => d.device_code === 'ESP32-CP02-GATE' || d.device_code === 'ESP32-CP02-LAB' || d.checkpoint_id === 2);
  const cp1LastScan = scans.find(s => s.checkpoint_id === 1 || s.checkpointId === 1 || s.device_code === 'ESP32-CP01-GATE');
  const cp2LastScan = scans.find(s => s.checkpoint_id === 2 || s.checkpointId === 2 || s.device_code === 'ESP32-CP02-GATE' || s.device_code === 'ESP32-CP02-LAB');

  return (
    <div className="space-y-6">
      {/* Live Monitoring Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Multi-Checkpoint Security Gate Monitor
            </h1>
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>WEBSOCKET LIVE</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time telemetry across Checkpoint 1 (Main Entrance) and Checkpoint 2 (Secondary/Lab Gate)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeAlarm && (
            <button
              onClick={onResetAlarm}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 animate-pulse shadow-lg shadow-red-600/30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Silence & Reset Gate Siren</span>
            </button>
          )}

          <button
            onClick={onOpenTestBench}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Test Hardware Scenarios</span>
          </button>
        </div>
      </div>

      {/* Actuator & Gate State Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Physical Actuator Status */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              Actuator States
            </span>
            <span className="text-[10px] font-mono text-zinc-500">GPIO Trigger</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Green LED */}
            <div className={`p-2.5 rounded-2xl border transition ${
              scans[0]?.result === 'AUTHORIZED'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-900/30'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1 ${scans[0]?.result === 'AUTHORIZED' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`}></div>
              <span className="font-bold block text-[10px]">Green LED</span>
              <span className="text-[8px] font-mono text-zinc-400">GPIO 25</span>
            </div>

            {/* Red LED */}
            <div className={`p-2.5 rounded-2xl border transition ${
              activeAlarm || (scans[0] && scans[0].result !== 'AUTHORIZED')
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-lg shadow-red-900/30'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1 ${activeAlarm || (scans[0] && scans[0].result !== 'AUTHORIZED') ? 'bg-red-400 animate-pulse' : 'bg-zinc-700'}`}></div>
              <span className="font-bold block text-[10px]">Red LED</span>
              <span className="text-[8px] font-mono text-zinc-400">GPIO 26</span>
            </div>

            {/* Buzzer Siren */}
            <div className={`p-2.5 rounded-2xl border transition ${
              activeAlarm
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-lg shadow-amber-900/30'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1 ${activeAlarm ? 'bg-amber-400 animate-bounce' : 'bg-zinc-700'}`}></div>
              <span className="font-bold block text-[10px]">Siren</span>
              <span className="text-[8px] font-mono text-zinc-400">GPIO 27</span>
            </div>
          </div>
        </div>

        {/* Checkpoint 1 Physical Node Status */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              Checkpoint 1 – Main Gate
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {cp1Device?.status || 'ONLINE'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Reader:</span>
              <span className="text-white font-mono">MFRC522 (13.56 MHz)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>IP Address:</span>
              <span className="text-white font-mono">{cp1Device?.ip_address || '192.168.1.101'}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Camera:</span>
              <span className="text-emerald-400 font-mono font-semibold">ESP32-CAM (Armed)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Last Scan:</span>
              <span className="text-zinc-300 font-mono">{cp1LastScan?.rfid_uid || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Checkpoint 2 Physical Node Status */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-purple-400" />
              Checkpoint 2 – Lab Gate
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {cp2Device?.status || 'ONLINE'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Reader:</span>
              <span className="text-white font-mono">MFRC522 (13.56 MHz)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>IP Address:</span>
              <span className="text-white font-mono">{cp2Device?.ip_address || '192.168.1.105'}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Camera:</span>
              <span className="text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                Not Installed
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Last Scan:</span>
              <span className="text-zinc-300 font-mono">{cp2LastScan?.rfid_uid || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Checkpoint 1 Camera & Surveillance Status */}
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Perimeter Optical Surveillance
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              activeAlarm
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {activeAlarm ? 'SECURITY INCIDENT ACTIVE' : 'SURVEILLANCE ARMED'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Automatic snapshot capture triggered on unauthorized checkouts and unregistered RFID tags at Checkpoint 1. Checkpoint 2 logs events without camera.
          </p>
        </div>
      </div>

      {/* Live Event Stream Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Live Real-time Scan Feed</h3>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Checkpoints (CP1 + CP2)</option>
              <option value="CP1">Checkpoint 1 – Main Entrance Gate</option>
              <option value="CP2">Checkpoint 2 – Lab/Secondary Gate</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">RFID UID</th>
                <th className="p-4">Detected Item</th>
                <th className="p-4">Gate Node</th>
                <th className="p-4">Security Decision</th>
                <th className="p-4 pr-6">Actuator Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredScans.length > 0 ? (
                filteredScans.map((scan) => {
                  const badge = getResultBadge(scan.result);
                  const Icon = badge.icon;

                  return (
                    <tr key={scan.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-4 pl-6 text-zinc-400 font-mono text-[11px]">
                        {formatTimeSafe(scan.timestamp || scan.created_at)}
                      </td>
                      <td className="p-4 font-mono font-bold text-blue-400">{scan.rfid_uid}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {scan.asset_name || <span className="text-zinc-500 italic">Unregistered Card</span>}
                        </div>
                        {scan.asset_code && (
                          <span className="text-[10px] font-mono text-zinc-500">{scan.asset_code}</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 text-[11px]">{scan.checkpoint_name || scan.device_code}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider inline-flex items-center gap-1.5 ${badge.pill}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.text}</span>
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-zinc-400 text-[11px] font-mono">
                        {scan.action_taken}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No RFID scan events logged yet. Tap a tag on the IoT Test Bench.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
