import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Eye, CheckCircle2, Search, AlertTriangle, Radio } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';

export const MissingAssetsView: React.FC = () => {
  const [missingAssets, setMissingAssets] = useState<Asset[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Flag Missing Modal
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [flagReason, setFlagReason] = useState('Unaccounted during quarterly physical lab inventory audit');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [missRes, allRes] = await Promise.all([
        api.getMissingAssets(),
        api.getAssets()
      ]);
      if (missRes.success) setMissingAssets(missRes.missingAssets);
      if (allRes.success) setAllAssets(allRes.assets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFlagMissing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return alert('Select an asset');

    try {
      await api.flagMissingAsset({
        asset_id: Number(selectedAssetId),
        reason: flagReason
      });
      setIsFlagModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error flagging asset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Missing Asset Surveillance Console
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
              ARMED AT GATES
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Assets flagged missing will instantly trip the Red LED, siren buzzer, security camera snapshot, and critical incident alerts when scanned at any checkpoint.
          </p>
        </div>

        <button
          onClick={() => setIsFlagModalOpen(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-red-600/25"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Flag Asset as Missing</span>
        </button>
      </div>

      {/* Missing Items Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-zinc-500 text-xs animate-pulse">
            Loading missing asset surveillance list...
          </div>
        ) : missingAssets.length > 0 ? (
          missingAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-[#121214] border border-red-900/50 rounded-[2rem] p-5 space-y-4 hover:border-red-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                    {asset.asset_code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                    ACTIVE SURVEILLANCE
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3">{asset.asset_name}</h3>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{asset.description || 'No description provided.'}</p>

                <div className="space-y-1 mt-4 pt-3 border-t border-zinc-800 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Department:</span>
                    <span className="text-zinc-200">{asset.department}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>RFID Tag UID:</span>
                    <span className="text-blue-400 font-mono font-bold">{asset.rfid_uid || 'Unbound'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Risk Severity:</span>
                    <span className="text-red-400 font-bold">{asset.risk_score} pts (HIGH)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Gate Intercept Ready</span>
                <span className="text-red-400 font-medium">Buzzer Trigger: Yes</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-[#121214] border border-zinc-800 rounded-[2rem] p-12 text-center text-zinc-500 text-xs">
            No assets currently flagged as missing. All equipment accounted for.
          </div>
        )}
      </div>

      {/* Flag Missing Modal */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Arm Missing Asset Alarm
            </h2>

            <form onSubmit={handleFlagMissing} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Select Asset to Flag</label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Choose Asset --</option>
                  {allAssets.filter(a => a.status !== 'MISSING').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} ({a.asset_code}) - {a.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Report Reason / Notes</label>
                <textarea
                  rows={3}
                  required
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Details regarding missing circumstance or audit discrepancy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-red-600/20"
                >
                  Arm Gate Alarms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
