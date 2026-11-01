import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ArrowUpRight, CheckCircle2, XCircle, Clock, MapPin, Radio, ShieldAlert } from 'lucide-react';
import { AssetMovement } from '../types';
import { api } from '../services/api';
import { formatDateTimeSafe } from '../utils/formatDate';

export const MovementLogsView: React.FC = () => {
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AUTHORIZED' | 'UNAUTHORIZED'>('ALL');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.getMovements();
      if (res.success) setMovements(res.movements);
    } catch (err) {
      console.error('Failed to load movement history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      (m.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.asset_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.rfid_uid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.device_code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.authorization_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Asset Movement & Transit Audit Logs</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
              Full Audit Trail
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable log of all RFID physical checkpoint crossings, loan passes, and perimeter violations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search asset, tag UID, or node..."
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AUTHORIZED">Authorized Only</option>
            <option value="UNAUTHORIZED">Unauthorized Only</option>
          </select>
        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Asset Details</th>
                <th className="p-4">RFID UID</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Checkpoint / Device</th>
                <th className="p-4">Authorization</th>
                <th className="p-4">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No movement records found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {formatDateTimeSafe(m.timestamp || m.scanned_at || m.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{m.asset_name || 'Unknown Asset'}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{m.asset_code || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-mono text-blue-400 font-semibold">{m.rfid_uid}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-medium text-zinc-300">
                        {m.event_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-zinc-200">{m.checkpoint_name || 'Checkpoint 1'}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{m.device_code}</div>
                    </td>
                    <td className="p-4">
                      {m.authorization_status === 'AUTHORIZED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          AUTHORIZED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
                          <XCircle className="w-3 h-3" />
                          UNAUTHORIZED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-400 max-w-xs truncate text-[11px]">
                      {m.reason || 'Routine scan log'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
