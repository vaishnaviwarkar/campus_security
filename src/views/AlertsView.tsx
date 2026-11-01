import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, VolumeX, Eye, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import { SecurityAlert } from '../types';
import { formatDateTimeSafe } from '../utils/formatDate';

interface AlertsViewProps {
  onResetAlarm: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onResetAlarm }) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('OPEN');
  const [resolutionModalAlert, setResolutionModalAlert] = useState<SecurityAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts();
      if (res.success) setAlerts(res.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Error acknowledging alert');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModalAlert) return;

    try {
      await api.resolveAlert(resolutionModalAlert.id, resolutionNotes);
      setResolutionModalAlert(null);
      setResolutionNotes('');
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Error resolving alert');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Perimeter Security Alerts & Incident Center
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Surveillance incidents, unauthorized checkout breaches, and missing asset sightings across campus gates
          </p>
        </div>

        <button
          onClick={onResetAlarm}
          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
        >
          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
          <span>Silence Active Sirens</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 text-xs">
        {(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
              filter === tab
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Severity / Type</th>
                <th className="p-4">Incident Message</th>
                <th className="p-4">Location / Node</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs animate-pulse">
                    Loading security incident stream...
                  </td>
                </tr>
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((al) => (
                  <tr key={al.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          al.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                            : al.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {al.severity}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">{al.alert_type}</div>
                    </td>

                    <td className="p-4 text-zinc-200 font-semibold max-w-sm">
                      {al.message}
                      {al.asset_name && (
                        <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                          Target Asset: <strong className="text-zinc-200">{al.asset_name}</strong> ({al.asset_code})
                        </div>
                      )}
                      {al.resolution_notes && (
                        <div className="text-[11px] text-emerald-400/90 font-normal mt-1 bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-500/20">
                          Resolution: {al.resolution_notes} (by {al.resolved_by_name})
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-zinc-400 text-[11px]">
                      <div>{al.checkpoint_name || 'Checkpoint 1'}</div>
                      <span className="text-[10px] font-mono text-zinc-500">{al.device_code}</span>
                    </td>

                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateTimeSafe(al.created_at || (al as any).timestamp)}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        al.status === 'OPEN'
                          ? 'bg-red-950 text-red-300 border-red-500/50'
                          : al.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      }`}>
                        {al.status}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {al.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledge(al.id)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[11px] border border-zinc-800 transition cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {al.status !== 'RESOLVED' && (
                          <button
                            onClick={() => {
                              setResolutionModalAlert(al);
                              setResolutionNotes('');
                            }}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-[11px] border border-zinc-800 transition cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No active or logged security incidents matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolutionModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Resolve Security Incident #{resolutionModalAlert.id}
            </h2>

            <p className="text-xs text-zinc-300">{resolutionModalAlert.message}</p>

            <form onSubmit={handleResolve} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Resolution Summary / Action Notes</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Guard dispatched, borrower student presented valid permission slip, asset returned to lab..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setResolutionModalAlert(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Close & Resolve Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
