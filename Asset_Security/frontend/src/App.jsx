import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full bg-[#121214] border border-zinc-800 rounded-[2rem] p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">CampusAssetSecurity</h1>
              <p className="text-xs text-zinc-400">Smart Campus Asset Security System</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Phase 1 Ready
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Frontend</span>
            <span className="font-semibold text-white mt-1">React 19 + Vite</span>
            <span className="text-[10px] text-zinc-400 mt-1">Tailwind CSS</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Backend</span>
            <span className="font-semibold text-white mt-1">Node.js + Express</span>
            <span className="text-[10px] text-zinc-400 mt-1">Socket.IO Live Feed</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Database</span>
            <span className="font-semibold text-white mt-1">MySQL 8.x</span>
            <span className="text-[10px] text-zinc-400 mt-1">16 Relational Tables</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Hardware</span>
            <span className="font-semibold text-white mt-1">ESP32 + CAM</span>
            <span className="text-[10px] text-zinc-400 mt-1">MFRC522 RFID</span>
          </div>
        </div>
      </div>
    </div>
  );
}

