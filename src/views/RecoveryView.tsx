import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, ShieldCheck, Search, Eye, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';
import { formatDateOnlySafe } from '../utils/formatDate';

export const RecoveryView: React.FC = () => {
  const [missingAssets, setMissingAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm Recover Modal
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [conditionRating, setConditionRating] = useState('GOOD');
  const [recoveryNotes, setRecoveryNotes] = useState('Intercepted and safely recovered at campus gate.');

  const fetchMissing = async () => {
    setLoading(true);
    try {
      const res = await api.getMissingAssets();
      if (res.success) setMissingAssets(res.missingAssets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissing();
  }, []);

  const handleConfirmRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      await api.confirmRecoveredAsset({
        asset_id: selectedAsset.id,
        condition_rating: conditionRating,
        notes: recoveryNotes
      });
      setSelectedAsset(null);
      fetchMissing();
    } catch (err: any) {
      alert(err.message || 'Error confirming recovery');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Asset Recovery & Reinstatement Console
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Process intercepted or found equipment, conduct physical integrity inspection, and reinstate to available inventory
          </p>
        </div>
      </div>

      {/* Recovery Candidate Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Pending Missing Items ({missingAssets.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Equipment</th>
                <th className="p-4">Department / Location</th>
                <th className="p-4">RFID Tag UID</th>
                <th className="p-4">Risk Profile</th>
                <th className="p-4">Reported On</th>
                <th className="p-4 pr-6 text-right">Recovery Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs animate-pulse">
                    Loading recovery queue...
                  </td>
                </tr>
              ) : missingAssets.length > 0 ? (
                missingAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{asset.asset_name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{asset.asset_code}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-zinc-200">{asset.department}</div>
                      <div className="text-[10px] text-zinc-500">{asset.location_name || 'Lab'}</div>
                    </td>

                    <td className="p-4 font-mono font-bold text-blue-400">
                      {asset.rfid_uid || 'Unbound'}
                    </td>

                    <td className="p-4">
                      <span className="text-red-400 font-bold">{asset.risk_score} pts (HIGH)</span>
                    </td>

                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateOnlySafe(asset.updated_at)}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setConditionRating(asset.condition_rating || 'GOOD');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1.5 ml-auto"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Confirm Recovered</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No missing assets pending recovery.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Rehabilitate Asset {selectedAsset.asset_code}
            </h2>

            <p className="text-xs text-zinc-400">
              Recovering <strong className="text-white">{selectedAsset.asset_name}</strong>. This will clear the gate alert and restore inventory status to <span className="text-emerald-400 font-bold">AVAILABLE</span>.
            </p>

            <form onSubmit={handleConfirmRecovery} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Post-Recovery Physical Condition</label>
                <select
                  value={conditionRating}
                  onChange={(e) => setConditionRating(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="EXCELLENT">Excellent - Intact</option>
                  <option value="GOOD">Good - Standard Condition</option>
                  <option value="FAIR">Fair - Minor Scratches</option>
                  <option value="DAMAGED">Damaged - Send to Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Recovery Log Notes</label>
                <textarea
                  rows={3}
                  value={recoveryNotes}
                  onChange={(e) => setRecoveryNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Confirm Reinstatement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
