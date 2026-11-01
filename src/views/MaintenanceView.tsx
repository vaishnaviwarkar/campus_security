import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, Clock, AlertCircle, DollarSign, Search } from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceRecord, Asset } from '../types';
import { formatDateOnlySafe } from '../utils/formatDate';

export const MaintenanceView: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // New Ticket Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    asset_id: '',
    issue_description: '',
    maintenance_type: 'REPAIR',
    technician_name: 'Campus Hardware Lab'
  });

  // Complete Repair Modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [completeForm, setCompleteForm] = useState({
    resolution_notes: '',
    cost: 0,
    new_condition: 'GOOD'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintRes, assetRes] = await Promise.all([
        api.getMaintenance(),
        api.getAssets()
      ]);
      if (maintRes.success) setRecords(maintRes.records);
      if (assetRes.success) setAssets(assetRes.assets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.asset_id) return alert('Select an asset');

    try {
      await api.createMaintenanceTicket({
        asset_id: Number(ticketForm.asset_id),
        issue_description: ticketForm.issue_description,
        maintenance_type: ticketForm.maintenance_type,
        technician_name: ticketForm.technician_name
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating maintenance ticket');
    }
  };

  const handleCompleteRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await api.updateMaintenanceTicket(selectedRecord.id, {
        status: 'COMPLETED',
        resolution_notes: completeForm.resolution_notes,
        cost: Number(completeForm.cost),
        condition_rating: completeForm.new_condition
      });
      setIsCompleteOpen(false);
      setSelectedRecord(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error closing ticket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Maintenance & Hardware Repair Console
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log equipment defects, schedule calibrations, and manage repairs before releasing back to stock
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Open Repair Ticket</span>
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Equipment</th>
                <th className="p-4">Reported Issue</th>
                <th className="p-4">Type / Technician</th>
                <th className="p-4">Logged Date</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs animate-pulse">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{r.asset_name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{r.asset_code}</div>
                    </td>

                    <td className="p-4 text-zinc-300 max-w-xs">{r.issue_description}</td>

                    <td className="p-4">
                      <div className="text-zinc-300 font-medium">{r.maintenance_type}</div>
                      <div className="text-[10px] text-zinc-500">{r.technician_name || 'Lab Staff'}</div>
                    </td>

                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateOnlySafe(r.start_date)}
                    </td>

                    <td className="p-4 font-mono font-bold text-zinc-300">
                      ${r.cost}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      {r.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setCompleteForm({
                              resolution_notes: '',
                              cost: r.cost,
                              new_condition: 'GOOD'
                            });
                            setIsCompleteOpen(true);
                          }}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-emerald-600/20 text-zinc-300 hover:text-emerald-400 rounded-xl text-[11px] font-medium transition cursor-pointer border border-zinc-800"
                        >
                          Complete Repair
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                    No active maintenance tickets. All equipment in operational state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Open Maintenance / Repair Ticket
            </h2>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Target Asset</label>
                <select
                  required
                  value={ticketForm.asset_id}
                  onChange={(e) => setTicketForm({ ...ticketForm, asset_id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Select Asset --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} ({a.asset_code}) - {a.maintenance_status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Issue Description</label>
                <textarea
                  rows={2}
                  required
                  value={ticketForm.issue_description}
                  onChange={(e) => setTicketForm({ ...ticketForm, issue_description: e.target.value })}
                  placeholder="e.g. Battery not charging, lens calibration error, loose hinge..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Type</label>
                  <select
                    value={ticketForm.maintenance_type}
                    onChange={(e) => setTicketForm({ ...ticketForm, maintenance_type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="REPAIR">Hardware Repair</option>
                    <option value="CALIBRATION">Calibration</option>
                    <option value="PREVENTIVE">Preventive Maintenance</option>
                    <option value="INSPECTION">Safety Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Technician / Lab</label>
                  <input
                    type="text"
                    value={ticketForm.technician_name}
                    onChange={(e) => setTicketForm({ ...ticketForm, technician_name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Repair Modal */}
      {isCompleteOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Complete Repair & Restore to Stock
            </h2>

            <form onSubmit={handleCompleteRepair} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Resolution Summary</label>
                <textarea
                  rows={2}
                  required
                  value={completeForm.resolution_notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, resolution_notes: e.target.value })}
                  placeholder="Replaced power supply unit, passed all thermal tests..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Total Cost ($)</label>
                  <input
                    type="number"
                    value={completeForm.cost}
                    onChange={(e) => setCompleteForm({ ...completeForm, cost: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Restored Condition</label>
                  <select
                    value={completeForm.new_condition}
                    onChange={(e) => setCompleteForm({ ...completeForm, new_condition: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Mark Repaired & Available
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
