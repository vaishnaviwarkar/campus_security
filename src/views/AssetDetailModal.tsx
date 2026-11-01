import React, { useEffect, useState } from 'react';
import {
  X,
  Package,
  CreditCard,
  MapPin,
  Clock,
  Wrench,
  AlertTriangle,
  History,
  Shield,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateTimeSafe } from '../utils/formatDate';

interface AssetDetailModalProps {
  assetId: number | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ assetId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    api.getAssetById(assetId)
      .then(res => {
        if (res.success) setData(res.asset);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [assetId]);

  if (!assetId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{data?.asset_name || 'Loading Asset...'}</h2>
                {data && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {data.asset_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">{data?.department} • {data?.category_name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
            Loading deep asset telemetry & history...
          </div>
        ) : data ? (
          <div className="p-6 space-y-6 flex-1">
            {/* Quick Status Bento Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Inventory Status</span>
                <div className="font-bold text-white mt-1">{data.status}</div>
                <span className="text-[10px] text-zinc-400">{data.assigned_to || 'In Inventory'}</span>
              </div>

              <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Maintenance</span>
                <div className={`font-bold mt-1 ${data.maintenance_status === 'WORKING' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {data.maintenance_status}
                </div>
                <span className="text-[10px] text-zinc-400">Condition: {data.condition_rating}</span>
              </div>

              <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">RFID Tag UID</span>
                <div className="font-mono font-bold text-blue-400 mt-1">{data.rfid_uid || 'Unbound'}</div>
                <span className="text-[10px] text-zinc-400">MFRC522 MIFARE 1K</span>
              </div>

              <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Risk Score</span>
                <div className={`font-bold mt-1 ${data.risk_level === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {data.risk_score} / 100 ({data.risk_level})
                </div>
                <span className="text-[10px] text-zinc-400">Perimeter Monitored</span>
              </div>
            </div>

            {/* Description & Specs */}
            <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Asset Specifications & Notes</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{data.description || 'No additional technical notes provided.'}</p>
              <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-zinc-400">
                <span>Location: <strong className="text-zinc-200">{data.location_name || 'Lab A'}</strong></span>
                <span>Purchase Date: <strong className="text-zinc-200">{data.purchase_date}</strong></span>
                <span>Warranty Expiry: <strong className="text-zinc-200">{data.warranty_expiry}</strong></span>
              </div>
            </div>

            {/* Movement Audit Log Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-400" />
                Recent Checkpoint Movements
              </h3>
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/50">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Checkpoint Gate</th>
                      <th className="p-3">Transit Event</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.movements && data.movements.length > 0 ? (
                      data.movements.map((m: any) => (
                        <tr key={m.id}>
                          <td className="p-3 text-zinc-400 font-mono text-[11px]">
                            {formatDateTimeSafe(m.timestamp || m.scanned_at || m.created_at)}
                          </td>
                          <td className="p-3 text-zinc-200">{m.checkpoint_name || 'CP-01'}</td>
                          <td className="p-3 text-zinc-300">{m.event_type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.authorization_status === 'AUTHORIZED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {m.authorization_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-zinc-500 text-xs">
                          No recent checkpoint movements recorded for this item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance History */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Maintenance & Calibration History
              </h3>
              <div className="space-y-2">
                {data.maintenance_history && data.maintenance_history.length > 0 ? (
                  data.maintenance_history.map((m: any) => (
                    <div key={m.id} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{m.maintenance_type}: {m.issue_description}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {m.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Technician: {m.technician_name || 'Unassigned'} • Cost: ${m.cost}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800/60 rounded-xl text-center text-zinc-500 text-xs">
                    No active or historic maintenance tickets. Asset is in standard working condition.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 text-xs">Asset details could not be loaded.</div>
        )}
      </div>
    </div>
  );
};
