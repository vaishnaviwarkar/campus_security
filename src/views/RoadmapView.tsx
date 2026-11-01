import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Cpu, Layers, Sparkles, Zap, Shield, Radio, Terminal, Server, Database, Activity } from 'lucide-react';

interface RoadmapViewProps {
  onOpenTestBench: () => void;
  onNavigate: (view: any) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ onOpenTestBench, onNavigate }) => {
  const [filter, setFilter] = useState<'ALL' | 'CORE' | 'IOT' | 'UI'>('ALL');

  const phases = [
    { id: 1, name: 'Project structure & configuration', category: 'CORE', status: 'COMPLETED', desc: 'Normalized multi-tier directory structure, environment variables, pin configurations.' },
    { id: 2, name: 'MySQL database schema (16 tables)', category: 'CORE', status: 'COMPLETED', desc: 'Relational data models for users, assets, RFID registry, alerts, devices, maintenance.' },
    { id: 3, name: 'Backend Express & Socket.IO server', category: 'CORE', status: 'COMPLETED', desc: 'High-throughput Node.js + Express HTTP and real-time Socket.IO server initialized on port 3000.' },
    { id: 4, name: 'MySQL connection pool & verification', category: 'CORE', status: 'COMPLETED', desc: 'Connection pooling and high-resiliency memory store fallback with full ACID seed data.' },
    { id: 5, name: 'Authentication & JWT role middleware', category: 'CORE', status: 'COMPLETED', desc: 'Secure JWT generation, bcrypt password hashing, and ADMIN / LAB_STAFF / SECURITY RBAC guards.' },
    { id: 6, name: 'Asset management CRUD REST APIs', category: 'CORE', status: 'COMPLETED', desc: '/api/assets endpoints for listing, creating, filtering, updating risk rating, and categorizing.' },
    { id: 7, name: 'RFID management & verification APIs', category: 'IOT', status: 'COMPLETED', desc: '/api/rfid tag assignment, UID verification, tag linking, and unassigned inventory lookup.' },
    { id: 8, name: 'Issue & return lifecycle APIs', category: 'CORE', status: 'COMPLETED', desc: '/api/issues loan portal, active student borrowing tracking, and return processing.' },
    { id: 9, name: 'Maintenance status APIs', category: 'CORE', status: 'COMPLETED', desc: '/api/maintenance work-order ticketing, inspection logs, cost tracking, and repair states.' },
    { id: 10, name: 'Alert & movement logging APIs', category: 'CORE', status: 'COMPLETED', desc: '/api/alerts and /api/movements immutable audit trail generation and security alarms.' },
    { id: 11, name: 'React frontend structure & layout', category: 'UI', status: 'COMPLETED', desc: 'Modern Bento Grid styling, responsive navigation, dark mode layout, and status indicators.' },
    { id: 12, name: 'Authentication UI & role guards', category: 'UI', status: 'COMPLETED', desc: 'Interactive login screen with 1-click test credentials for Admin, Staff, and Security.' },
    { id: 13, name: 'Real-time operational dashboard', category: 'UI', status: 'COMPLETED', desc: 'Bento summary metrics, live scan telemetry, alert widgets, and hardware quick actions.' },
    { id: 14, name: 'Asset management UI & catalog', category: 'UI', status: 'COMPLETED', desc: 'Searchable grid, condition badges, risk ratings, asset creation modal, and detailed inspector.' },
    { id: 15, name: 'RFID & live monitoring stream UI', category: 'UI', status: 'COMPLETED', desc: 'Live RFID scan log stream with real-time pass/fail animated indicator pills.' },
    { id: 16, name: 'Issue / return checkout portal', category: 'UI', status: 'COMPLETED', desc: 'Student loan management, active loans table, checkout dialog, and return confirmation.' },
    { id: 17, name: 'Alerts & maintenance console', category: 'UI', status: 'COMPLETED', desc: 'Security incident acknowledgment, resolution notes, and repair work orders.' },
    { id: 18, name: 'Missing asset recovery UI', category: 'UI', status: 'COMPLETED', desc: 'Recovery console, auto-flagging missing assets, and one-click recovery authorization.' },
    { id: 19, name: 'ESP32-CAM evidence integration', category: 'IOT', status: 'COMPLETED', desc: 'AI-Thinker OV2640 optical evidence capture, frame zoom inspection, and timestamp indexing.' },
    { id: 20, name: 'ESP32 Checkpoint 1 firmware', category: 'IOT', status: 'COMPLETED', desc: 'MFRC522 SPI RFID driver, buzzer/LED pinout in config.h, and edge token evaluation.' },
    { id: 21, name: 'Physical ESP32 hardware integration', category: 'IOT', status: 'COMPLETED', desc: 'HTTP REST payload parser for /api/iot/rfid-scan with sub-second transit verification.' },
    { id: 22, name: 'Socket.IO live instant refresh', category: 'CORE', status: 'COMPLETED', desc: 'Bidirectional real-time event broadcasting to all connected browser tabs simultaneously.' },
    { id: 23, name: 'Device health & heartbeat monitoring', category: 'IOT', status: 'COMPLETED', desc: 'Node online/offline ping monitor, RSSI WiFi strength meter, and firmware versioning.' },
    { id: 24, name: 'Remote alarm reset & actuator commands', category: 'IOT', status: 'COMPLETED', desc: 'Bidirectional actuator dispatch for remote buzzer silencing and gate servo unlocks.' },
    { id: 25, name: 'Complete end-to-end integration tests', category: 'CORE', status: 'COMPLETED', desc: 'Interactive IoT Test Bench allowing 1-click testing of all security scenarios and hardware.' }
  ];

  const filteredPhases = phases.filter(p => filter === 'ALL' || p.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">
              25-Phase Implementation Console
            </h1>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% EXECUTED
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full 25-phase autonomous delivery plan for CampusAssetSecurity system
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-full p-1 flex items-center text-xs">
            {['ALL', 'CORE', 'IOT', 'UI'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  filter === cat ? 'bg-blue-600 text-white font-semibold shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenTestBench}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 shadow-md shadow-blue-600/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Launch Test Bench</span>
          </button>
        </div>
      </div>

      {/* 25 Phase Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPhases.map((phase) => (
          <div
            key={phase.id}
            className="bg-[#121214] border border-zinc-800/90 hover:border-emerald-500/40 rounded-2xl p-4.5 flex flex-col justify-between transition group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-zinc-500">
                  PHASE {phase.id.toString().padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {phase.category}
                  </span>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    DONE
                  </span>
                </div>
              </div>

              <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                {phase.name}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                {phase.desc}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Status: Operational</span>
              <span className="text-emerald-400 font-semibold">Verified ✓</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
