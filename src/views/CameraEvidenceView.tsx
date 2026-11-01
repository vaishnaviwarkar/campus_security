import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, ZoomIn, X, MapPin, Play, Square, Download, Wifi, ShieldAlert, Cpu } from 'lucide-react';
import { CameraEvent } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { formatTimeSafe } from '../utils/formatDate';

interface CameraEvidenceViewProps {
  onOpenTestBench: () => void;
}

export const CameraEvidenceView: React.FC<CameraEvidenceViewProps> = ({ onOpenTestBench }) => {
  const [events, setEvents] = useState<CameraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<CameraEvent | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number>(1);

  // Live Camera Node configuration
  const [cameraIp, setCameraIp] = useState<string>(() => {
    return localStorage.getItem('esp32_cam_ip') || '';
  });
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [liveFrameUrl, setLiveFrameUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [camStatusMsg, setCamStatusMsg] = useState<string>('');
  const liveIntervalRef = useRef<any>(null);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.getCameraEvents();
      if (res.success) setEvents(res.events);
    } catch (err) {
      console.error('Failed to load camera evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();

    // Auto-sync stored camera IP to backend server on startup
    const storedIp = localStorage.getItem('esp32_cam_ip');
    if (storedIp && storedIp.trim()) {
      api.registerCameraIp(storedIp.trim()).catch(() => {});
    }

    // Subscribe to real-time automatic camera snapshots from backend
    const unsubscribe = socketService.onCameraEvidence((newEvent: any) => {
      setEvents((prev) => {
        // Prevent duplicate IDs
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [newEvent, ...prev];
      });
      setCamStatusMsg(`📸 Auto-captured optical evidence: ${newEvent.event_code} (${newEvent.trigger_type})`);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save IP to localStorage and sync with backend
  const handleIpChange = (newIp: string) => {
    setCameraIp(newIp);
    localStorage.setItem('esp32_cam_ip', newIp);
    if (newIp.trim()) {
      api.registerCameraIp(newIp.trim()).catch(() => {});
    }
  };

  // Toggle live streaming preview
  useEffect(() => {
    if (isLiveStreaming && cameraIp.trim()) {
      const cleanIp = cameraIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const refreshFrame = () => {
        setLiveFrameUrl(`/api/camera/proxy-frame?ip=${cleanIp}&t=${Date.now()}`);
      };

      refreshFrame();
      liveIntervalRef.current = setInterval(refreshFrame, 1500);
      setCamStatusMsg('Streaming live frames from ESP32-CAM (1.5s refresh)');
    } else {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
      setLiveFrameUrl('');
      setCamStatusMsg('');
    }

    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [isLiveStreaming, cameraIp]);

  // Capture from live hardware
  const handleCaptureFromHardware = async () => {
    if (!cameraIp.trim()) {
      alert('Please enter your ESP32-CAM IP address first (e.g., 192.168.43.150)');
      return;
    }

    setIsCapturing(true);
    setCamStatusMsg('Capturing 3-photo security burst sequence from ESP32-CAM OV3660...');
    try {
      const res = await fetch('/api/camera/trigger-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_ip: cameraIp,
          trigger_type: 'MANUAL_BURST_CAPTURE',
          burst_count: 3
        })
      });

      const data = await res.json();
      if (data.success) {
        setCamStatusMsg('3 consecutive security photos captured & saved to evidence log!');
        fetchEvidence();
      } else {
        setCamStatusMsg(`Capture error: ${data.message}`);
      }
    } catch (err: any) {
      setCamStatusMsg(`Failed to trigger capture: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Optical Evidence & Surveillance System
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
              AI-Thinker OV3660 / OV2640 (CP1 Only)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automatic optical frame capture triggered on missing asset transit, unauthorized checkout breaches & live inspection at Checkpoint 1
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Checkpoint Toggle Selector */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setSelectedCheckpoint(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCheckpoint === 1
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>CP1: Main Gate</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200">Armed</span>
            </button>
            <button
              onClick={() => setSelectedCheckpoint(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCheckpoint === 2
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>CP2: Lab Gate</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">No Camera</span>
            </button>
          </div>

          <button
            onClick={fetchEvidence}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition cursor-pointer"
            title="Refresh Evidence Gallery"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {selectedCheckpoint === 1 && (
            <button
              onClick={onOpenTestBench}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>IoT Test Bench</span>
            </button>
          )}
        </div>
      </div>

      {/* Checkpoint 2 Not Installed State */}
      {selectedCheckpoint === 2 ? (
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-500 mx-auto shadow-inner">
            <Camera className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono font-bold">
              CAMERA: NOT INSTALLED
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Checkpoint 2 (Secondary/Lab Gate) – Optical Unit Not Installed
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              Checkpoint 2 hardware architecture consists of an ESP32 microcontroller, MFRC522 RFID reader, audio buzzer, and dual LEDs. No optical camera module is physically installed or provisioned at Checkpoint 2.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setSelectedCheckpoint(1)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-md shadow-purple-600/20"
            >
              <Camera className="w-4 h-4" />
              <span>View Checkpoint 1 Camera Evidence</span>
            </button>
            <button
              onClick={onOpenTestBench}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              <span>Open IoT Test Bench</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Live Hardware Camera Integration Panel */}
          <div className="bg-[#121214] border border-purple-500/30 rounded-[1.75rem] p-5 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    Live ESP32-CAM Node Integration (HW-381 / OV3660)
                  </h2>
                  <span className="text-[10px] font-mono bg-purple-900/50 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Checkpoint 1 Node
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Connect to your live ESP32-CAM board over Wi-Fi. View real-time viewfinder frames and trigger evidence snapshots directly into MySQL.
                </p>
              </div>

              {/* IP Input & Action Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-initial">
                  <Wifi className="w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={cameraIp}
                    onChange={(e) => handleIpChange(e.target.value)}
                    placeholder="e.g. 192.168.43.150"
                    className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-36 font-mono"
                  />
                </div>

                <button
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isLiveStreaming
                      ? 'bg-red-600/90 hover:bg-red-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {isLiveStreaming ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Stream</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-green-400" />
                      <span>Live View</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCaptureFromHardware}
                  disabled={isCapturing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isCapturing ? 'Snapping 3 Frames...' : 'Snap 3-Photo Burst'}</span>
                </button>
              </div>
            </div>

            {/* Status Message */}
            {camStatusMsg && (
              <div className="mt-3 text-[11px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></span>
                <span>{camStatusMsg}</span>
              </div>
            )}

            {/* Live Viewfinder Frame */}
            {isLiveStreaming && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative aspect-video max-w-md w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                  {liveFrameUrl ? (
                    <img
                      src={liveFrameUrl}
                      alt="ESP32-CAM Live Feed"
                      className="w-full h-full object-cover"
                      onError={() => setCamStatusMsg('Cannot connect to ESP32-CAM at that IP. Ensure it is powered on and on the same Wi-Fi.')}
                    />
                  ) : (
                    <div className="text-xs text-zinc-500 font-mono">Initializing camera stream...</div>
                  )}
                  {/* Live badge overlay */}
                  <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                    LIVE OV3660
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>Hardware Node Status</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Camera is streaming directly from the OV3660 sensor at 640x480 resolution via HTTP endpoint <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-purple-300">/capture</code>.
                  </p>
                  <div className="flex gap-2 pt-1 font-mono text-[10px] text-zinc-500">
                    <span>Host: {cameraIp}</span>
                    <span>•</span>
                    <span>Format: JPEG</span>
                    <span>•</span>
                    <span>Storage: Direct RAM</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historical Evidence Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Captured Evidence Log ({events.length} frames)
                </h2>
                {events.some(e => e.is_real_hardware || (e.image_path && e.image_path.startsWith('/uploads'))) && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live ESP32-CAM Evidence Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (confirm('Clear all historical evidence frames from the gallery? Real captures will appear on new unauthorized tag scans.')) {
                      await fetch('/api/camera/events', { method: 'DELETE' });
                      fetchEvidence();
                    }
                  }}
                  className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition cursor-pointer"
                >
                  Clear Demo Frames
                </button>
                <span className="text-xs text-zinc-500 font-mono">Sorted by Most Recent</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((evt) => {
                const isRealHardware = evt.is_real_hardware || (evt.image_path && evt.image_path.startsWith('/uploads'));
                return (
                <div
                  key={evt.id}
                  className={`bg-[#121214] border ${isRealHardware ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-zinc-800'} hover:border-zinc-700 rounded-[1.75rem] overflow-hidden flex flex-col justify-between group transition shadow-sm`}
                >
                  {/* Visual Frame Container */}
                  <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/80">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>

                    {/* Camera Image Render */}
                    {evt.image_path ? (
                      <img
                        src={evt.image_path}
                        alt="Evidence Frame"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          // Fallback to placeholder if local file is missing
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}

                    {/* SVG Visual Surveillance Overlay */}
                    <div className="absolute inset-3 border border-red-500/30 rounded-lg flex flex-col justify-between p-2 z-10 pointer-events-none">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className={`flex items-center gap-1 ${isRealHardware ? 'text-emerald-400 font-bold' : 'text-red-400'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isRealHardware ? 'bg-emerald-400' : 'bg-red-500'} animate-ping`}></span>
                          {isRealHardware ? 'HARDWARE CAPTURE' : 'SNAPSHOT FALLBACK'}
                        </span>
                        <span className={isRealHardware ? 'text-emerald-400 font-mono' : 'text-zinc-400'}>
                          {isRealHardware ? 'LIVE OV3660' : 'SAMPLE ANGLE'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                        <span>GATE 1 [MAIN]</span>
                        <span>{formatTimeSafe(evt.captured_at || evt.timestamp)}</span>
                      </div>
                    </div>

                    {/* Zoom / Inspect Button */}
                    <button
                      onClick={() => setSelectedImage(evt)}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-[2px]"
                    >
                      <div className="px-3.5 py-1.5 bg-white/20 backdrop-blur rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Inspect Frame</span>
                      </div>
                    </button>
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${isRealHardware ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                          {evt.event_type || evt.trigger_type}
                        </span>
                        {isRealHardware ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            LIVE CAM
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            DEMO SAMPLE
                          </span>
                        )}
                        {evt.total_frames && evt.total_frames > 1 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-purple-400 animate-ping"></span>
                            Frame {evt.frame_index || 1}/{evt.total_frames}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatTimeSafe(evt.captured_at || evt.timestamp)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white line-clamp-1">
                        {evt.asset_name || 'Checkpoint Perimeter Intrusion'}
                      </h3>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        <span>{evt.checkpoint_name || 'Checkpoint 1 - Main Entrance'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Node: {evt.device_code}</span>
                      <span>{evt.file_size_bytes ? (evt.file_size_bytes / 1024).toFixed(1) + ' KB' : '45.0 KB'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </>
      )}

      {/* Inspect Modal with Burst Sequence Switcher */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Optical Evidence Inspection</h2>
                  {selectedImage.total_frames && selectedImage.total_frames > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                      Burst Sequence: Frame {selectedImage.frame_index || 1} of {selectedImage.total_frames}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono">Event #{selectedImage.id} — {selectedImage.event_type || selectedImage.trigger_type}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
              {selectedImage.image_path ? (
                <img
                  src={selectedImage.image_path}
                  alt="Full Evidence Frame"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Camera className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
                  <div className="text-sm font-bold text-white font-mono">{selectedImage.event_type}</div>
                </div>
              )}
            </div>

            {/* If this photo is part of a 3-frame burst, show all 3 frames */}
            {selectedImage.burst_group_id && (
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-2 font-semibold">
                  Multi-Frame Incident Burst ({events.filter(e => e.burst_group_id === selectedImage.burst_group_id).length} Frames Captured):
                </span>
                <div className="flex gap-2">
                  {events
                    .filter(e => e.burst_group_id === selectedImage.burst_group_id)
                    .map((frame) => (
                      <button
                        key={frame.id}
                        onClick={() => setSelectedImage(frame)}
                        className={`relative aspect-video w-24 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                          selectedImage.id === frame.id
                            ? 'border-purple-500 shadow-md shadow-purple-500/30 scale-105'
                            : 'border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={frame.image_path} alt="Burst thumb" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono px-1 rounded bg-black/80 text-white">
                          F{frame.frame_index || 1}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-mono text-zinc-400">
                <span>Tag UID: {selectedImage.rfid_uid || 'ENCLOSURE_BREACH'}</span>
                <span className="mx-2">•</span>
                <span>Node: {selectedImage.device_code}</span>
              </div>
              <div className="flex gap-2">
                {selectedImage.image_path && (
                  <a
                    href={selectedImage.image_path}
                    download="evidence_frame.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Frame</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
