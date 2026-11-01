import React, { useState } from 'react';
import {
  Cpu,
  X,
  CreditCard,
  AlertTriangle,
  Radio,
  Camera,
  Activity,
  VolumeX,
  CheckCircle2,
  XCircle,
  Zap,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';

interface IoTTestBenchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const IoTTestBenchModal: React.FC<IoTTestBenchModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [customUID, setCustomUID] = useState('B72A5C19');
  const [selectedDevice, setSelectedDevice] = useState('ESP32-CP01-GATE');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(1);
  if (!isOpen) return null;

  const handleTestScan = async (uid: string) => {
    setLoading(true);
    try {
      const res = await api.sendSimulatedScan({
        rfid_uid: uid,
        device_code: selectedDevice,
        checkpoint_id: selectedCheckpoint
      });
      setLastResponse(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setLastResponse({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleHeartbeat = async () => {
    setLoading(true);
    try {
      const res = await api.sendSimulatedHeartbeat({
        device_code: selectedDevice,
        ip_address: '192.168.1.105',
        rssi: -58
      });
      setLastResponse(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setLastResponse({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAlarm = async () => {
    setLoading(true);
    try {
      const res = await api.sendActuatorCommand(selectedDevice, 'RESET_ALARM');
      setLastResponse(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setLastResponse({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCamera = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/camera/trigger-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_code: 'ESP32-CAM-HW381-OV3660',
          checkpoint_id: selectedCheckpoint,
          trigger_type: 'SIMULATED_UNAUTHORIZED_CHECKOUT',
          burst_count: 3
        })
      });
      const data = await response.json();
      setLastResponse(data);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setLastResponse({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">ESP32 & IoT Test Bench</h2>
              <p className="text-xs text-zinc-400">Simulate physical hardware HTTP REST requests & actuator responses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Checkpoint Target Selector */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Target IoT Checkpoint Node
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Direct all RFID scans, optical evidence triggers, and actuator dispatches to the selected edge controller:
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedCheckpoint(1);
                  setSelectedDevice('ESP32-CP01-GATE');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCheckpoint === 1
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>CP1: Main Gate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/30">Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCheckpoint(2);
                  setSelectedDevice('ESP32-CP02-GATE');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCheckpoint === 2
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>CP2: Lab Gate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">No Camera</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Test Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                1-Click Hardware Test Scenarios (Targeting Checkpoint {selectedCheckpoint})
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Node: {selectedDevice}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <button
                disabled={loading}
                onClick={() => handleTestScan('E2801120000018')}
                className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Authorized Loan</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white">Tektronix Oscilloscope</div>
                  <div className="text-[10px] font-mono text-zinc-400">UID: E2801120000018</div>
                </div>
                <span className="text-[10px] text-emerald-300 mt-2 font-medium">→ Green LED ON @ CP{selectedCheckpoint}</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleTestScan('E2806894000040')}
                className="p-3.5 rounded-2xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-red-400">Returned Asset (In Stand)</span>
                  <XCircle className="w-4 h-4 text-red-400 group-hover:scale-110 transition" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white">Dell Workstation (History Saved)</div>
                  <div className="text-[10px] font-mono text-zinc-400">UID: E2806894000040</div>
                </div>
                <span className="text-[10px] text-red-300 mt-2 font-medium">
                  {selectedCheckpoint === 1 ? '→ Unchecked Out Exit Blocked • CP1 Camera Snap' : '→ Exit Blocked • Red LED + Siren @ CP2'}
                </span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleTestScan('E2809930000099')}
                className="p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Missing Asset Alert</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white">Sony Cinema Rig</div>
                  <div className="text-[10px] font-mono text-zinc-400">UID: E2809930000099</div>
                </div>
                <span className="text-[10px] text-amber-300 mt-2 font-medium">
                  {selectedCheckpoint === 1 ? '→ Red LED + Siren + Camera Snapshot' : '→ Red LED + Siren (No Cam @ CP2)'}
                </span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleTestScan('99AA0011')}
                className="p-3.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400">Unregistered RFID</span>
                  <XCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white">Unknown Tag</div>
                  <div className="text-[10px] font-mono text-zinc-400">UID: 99AA0011</div>
                </div>
                <span className="text-[10px] text-purple-300 mt-2 font-medium">
                  {selectedCheckpoint === 1 ? '→ Red LED + Siren + Camera Snapshot' : '→ Red LED + Siren (No Cam @ CP2)'}
                </span>
              </button>
            </div>
          </div>

          {/* Actuator Reset & Auxiliary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              disabled={loading}
              onClick={handleResetAlarm}
              className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Silence Alarm ({selectedDevice})</span>
            </button>

            <button
              disabled={loading || selectedCheckpoint === 2}
              onClick={handleSimulateCamera}
              className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center space-x-2 transition cursor-pointer ${
                selectedCheckpoint === 2
                  ? 'bg-zinc-950 border-zinc-850 text-zinc-600 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}
              title={selectedCheckpoint === 2 ? 'Camera Not Installed at Checkpoint 2' : 'Trigger ESP32-CAM'}
            >
              <Camera className={`w-4 h-4 ${selectedCheckpoint === 2 ? 'text-zinc-600' : 'text-blue-400'}`} />
              <span>
                {selectedCheckpoint === 2 ? 'Camera Not Installed @ CP2' : 'Trigger ESP32-CAM Snapshot (CP1)'}
              </span>
            </button>

            <button
              disabled={loading}
              onClick={handleHeartbeat}
              className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Send Heartbeat ({selectedDevice})</span>
            </button>
          </div>

          {/* Custom RFID UID Dispatcher */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Custom Payload Test
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-zinc-500 uppercase font-semibold">RFID Hex UID</label>
                <input
                  type="text"
                  value={customUID}
                  onChange={(e) => setCustomUID(e.target.value.toUpperCase())}
                  placeholder="e.g. B72A5C19 or C48E10AB"
                  className="w-full mt-1 px-3 py-2 bg-black border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  disabled={loading}
                  onClick={() => handleTestScan(customUID)}
                  className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Send HTTP POST</span>
                </button>
              </div>
            </div>
          </div>

          {/* Last Server Response Inspector */}
          {lastResponse && (
            <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase font-semibold">
                <span>Node.js Backend Response (JSON)</span>
                <span className={lastResponse.success ? 'text-emerald-400' : 'text-amber-400'}>
                  {lastResponse.result || (lastResponse.success ? 'OK 200' : 'ALERT')}
                </span>
              </div>
              <pre className="text-zinc-300 overflow-x-auto max-h-48 p-2 bg-zinc-950 rounded-xl text-[11px]">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0e0e10] rounded-b-[2rem] flex items-center justify-between text-xs text-zinc-500">
          <span>Target: <span className="font-mono text-zinc-300">POST /api/iot/rfid-scan</span></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Close Bench
          </button>
        </div>
      </div>
    </div>
  );
};
