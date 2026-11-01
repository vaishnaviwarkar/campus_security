import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, RotateCcw, Clock, CheckCircle2, AlertTriangle, Search, User, Package, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { AssetIssue, Asset, RFIDTag } from '../types';
import { formatDateOnlySafe } from '../utils/formatDate';

export const IssueReturnView: React.FC = () => {
  const [issues, setIssues] = useState<AssetIssue[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RETURNED' | 'OVERDUE'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [returnedNotice, setReturnedNotice] = useState<string | null>(null);

  // Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    asset_id: '',
    rfid_uid: '',
    issued_to_name: '',
    issued_to_id: '',
    issued_to_email: '',
    purpose: 'Academic / Lab Project',
    expected_return_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    remarks: ''
  });

  // Return Modal (Row-based or Direct top-level)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnAssetId, setReturnAssetId] = useState<number | ''>('');
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnNotes, setReturnNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [issueRes, assetRes, tagRes] = await Promise.all([
        api.getIssues(),
        api.getAssets(),
        api.getRFIDTags()
      ]);
      if (issueRes.success) setIssues(issueRes.issues);
      if (assetRes.success) setAssets(assetRes.assets);
      if (tagRes.success) setTags(tagRes.tags);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.asset_id) return alert('Please select an asset to issue.');

    try {
      await api.issueAsset({
        asset_id: Number(issueForm.asset_id),
        rfid_uid: issueForm.rfid_uid || undefined,
        issued_to_name: issueForm.issued_to_name,
        issued_to_id: issueForm.issued_to_id,
        issued_to_email: issueForm.issued_to_email,
        purpose: issueForm.purpose,
        expected_return_date: issueForm.expected_return_date,
        remarks: issueForm.remarks
      });
      setIsIssueModalOpen(false);
      setIssueForm({
        asset_id: '',
        rfid_uid: '',
        issued_to_name: '',
        issued_to_id: '',
        issued_to_email: '',
        purpose: 'Academic / Lab Project',
        expected_return_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to issue asset.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnAssetId) return alert('Please select an asset to process return.');

    try {
      const res = await api.returnAsset({
        asset_id: Number(returnAssetId),
        condition_rating: returnCondition,
        remarks: returnNotes
      });
      const returnedAsset = res.asset;
      setReturnedNotice(
        `Asset "${returnedAsset?.asset_name || 'Item'}" successfully returned to lab stand! Full loan history and RFID card binding are preserved, but checkout authorization has been revoked. Taking out this asset again requires a new authorized checkout loan.`
      );
      setIsReturnModalOpen(false);
      setReturnAssetId('');
      setReturnNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to return asset.');
    }
  };

  const handleOpenRowReturn = (issue: AssetIssue) => {
    setReturnAssetId(issue.asset_id);
    setReturnCondition('GOOD');
    setReturnNotes(`Returned by ${issue.issued_to_name}`);
    setIsReturnModalOpen(true);
  };

  const filteredIssues = issues.filter(i => {
    const matchesFilter = filter === 'ALL' ? true : i.status === filter;
    const matchesSearch =
      i.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      i.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      i.issued_to_name.toLowerCase().includes(search.toLowerCase()) ||
      i.issued_to_id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const availableAssets = assets.filter(a => a.status === 'AVAILABLE');
  const issuedAssets = assets.filter(a => a.status === 'ISSUED');

  return (
    <div className="space-y-6">
      {/* Header with BOTH Issue and Return Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Asset Checkout & Return Console
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage equipment loans, authorize checkouts, and process returns to restore stand security
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Option for Return */}
          <button
            onClick={() => {
              setReturnAssetId(issuedAssets[0]?.id || '');
              setReturnNotes('Equipment returned to lab stand in working condition');
              setIsReturnModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Return ({issuedAssets.length})</span>
          </button>

          {/* Option for Issue */}
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Checkout / Loan</span>
          </button>
        </div>
      </div>

      {/* Return Success Notification with RFID Reset Details */}
      {returnedNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/20">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{returnedNotice}</span>
          </div>
          <button
            onClick={() => setReturnedNotice(null)}
            className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-emerald-900/50 border border-emerald-500/30 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#121214] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Currently Issued on Loan</span>
            <span className="text-lg font-bold text-blue-400 mt-0.5 block">{issuedAssets.length} Assets</span>
          </div>
          <div className="h-9 w-9 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Available on Stands</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{availableAssets.length} Assets</span>
          </div>
          <div className="h-9 w-9 bg-emerald-600/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Total Loan Transactions</span>
            <span className="text-lg font-bold text-zinc-200 mt-0.5 block">{issues.length} Records</span>
          </div>
          <div className="h-9 w-9 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <Package className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800 pb-3 text-xs">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {(['ACTIVE', 'RETURNED', 'OVERDUE', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                filter === tab
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {tab === 'ACTIVE' ? `Active Loans (${issues.filter(i => i.status === 'ACTIVE').length})` : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset, code, or student..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Equipment</th>
                <th className="p-4">Borrower Details</th>
                <th className="p-4">Checkout Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Loan Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs animate-pulse">
                    Loading checkout records...
                  </td>
                </tr>
              ) : filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{issue.asset_name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{issue.asset_code}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-zinc-200 font-medium">{issue.issued_to_name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">ID: {issue.issued_to_id} • {issue.purpose}</div>
                    </td>

                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateOnlySafe(issue.issue_date)}
                    </td>

                    <td className="p-4 font-mono text-[11px]">
                      <span className={new Date(issue.expected_return_date) < new Date() && issue.status === 'ACTIVE' ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                        {formatDateOnlySafe(issue.expected_return_date)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          issue.status === 'ACTIVE'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : issue.status === 'RETURNED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}>
                          {issue.status}
                        </span>
                        <div className="text-[9px] text-zinc-500 mt-1 font-mono">
                          {issue.status === 'ACTIVE' ? '✓ Authorized Exit Active' : '⚡ Stand: Re-authorization Required to Take Out'}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      {issue.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleOpenRowReturn(issue)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-[11px] font-semibold transition cursor-pointer border border-emerald-500/30 flex items-center gap-1.5 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return Asset</span>
                        </button>
                      )}
                      {issue.status === 'RETURNED' && (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Returned {issue.actual_return_date ? formatDateOnlySafe(issue.actual_return_date) : '✓'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No checkout records in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal (Option for Return) */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Process Equipment Return</h2>
                <p className="text-xs text-zinc-400">Verify condition and return asset back to available stand status</p>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Select Asset to Return
                </label>
                <select
                  required
                  value={returnAssetId}
                  onChange={(e) => setReturnAssetId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Select an Issued Asset --</option>
                  {issuedAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} ({a.asset_code}) • Currently with: {a.assigned_to || 'Borrower'}
                    </option>
                  ))}
                </select>
                {issuedAssets.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No assets are currently issued out on loan.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Returned Condition Rating
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="EXCELLENT">EXCELLENT - Flawless physical condition</option>
                  <option value="GOOD">GOOD - Fully operational, normal minor wear</option>
                  <option value="FAIR">FAIR - Operational with cosmetic blemishes</option>
                  <option value="DAMAGED">DAMAGED - Requires hardware technician maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Return Remarks / Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notes regarding condition, stand restocking, or borrower check..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-white">Full History Preserved • Exit Authorization Required:</span>
                  <span className="text-zinc-300 block">Restocks equipment to available lab stand status. All checkout history and RFID card associations are safely retained. However, checkout authorization is revoked — taking out this asset again through any checkpoint requires a new authorized checkout loan.</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuedAssets.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Confirm Return to Stand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal (Option for Issue) */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Authorize New Equipment Checkout
            </h2>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Select Available Asset
                </label>
                <select
                  required
                  value={issueForm.asset_id}
                  onChange={(e) => setIssueForm({ ...issueForm, asset_id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Available Asset --</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} ({a.asset_code}) • {a.rfid_uid ? `Card: ${a.rfid_uid}` : 'No RFID Assigned'}
                    </option>
                  ))}
                </select>
              </div>

              {/* RFID Tag Checkout Authorization */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Assign & Authorize RFID Tag (Checkout Authorization)
                </label>
                <select
                  value={issueForm.rfid_uid}
                  onChange={(e) => setIssueForm({ ...issueForm, rfid_uid: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="">
                    {issueForm.asset_id && availableAssets.find((a) => a.id === Number(issueForm.asset_id))?.rfid_uid
                      ? `-- Keep Currently Linked Tag (${availableAssets.find((a) => a.id === Number(issueForm.asset_id))?.rfid_uid}) --`
                      : '-- Select an Unassigned RFID Card to Authorize --'}
                  </option>
                  {tags
                    .filter((t) => t.status === 'UNASSIGNED' || !t.asset_id)
                    .map((t) => (
                      <option key={t.id} value={t.uid}>
                        {t.uid} • {t.tag_type} (Unassigned / Initial State)
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Authorizing checkout updates the RFID card to Authorized status for perimeter checkpoint exit.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Borrower Name
                  </label>
                  <input
                    type="text"
                    required
                    value={issueForm.issued_to_name}
                    onChange={(e) => setIssueForm({ ...issueForm, issued_to_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Student / Staff ID
                  </label>
                  <input
                    type="text"
                    required
                    value={issueForm.issued_to_id}
                    onChange={(e) => setIssueForm({ ...issueForm, issued_to_id: e.target.value })}
                    placeholder="e.g. CS-2024-045"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Borrower Email
                  </label>
                  <input
                    type="email"
                    value={issueForm.issued_to_email}
                    onChange={(e) => setIssueForm({ ...issueForm, issued_to_email: e.target.value })}
                    placeholder="student@campus.edu"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.expected_return_date}
                    onChange={(e) => setIssueForm({ ...issueForm, expected_return_date: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Purpose of Loan
                </label>
                <input
                  type="text"
                  value={issueForm.purpose}
                  onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                  placeholder="e.g. Robotics Lab project, sports ceremony, class demonstration..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Authorize Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
