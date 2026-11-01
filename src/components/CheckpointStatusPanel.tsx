import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Wifi,
  Radio,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Zap,
  Send,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { IoTDevice } from '../types';
import { socketService, getSocket } from '../services/socket';
import { api } from '../services/api';
import { formatTimeSafe, formatElapsedSafe } from '../utils/formatDate';

export interface CheckpointStatusPanelProps {
  devices?: IoTDevice[];
  onRefresh?: () => void;
  className?: string;
}

interface NodeTelemetryState {
  device_code: string;
  checkpoint_label: 'CP1' | 'CP2';
  checkpoint_name: string;
  location: string;
  ip_address: string;
  mac_address: string;
  firmware_version: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  last_seen: string;
  rssi: number;
  heartbeatCount: number;
  lastHeartbeatReceivedAt?: number;
}

const DEFAULT_CP_NODES: Record<'CP1' | 'CP2', Partial<NodeTelemetryState>> = {
  CP1: {
    device_code: 'ESP32-CP01-GATE',
    checkpoint_label: 'CP1',
    checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
    location: 'Perimeter Gate 1',
    ip_address: '192.168.1.101',
    mac_address: '24:6F:28:B1:01:A4',
    firmware_version: 'v2.4.1',
    status: 'ONLINE',
    rssi: -58
  },
  CP2: {
    device_code: 'ESP32-CP02-GATE',
    checkpoint_label: 'CP2',
    checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
    location: 'Turing Hall CS Lab',
    ip_address: '192.168.1.105',
    mac_address: '24:6F:28:B1:02:C0',
    firmware_version: 'v2.4.1',
    status: 'ONLINE',
    rssi: -52
  }
};

export const CheckpointStatusPanel: React.FC<CheckpointStatusPanelProps> = ({
  devices: propDevices,
  onRefresh,
  className = ''
}) => {
  const [internalDevices, setInternalDevices] = useState<IoTDevice[]>([]);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [pingingNode, setPingingNode] = useState<string | null>(null);
  const [recentPulseNode, setRecentPulseNode] = useState<string | null>(null);
  const [heartbeatCounts, setHeartbeatCounts] = useState<Record<string, number>>({
    'ESP32-CP01-GATE': 1,
    'ESP32-CP02-LAB': 1
  });
  const [now, setNow] = useState<number>(Date.now());
  const [socketConnected, setSocketConnected] = useState<boolean>(true);

  // Sync internal devices when props change
  useEffect(() => {
    if (propDevices && propDevices.length > 0) {
      setInternalDevices(propDevices);
    }
  }, [propDevices]);

  // If no props passed, fetch initially
  useEffect(() => {
    if (!propDevices || propDevices.length === 0) {
      api.getIoTDevices()
        .then((res) => {
          if (res.success && res.devices) {
            setInternalDevices(res.devices);
          }
        })
        .catch((err) => console.error('[CheckpointStatusPanel] Failed to fetch devices', err));
    }
  }, []);

  // Update a live timer every second to compute fresh elapsed times
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      const socket = getSocket();
      setSocketConnected(socket.connected);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to real-time socket events for heartbeats and alarm resets
  useEffect(() => {
    const unsubHeartbeat = socketService.onHeartbeat((updatedDevice: IoTDevice) => {
      setInternalDevices((prev) => {
        const index = prev.findIndex((d) => d.device_code === updatedDevice.device_code);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...updatedDevice };
          return updated;
        }
        return [...prev, updatedDevice];
      });

      // Pulse indicator & increment counter
      setRecentPulseNode(updatedDevice.device_code);
      setHeartbeatCounts((prev) => ({
        ...prev,
        [updatedDevice.device_code]: (prev[updatedDevice.device_code] || 0) + 1
      }));

      setTimeout(() => {
        setRecentPulseNode((curr) => (curr === updatedDevice.device_code ? null : curr));
      }, 1500);
    });

    const unsubReset = socketService.onAlarmReset(() => {
      // Alarm reset received
    });

    return () => {
      unsubHeartbeat();
      unsubReset();
    };
  }, []);

  // Extract CP1 and CP2 nodes
  const nodes = useMemo(() => {
    const devList = internalDevices.length > 0 ? internalDevices : (propDevices || []);

    const cp1Match = devList.find(
      (d) =>
        d.device_code === 'ESP32-CP01-GATE' ||
        d.device_code?.includes('CP01') ||
        d.checkpoint_name?.includes('Checkpoint 1')
    );

    const cp2Match = devList.find(
      (d) =>
        d.device_code === 'ESP32-CP02-GATE' ||
        d.device_code === 'ESP32-CP02-LAB' ||
        d.device_code?.includes('CP02') ||
        d.checkpoint_name?.includes('Checkpoint 2')
    );

    const cp1: NodeTelemetryState = {
      ...DEFAULT_CP_NODES.CP1,
      ...cp1Match,
      checkpoint_label: 'CP1',
      checkpoint_name: cp1Match?.checkpoint_name || DEFAULT_CP_NODES.CP1.checkpoint_name!,
      location: (cp1Match as any)?.location_name || DEFAULT_CP_NODES.CP1.location!,
      ip_address: cp1Match?.ip_address || DEFAULT_CP_NODES.CP1.ip_address!,
      mac_address: cp1Match?.mac_address || DEFAULT_CP_NODES.CP1.mac_address!,
      firmware_version: cp1Match?.firmware_version || DEFAULT_CP_NODES.CP1.firmware_version!,
      status: (cp1Match?.status as any) || 'ONLINE',
      last_seen: cp1Match?.last_seen || new Date().toISOString(),
      rssi: cp1Match?.rssi ?? -58,
      device_code: cp1Match?.device_code || 'ESP32-CP01-GATE',
      heartbeatCount: heartbeatCounts[cp1Match?.device_code || 'ESP32-CP01-GATE'] || 1
    };

    const cp2: NodeTelemetryState = {
      ...DEFAULT_CP_NODES.CP2,
      ...cp2Match,
      checkpoint_label: 'CP2',
      checkpoint_name: cp2Match?.checkpoint_name || DEFAULT_CP_NODES.CP2.checkpoint_name!,
      location: (cp2Match as any)?.location_name || DEFAULT_CP_NODES.CP2.location!,
      ip_address: cp2Match?.ip_address || DEFAULT_CP_NODES.CP2.ip_address!,
      mac_address: cp2Match?.mac_address || DEFAULT_CP_NODES.CP2.mac_address!,
      firmware_version: cp2Match?.firmware_version || DEFAULT_CP_NODES.CP2.firmware_version!,
      status: (cp2Match?.status as any) || 'ONLINE',
      last_seen: cp2Match?.last_seen || new Date().toISOString(),
      rssi: cp2Match?.rssi ?? -52,
      device_code: cp2Match?.device_code || 'ESP32-CP02-GATE',
      heartbeatCount: heartbeatCounts[cp2Match?.device_code || 'ESP32-CP02-GATE'] || 1
    };

    return [cp1, cp2];
  }, [internalDevices, propDevices, heartbeatCounts]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleSendHeartbeat = async (deviceCode: string) => {
    setPingingNode(deviceCode);
    try {
      const node = nodes.find((n) => n.device_code === deviceCode);
      const randomRssi = Math.floor(Math.random() * 8) - 60;
      await api.sendSimulatedHeartbeat({
        device_code: deviceCode,
        ip_address: node?.ip_address,
        rssi: randomRssi
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to trigger heartbeat ping:', err);
    } finally {
      setTimeout(() => setPingingNode(null), 400);
    }
  };

  const handlePingAll = async () => {
    setPingingNode('ALL');
    try {
      await Promise.all(
        nodes.map((node) =>
          api.sendSimulatedHeartbeat({
            device_code: node.device_code,
            ip_address: node.ip_address,
            rssi: Math.floor(Math.random() * 8) - 60
          })
        )
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to ping all nodes:', err);
    } finally {
      setTimeout(() => setPingingNode(null), 400);
    }
  };

  const formatElapsed = (isoTimestamp: string) => {
    return formatElapsedSafe(isoTimestamp, now);
  };

  const formatClockTime = (isoTimestamp: string) => {
    return formatTimeSafe(isoTimestamp);
  };

  const getRssiRating = (rssi: number) => {
    if (rssi >= -55) return { label: 'Excellent', color: 'text-emerald-400', bars: 4 };
    if (rssi >= -65) return { label: 'Good', color: 'text-emerald-400', bars: 3 };
    if (rssi >= -75) return { label: 'Fair', color: 'text-amber-400', bars: 2 };
    return { label: 'Weak', color: 'text-red-400', bars: 1 };
  };

  return (
    <div
      id="checkpoint-status-panel"
      className={`bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl ${className}`}
    >
      {/* Top Banner / Bar */}
      <div className="px-6 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-zinc-900/40 to-transparent flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Radio className="w-4 h-4" />
            <span
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                IoT Checkpoint Telemetry Matrix
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Socket Stream
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Dedicated real-time telemetry, IP network endpoints & heartbeat latency for primary access control nodes
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePingAll}
            disabled={pingingNode !== null}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            title="Dispatch heartbeat ping to all checkpoint nodes"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${pingingNode === 'ALL' ? 'animate-bounce' : ''}`} />
            <span>Ping All Nodes</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Individual Nodes (CP1 and CP2) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {nodes.map((node) => {
          const isPulsing = recentPulseNode === node.device_code;
          const isPinging = pingingNode === node.device_code || pingingNode === 'ALL';
          const rssiInfo = getRssiRating(node.rssi);
          const isOnline = node.status === 'ONLINE';

          return (
            <div
              key={node.device_code}
              id={`node-telemetry-${node.checkpoint_label.toLowerCase()}`}
              className={`relative bg-zinc-950/60 border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between ${
                isPulsing
                  ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Pulse ripple badge when heartbeat arrives */}
              {isPulsing && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                  <Activity className="w-3 h-3 animate-spin" />
                  <span>HEARTBEAT INGESTED</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Node Identity & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                          {node.checkpoint_label}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {node.device_code}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium mt-0.5">
                        {node.checkpoint_name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {node.location}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {!isPulsing && (
                    <div className="flex flex-col items-end">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide border ${
                          isOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                          }`}
                        />
                        {node.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Telemetry Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {/* IP Address Card */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-semibold">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-blue-400" />
                        IP Address
                      </span>
                      <button
                        onClick={() => handleCopyIp(node.ip_address)}
                        className="text-zinc-500 hover:text-zinc-200 transition cursor-pointer p-0.5"
                        title="Copy IP address"
                      >
                        {copiedIp === node.ip_address ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-xs font-mono font-bold text-white tracking-wide">
                        {node.ip_address}
                      </span>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center justify-between">
                        <span>Static IPv4</span>
                        <span>Port 80</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Heartbeat Card */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        Last Heartbeat
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {formatElapsed(node.last_seen)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-xs font-mono font-semibold text-zinc-200">
                        {formatClockTime(node.last_seen)}
                      </span>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center justify-between">
                        <span>Packets: {node.heartbeatCount}</span>
                        <span className="text-zinc-400">Cadence: ~10s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Telemetry Specs Row */}
                <div className="bg-black/40 border border-zinc-850 rounded-xl p-3 space-y-2 text-xs">
                  {/* Wi-Fi RSSI */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                      <Wifi className="w-3 h-3 text-zinc-500" />
                      Wi-Fi Signal (RSSI):
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-end gap-0.5 h-3">
                        <div
                          className={`w-1 rounded-sm ${
                            rssiInfo.bars >= 1 ? 'bg-emerald-400 h-1.5' : 'bg-zinc-700 h-1.5'
                          }`}
                        />
                        <div
                          className={`w-1 rounded-sm ${
                            rssiInfo.bars >= 2 ? 'bg-emerald-400 h-2' : 'bg-zinc-700 h-2'
                          }`}
                        />
                        <div
                          className={`w-1 rounded-sm ${
                            rssiInfo.bars >= 3 ? 'bg-emerald-400 h-2.5' : 'bg-zinc-700 h-2.5'
                          }`}
                        />
                        <div
                          className={`w-1 rounded-sm ${
                            rssiInfo.bars >= 4 ? 'bg-emerald-400 h-3' : 'bg-zinc-700 h-3'
                          }`}
                        />
                      </div>
                      <span className={`font-mono text-[11px] font-bold ${rssiInfo.color}`}>
                        {node.rssi} dBm
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">({rssiInfo.label})</span>
                    </div>
                  </div>

                  {/* MAC Address & Firmware */}
                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 text-[11px]">
                    <span className="text-zinc-400">MAC Hardware ID:</span>
                    <span className="text-zinc-300 font-mono text-[11px]">{node.mac_address}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 text-[11px]">
                    <span className="text-zinc-400">Firmware Build:</span>
                    <span className="text-zinc-300 font-mono text-[11px]">
                      {node.firmware_version} (FreeRTOS)
                    </span>
                  </div>


                  {/* Optical Camera Hardware Status */}
                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 text-[11px]">
                    <span className="text-zinc-400">Optical Camera:</span>
                    {node.checkpoint_label === 'CP1' ? (
                      <span className="font-mono text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>ESP32-CAM (ONLINE)</span>
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-semibold text-zinc-400 flex items-center gap-1 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                        <span>Camera: Not Installed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Node Diagnostic Action Footer */}
              <div className="pt-4 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Telemetry Channel: WS/HTTP
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendHeartbeat(node.device_code)}
                    disabled={isPinging}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className={`w-3 h-3 text-blue-400 ${isPinging ? 'animate-ping' : ''}`} />
                    <span>{isPinging ? 'Pinging...' : 'Send Heartbeat'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckpointStatusPanel;
