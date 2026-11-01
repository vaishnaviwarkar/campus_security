import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Download,
  RotateCcw,
  ArrowLeftRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Asset, UserRole } from '../types';
import { AssetDetailModal } from './AssetDetailModal';

interface AssetsViewProps {
  userRole?: UserRole;
  onRefresh?: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ userRole }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    asset_code: '',
    asset_name: '',
    category_id: 1,
    description: '',
    department: 'Computer Science',
    location_id: 1,
    status: 'AVAILABLE',
    maintenance_status: 'WORKING',
    condition_rating: 'EXCELLENT',
    rfid_uid: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_expiry: '2027-12-31'
  });

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnAsset, setSelectedReturnAsset] = useState<Asset | null>(null);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnRemarks, setReturnRemarks] = useState('');

  // Quick Issue Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssueAsset, setSelectedIssueAsset] = useState<Asset | null>(null);
  const [issueBorrowerName, setIssueBorrowerName] = useState('');
  const [issueBorrowerId, setIssueBorrowerId] = useState('');
  const [issuePurpose, setIssuePurpose] = useState('Lab & Classroom Project');
  const [issueDueDate, setIssueDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  const assetPresets = [
    { label: '🧹 Duster', name: 'Classroom Duster', dept: 'Classroom Supplies' },
    { label: '📺 Remote', name: 'AC / Projector Remote', dept: 'Electronics' },
    { label: '🏆 Trophy', name: 'Annual Sports Trophy', dept: 'Awards & Display' },
    { label: '🖱️ Mouse', name: 'Logitech USB Mouse', dept: 'Computer Science' },
    { label: '🔌 Charger', name: '65W Laptop Charger', dept: 'IT Equipment' }
  ];

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.getAssets();
      if (res.success) setAssets(res.assets);
      const catRes = await api.getCategories();
      if (catRes.success) setCategories(catRes.categories);
      const locRes = await api.getLocations();
      if (locRes.success) setLocations(locRes.locations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormData({
      asset_code: `CAS-EQ-${Date.now().toString().slice(-4)}`,
      asset_name: '',
      category_id: categories[0]?.id || 1,
      description: '',
      department: 'Computer Science',
      location_id: locations[0]?.id || 1,
      status: 'AVAILABLE',
      maintenance_status: 'WORKING',
      condition_rating: 'EXCELLENT',
      rfid_uid: '',
      purchase_date: new Date().toISOString().split('T')[0],
      warranty_expiry: '2028-01-01'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category_id: asset.category_id,
      description: asset.description,
      department: asset.department,
      location_id: asset.location_id,
      status: asset.status,
      maintenance_status: asset.maintenance_status,
      condition_rating: asset.condition_rating,
      rfid_uid: asset.rfid_uid || '',
      purchase_date: asset.purchase_date,
      warranty_expiry: asset.warranty_expiry
    });
    setIsFormOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, formData);
      } else {
        await api.createAsset(formData);
      }
      setIsFormOpen(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to save asset');
    }
  };

  const handleDeleteAsset = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete asset [${code}]?`)) return;
    try {
      await api.deleteAsset(id);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  // Quick Issue & Return Handlers
  const handleOpenQuickIssue = (asset: Asset) => {
    setSelectedIssueAsset(asset);
    setIssueBorrowerName('');
    setIssueBorrowerId('');
    setIsIssueModalOpen(true);
  };

  const handleQuickIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueAsset) return;
    try {
      await api.issueAsset({
        asset_id: selectedIssueAsset.id,
        issued_to_name: issueBorrowerName,
        issued_to_id: issueBorrowerId,
        purpose: issuePurpose,
        expected_return_date: issueDueDate,
        remarks: 'Direct checkout from asset inventory'
      });
      setIsIssueModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to issue asset');
    }
  };

  const handleOpenQuickReturn = (asset: Asset) => {
    setSelectedReturnAsset(asset);
    setReturnCondition('GOOD');
    setReturnRemarks(`Returned to stand in working order`);
    setIsReturnModalOpen(true);
  };

  const handleQuickReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnAsset) return;
    try {
      await api.returnAsset({
        asset_id: selectedReturnAsset.id,
        condition_rating: returnCondition,
        remarks: returnRemarks
      });
      setIsReturnModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to return asset');
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      (a.rfid_uid && a.rfid_uid.toLowerCase().includes(search.toLowerCase())) ||
      a.department.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesCat = categoryFilter === 'ALL' || a.category_id === Number(categoryFilter);

    return matchesSearch && matchesStatus && matchesCat;
  });

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ISSUED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'MISSING':
        return 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
      case 'UNDER_REPAIR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const issuedAssetsCount = assets.filter(a => a.status === 'ISSUED').length;

  return (
    <div className="space-y-6">
      {/* View Header with BOTH Register and Return Options */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Campus Assets Catalog & Inventory
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage physical campus equipment, assigned RFID tags, checkout loans, and return processing
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Option for Return */}
          <button
            onClick={() => {
              const firstIssued = assets.find(a => a.status === 'ISSUED');
              setSelectedReturnAsset(firstIssued || null);
              setReturnCondition('GOOD');
              setReturnRemarks('Equipment returned to lab stand');
              setIsReturnModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Return ({issuedAssetsCount})</span>
          </button>

          {/* Option for Register / Add */}
          {userRole !== 'SECURITY' && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, RFID UID, dept..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ISSUED">Issued ({issuedAssetsCount})</option>
            <option value="MISSING">Missing</option>
            <option value="UNDER_REPAIR">Under Repair</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Asset Code & Name</th>
                <th className="p-4">Category / Dept</th>
                <th className="p-4">RFID UID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Condition / Health</th>
                <th className="p-4">Risk Profile</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs animate-pulse">
                    Loading campus asset catalog...
                  </td>
                </tr>
              ) : filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-900/40 transition">
                    {/* Code & Name */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-800 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <span
                            className="font-bold text-white block hover:text-blue-400 transition cursor-pointer"
                            onClick={() => setSelectedAssetId(asset.id)}
                          >
                            {asset.asset_name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{asset.asset_code}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <div className="text-zinc-300 font-medium">{asset.category_name}</div>
                      <div className="text-[10px] text-zinc-500">{asset.department}</div>
                    </td>

                    {/* RFID Tag UID */}
                    <td className="p-4">
                      {asset.rfid_uid ? (
                        <div className="flex items-center space-x-1 font-mono font-bold text-blue-400">
                          <CreditCard className="w-3 h-3" />
                          <span>{asset.rfid_uid}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-500/80 italic font-mono">No RFID Assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusPill(asset.status)}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                      {asset.status === 'ISSUED' && asset.assigned_to && (
                        <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[140px]" title={asset.assigned_to}>
                          With: {asset.assigned_to}
                        </div>
                      )}
                    </td>

                    {/* Maintenance / Condition */}
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${asset.maintenance_status === 'WORKING' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                        <span className="text-zinc-300 font-medium">{asset.condition_rating}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{asset.maintenance_status}</div>
                    </td>

                    {/* Risk Profile */}
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold ${asset.risk_level === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {asset.risk_score} pts
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                          asset.risk_level === 'HIGH'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {asset.risk_level}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Option for Return directly on Issued Asset row */}
                        {asset.status === 'ISSUED' && userRole !== 'SECURITY' && (
                          <button
                            onClick={() => handleOpenQuickReturn(asset)}
                            className="px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                            title="Process Return for this asset"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        )}

                        {/* Option for Issue directly on Available Asset row */}
                        {asset.status === 'AVAILABLE' && userRole !== 'SECURITY' && (
                          <button
                            onClick={() => handleOpenQuickIssue(asset)}
                            className="px-2 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                            title="Issue / Checkout this asset"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Issue</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAssetId(asset.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                          title="Inspect Telemetry & Audit Trail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {userRole !== 'SECURITY' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(asset)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-blue-600/20 text-zinc-400 hover:text-blue-400 transition cursor-pointer"
                              title="Edit Asset"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id, asset.asset_code)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                              title="Delete Asset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                    No matching assets found in the inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Asset Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Process Equipment Return</h2>
                <p className="text-xs text-zinc-400">Return loaned asset back to available status</p>
              </div>
            </div>

            <form onSubmit={handleQuickReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Asset to Return
                </label>
                <select
                  required
                  value={selectedReturnAsset?.id || ''}
                  onChange={(e) => {
                    const match = assets.find(a => a.id === Number(e.target.value));
                    setSelectedReturnAsset(match || null);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select an Issued Asset --</option>
                  {assets.filter(a => a.status === 'ISSUED').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} ({a.asset_code}) • With: {a.assigned_to || 'Borrower'}
                    </option>
                  ))}
                </select>
                {assets.filter(a => a.status === 'ISSUED').length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No equipment is currently issued out on loan.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Returned Working Condition
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="EXCELLENT">EXCELLENT - Flawless physical condition</option>
                  <option value="GOOD">GOOD - Fully operational, normal wear</option>
                  <option value="FAIR">FAIR - Operational with minor blemishes</option>
                  <option value="DAMAGED">DAMAGED - Requires hardware repair</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Return Remarks
                </label>
                <textarea
                  rows={2}
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="Notes on condition, restocked stand location..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
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
                  disabled={!selectedReturnAsset}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Issue Modal */}
      {isIssueModalOpen && selectedIssueAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Checkout Equipment</h2>
                <p className="text-xs text-zinc-400">Issue {selectedIssueAsset.asset_name}</p>
              </div>
            </div>

            <form onSubmit={handleQuickIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Borrower Name
                </label>
                <input
                  type="text"
                  required
                  value={issueBorrowerName}
                  onChange={(e) => setIssueBorrowerName(e.target.value)}
                  placeholder="e.g. Student / Faculty Name"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Student / Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={issueBorrowerId}
                  onChange={(e) => setIssueBorrowerId(e.target.value)}
                  placeholder="e.g. CS-2024-089"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  required
                  value={issueDueDate}
                  onChange={(e) => setIssueDueDate(e.target.value)}
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

      {/* Asset Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span>{editingAsset ? 'Edit Asset Configuration' : 'Register New Campus Asset'}</span>
            </h2>

            {/* Quick Presets for Custom Assets */}
            {!editingAsset && (
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1.5 font-semibold uppercase">
                  Quick Lab Asset Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assetPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          asset_name: preset.name,
                          department: preset.dept
                        });
                      }}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-blue-600/20 hover:text-blue-300 text-zinc-300 rounded-lg border border-zinc-800 text-[11px] transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveAsset} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Asset Code</label>
                  <input
                    type="text"
                    required
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">RFID UID Tag (Hex)</label>
                  <input
                    type="text"
                    value={formData.rfid_uid}
                    onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value.toUpperCase() })}
                    placeholder="e.g. B72A5C19"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-blue-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Asset Name (Your Choice)</label>
                <input
                  type="text"
                  required
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  placeholder="e.g. Classroom Duster, AC Remote, Trophy, Mouse..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ISSUED">Issued</option>
                    <option value="MISSING">Missing</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Working Condition</label>
                  <select
                    value={formData.maintenance_status}
                    onChange={(e) => setFormData({ ...formData, maintenance_status: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="WORKING">Working</option>
                    <option value="NOT_WORKING">Not Working</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Condition Rating</label>
                  <select
                    value={formData.condition_rating}
                    onChange={(e) => setFormData({ ...formData, condition_rating: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Description & Specs</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Hardware specifications, serial numbers, accessory inventory..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  {editingAsset ? 'Save Changes' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deep Telemetry Modal */}
      <AssetDetailModal
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
      />
    </div>
  );
};
