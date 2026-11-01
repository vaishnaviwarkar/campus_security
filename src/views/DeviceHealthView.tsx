import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Radio, Cpu, Camera, CheckCircle2, AlertTriangle, RefreshCw, VolumeX, Lightbulb, Server } from 'lucide-react';
import { api } from '../services/api';
import { IoTDevice } from '../types';
import { CheckpointStatusPanel } from '../components/CheckpointStatusPanel';
import { socketService } from '../services/socket';
import { formatTimeSafe } from '../utils/formatDate';

export const DeviceHealthView: React.FC = () => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.getIoTDevices();
      if (res.success) setDevices(res.devices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Listen to real-time device heartbeat packets
    const unsubHeartbeat = socketService.onHeartbeat((updatedDevice: IoTDevice) => {
      setDevices((prev) => {
        const index = prev.findIndex((d) => d.device_code === updatedDevice.device_code);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...updatedDevice };
          return updated;
        }
        return [...prev, updatedDevice];
      });
    });

    return () => {
      unsubHeartbeat();
    };
  }, []);

  const handleDispatchCommand = async (deviceCode: string, command: string) => {
    try {
      await api.sendActuatorCommand(deviceCode, command);
      setActionFeedback({
        message: `Actuator command '${command}' dispatched to node [${deviceCode}]`,
        type: 'success'
      });
      fetchDevices();
    } catch (err: any) {
      setActionFeedback({
        message: err.message || 'Failed to dispatch actuator command',
        type: 'error'
      });
    } finally {
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            IoT Edge Device Health & Checkpoint Telemetry
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor ESP32 checkpoint microcontrollers, ESP32-CAM nodes, Wi-Fi RSSI signals, and firmware versions
          </p>
        </div>

        <button
          onClick={fetchDevices}
          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Heartbeats</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dedicated Checkpoint Status Panel for CP1 and CP2 */}
      <CheckpointStatusPanel devices={devices} onRefresh={fetchDevices} />

      {/* All Edge Nodes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            All Deployed IoT Hardware Nodes & Enclosures
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">{devices.length} Nodes Online</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && devices.length === 0 ? (
            <div className="col-span-3 p-8 text-center text-zinc-500 text-xs animate-pulse">
              Querying edge IoT nodes...
            </div>
          ) : devices.length > 0 ? (
            devices.map((dev) => (
              <div
                key={dev.id}
                className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-zinc-900 rounded-xl text-blue-400 border border-zinc-800">
                        {dev.device_type === 'ESP32_CAM' ? <Camera className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{dev.device_code}</h3>
                        <span className="text-[10px] text-zinc-500 font-mono">{dev.device_type}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      dev.status === 'ONLINE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {dev.status}
                    </span>
                  </div>

                  {/* Specs List */}
                  <div className="space-y-2 mt-5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Location:</span>
                      <span className="text-white font-medium">{dev.checkpoint_name || 'Checkpoint 1'}</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>IP Address:</span>
                      <span className="text-white font-mono">{dev.ip_address}</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>MAC Address:</span>
                      <span className="text-zinc-400 font-mono text-[11px]">{dev.mac_address}</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Firmware Version:</span>
                      <span className="text-zinc-300 font-mono">v{dev.firmware_version}</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Signal Strength (RSSI):</span>
                      <span className="text-emerald-400 font-mono font-bold">{dev.rssi || -55} dBm</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Last Heartbeat:</span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {formatTimeSafe(dev.last_seen)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remote Actuator Trigger Row */}
                <div className="pt-4 border-t border-zinc-800/80 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Remote Diagnostic Controls</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      onClick={() => handleDispatchCommand(dev.device_code, 'GREEN_LED_ON')}
                      className="p-1.5 bg-zinc-900 hover:bg-emerald-600/20 text-zinc-300 hover:text-emerald-400 rounded-xl border border-zinc-800 transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Lightbulb className="w-3 h-3 text-emerald-400" />
                      <span>Test Green LED</span>
                    </button>

                    <button
                      onClick={() => handleDispatchCommand(dev.device_code, 'RESET_ALARM')}
                      className="p-1.5 bg-zinc-900 hover:bg-amber-600/20 text-zinc-300 hover:text-amber-400 rounded-xl border border-zinc-800 transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <VolumeX className="w-3 h-3 text-amber-400" />
                      <span>Reset Siren</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-8 text-center text-zinc-500 text-xs">
              No IoT devices currently detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
