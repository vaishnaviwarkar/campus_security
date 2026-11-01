import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Link, Unlink, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw, Sparkles, Tag, Package } from 'lucide-react';
import { api } from '../services/api';
import { RFIDTag, Asset } from '../types';
import { formatDateOnlySafe } from '../utils/formatDate';

export const RFIDManagementView: React.FC = () => {
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lookupUID, setLookupUID] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Assign Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<RFIDTag | null>(null);
  const [assignMode, setAssignMode] = useState<'CUSTOM' | 'EXISTING'>('CUSTOM');
  const [customAssetName, setCustomAssetName] = useState('');
  const [customCategory, setCustomCategory] = useState('Lab Equipment');
  const [customDepartment, setCustomDepartment] = useState('Computer Science');
  const [assignAssetId, setAssignAssetId] = useState<number | ''>('');

  // Register New Tag Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newUID, setNewUID] = useState('');
  const [tagType, setTagType] = useState('MIFARE_1K');
  const [registerAssignMode, setRegisterAssignMode] = useState<'CUSTOM' | 'EXISTING' | 'UNASSIGNED'>('CUSTOM');
  const [registerCustomName, setRegisterCustomName] = useState('');
  const [registerCategory, setRegisterCategory] = useState('Lab Equipment');
  const [registerDepartment, setRegisterDepartment] = useState('Computer Science');
  const [registerAssetId, setRegisterAssetId] = useState<number | ''>('');

  // Common quick asset presets
  const assetPresets = [
    { label: '🧹 Classroom Duster', name: 'Classroom Duster', category: 'Classroom Supplies' },
    { label: '📺 AC / Projector Remote', name: 'AC / Projector Remote', category: 'Electronics' },
    { label: '🏆 Annual Sports Trophy', name: 'Annual Sports Trophy', category: 'Awards & Memorabilia' },
    { label: '🖱️ Logitech USB Mouse', name: 'Logitech Optical Mouse', category: 'Computer Peripherals' },
    { label: '🔌 65W Laptop Charger', name: '65W USB-C Laptop Charger', category: 'Power Adapters' },
    { label: '⌨️ Mechanical Keyboard', name: 'Lab Mechanical Keyboard', category: 'Computer Peripherals' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tagRes, assetRes] = await Promise.all([
        api.getRFIDTags(),
        api.getAssets()
      ]);
      if (tagRes.success) setTags(tagRes.tags);
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

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupUID.trim()) return;
    try {
      const res = await api.lookupRFID(lookupUID.trim().toUpperCase());
      setLookupResult(res);
    } catch (err: any) {
      setLookupResult({ registered: false, message: err.message });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUID.trim()) return alert('Please enter a Tag UID');

    try {
      const payload: any = {
        uid: newUID.trim().toUpperCase(),
        tag_type: tagType
      };

      if (registerAssignMode === 'CUSTOM') {
        if (!registerCustomName.trim()) {
          return alert('Please enter a custom asset name or select a preset.');
        }
        payload.asset_name = registerCustomName.trim();
        payload.category_name = registerCategory;
        payload.department = registerDepartment;
      } else if (registerAssignMode === 'EXISTING' && registerAssetId !== '') {
        payload.asset_id = Number(registerAssetId);
      }

      await api.registerRFIDTag(payload);
      setIsRegisterOpen(false);
      setNewUID('');
      setRegisterCustomName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error registering tag');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTag) return;

    try {
      if (assignMode === 'CUSTOM') {
        if (!customAssetName.trim()) {
          return alert('Please enter your custom asset name or pick a preset');
        }
        await api.assignRFIDTag({
          uid: selectedTag.uid,
          new_asset_name: customAssetName.trim(),
          category_name: customCategory,
          department: customDepartment
        });
      } else {
        await api.assignRFIDTag({
          uid: selectedTag.uid,
          asset_id: assignAssetId === '' ? null : Number(assignAssetId)
        });
      }

      setIsAssignOpen(false);
      setSelectedTag(null);
      setCustomAssetName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error binding RFID tag');
    }
  };

  const handleUnbind = async (uid: string) => {
    if (!confirm(`Unbind RFID tag ${uid} from its current asset?`)) return;
    try {
      await api.assignRFIDTag({ uid, asset_id: null });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error unbinding tag');
    }
  };

  const filteredTags = tags.filter(t =>
    t.uid.toLowerCase().includes(search.toLowerCase()) ||
    (t.asset_name && t.asset_name.toLowerCase().includes(search.toLowerCase())) ||
    (t.asset_code && t.asset_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            MFRC522 RFID Tag Registry & Custom Asset Binding
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Register 13.56MHz MIFARE Classic tags, bind to custom campus assets (Duster, Remote, Trophy, Mouse, Charger), and verify authorizations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setNewUID('');
              setRegisterCustomName('');
              setIsRegisterOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register & Name Tag</span>
          </button>
        </div>
      </div>

      {/* Live UID Scanner Tool */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-5 shadow-sm">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-blue-400" />
          Quick RFID UID Inspection & Lookup
        </h2>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={lookupUID}
              onChange={(e) => setLookupUID(e.target.value)}
              placeholder="Swipe tag on reader or enter Hex UID (e.g. E2801120000018)..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>Verify UID</span>
          </button>
        </form>

        {lookupResult && (
          <div className={`mt-3 p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            lookupResult.registered
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-red-950/30 border-red-800/40 text-red-300'
          }`}>
            <div className="flex items-center space-x-3">
              {lookupResult.registered ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {lookupResult.registered ? 'Tag Registered' : 'Unregistered / Unknown Tag'}
                </span>
                {lookupResult.registered && lookupResult.asset && (
                  <span className="ml-2 text-zinc-400">
                    Bound to: <strong className="text-white">{lookupResult.asset.asset_name}</strong> ({lookupResult.asset.asset_code}) • Status: {lookupResult.asset.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tag Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by UID or Asset name..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-zinc-500 font-mono">
            Total Registered Tags: <strong className="text-white">{tags.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-semibold bg-zinc-900/30">
                <th className="p-4 pl-6">Tag UID</th>
                <th className="p-4">Standard</th>
                <th className="p-4">Bound Asset & User</th>
                <th className="p-4">Card Status</th>
                <th className="p-4">Checkout Authorization</th>
                <th className="p-4">Bound Date</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs animate-pulse">
                    Loading RFID tags...
                  </td>
                </tr>
              ) : filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4 pl-6 font-mono font-bold text-blue-400">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{tag.uid}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300 font-mono text-[11px]">{tag.tag_type}</td>
                    <td className="p-4">
                      {tag.asset_name ? (
                        <div>
                          <div className="font-bold text-white">{tag.asset_name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            {tag.asset_code} {tag.assigned_to ? `• Loaned to: ${tag.assigned_to}` : '• In Lab Stand'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[11px] text-zinc-400 italic font-medium">Unassigned (Initial State)</span>
                          <div className="text-[10px] text-zinc-600">No user assignment</div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {tag.status === 'ASSIGNED' || tag.asset_id ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          ASSIGNED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          UNASSIGNED
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {tag.checkout_authorized || tag.authorization_status === 'AUTHORIZED' ? (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>AUTHORIZED</span>
                          </span>
                          <span className="text-[9px] text-emerald-400/80 font-mono block">Loan Active • Exit Cleared</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3" />
                            <span>UNAUTHORIZED</span>
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono block">In Stand • Checkout Required</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-zinc-400 text-[11px] font-mono">
                      {tag.assigned_at ? formatDateOnlySafe(tag.assigned_at) : '—'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTag(tag);
                            setCustomAssetName(tag.asset_name || '');
                            setAssignAssetId(tag.asset_id || '');
                            setAssignMode('CUSTOM');
                            setIsAssignOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-blue-600/20 text-zinc-300 hover:text-blue-400 text-[11px] font-medium transition cursor-pointer flex items-center space-x-1"
                        >
                          <Link className="w-3 h-3" />
                          <span>{tag.asset_id ? 'Reassign' : 'Bind Asset'}</span>
                        </button>
                        {tag.asset_id && (
                          <button
                            onClick={() => handleUnbind(tag.uid)}
                            className="p-1 rounded-lg bg-zinc-900 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title="Unbind tag from asset"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No RFID tags matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bind RFID Tag Modal (User Choice Enabled!) */}
      {isAssignOpen && selectedTag && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Link className="w-4 h-4 text-blue-400" />
              <span>Bind RFID Tag: <span className="font-mono text-blue-400">{selectedTag.uid}</span></span>
            </h2>

            {/* Mode Selector Tab */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAssignMode('CUSTOM')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  assignMode === 'CUSTOM' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Type Custom Asset Name</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('EXISTING')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  assignMode === 'EXISTING' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Choose from Catalog</span>
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              {assignMode === 'CUSTOM' ? (
                <>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                      Your Custom Asset Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customAssetName}
                      onChange={(e) => setCustomAssetName(e.target.value)}
                      placeholder="e.g. Classroom Duster, AC Remote, Sports Trophy, Mouse..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  {/* Preset Chips */}
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1.5 font-semibold uppercase">
                      Or Pick a Quick Preset:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assetPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomAssetName(preset.name);
                            setCustomCategory(preset.category);
                          }}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-blue-600/20 hover:text-blue-300 text-zinc-300 rounded-lg border border-zinc-800 text-[11px] transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Select Target Campus Asset
                  </label>
                  <select
                    value={assignAssetId}
                    onChange={(e) => setAssignAssetId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None (Unbind / Release Tag) --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_name} ({a.asset_code}) - {a.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Save Binding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Tag Modal (With Custom Name Option!) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Register New RFID Tag & Bind Asset
            </h2>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Tag UID (Hex)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUID}
                    onChange={(e) => setNewUID(e.target.value.toUpperCase())}
                    placeholder="e.g. A4C899F1"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Standard
                  </label>
                  <select
                    value={tagType}
                    onChange={(e) => setTagType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MIFARE_1K">MIFARE Classic 1K (13.56 MHz)</option>
                    <option value="MIFARE_4K">MIFARE Classic 4K</option>
                    <option value="NTAG213">NTAG213 / NTAG215 (NFC)</option>
                    <option value="ULTRALIGHT">MIFARE Ultralight</option>
                  </select>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1.5">
                  Asset Association
                </label>
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setRegisterAssignMode('CUSTOM')}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                      registerAssignMode === 'CUSTOM' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Custom Name (User Choice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterAssignMode('EXISTING')}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                      registerAssignMode === 'EXISTING' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Existing Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterAssignMode('UNASSIGNED')}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                      registerAssignMode === 'UNASSIGNED' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Unassigned
                  </button>
                </div>
              </div>

              {registerAssignMode === 'CUSTOM' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                      Type Your Custom Asset Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={registerCustomName}
                      onChange={(e) => setRegisterCustomName(e.target.value)}
                      placeholder="e.g. Classroom Duster, Remote, Trophy, Mouse, Charger..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1 font-semibold uppercase">
                      Quick Preset Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assetPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setRegisterCustomName(preset.name);
                            setRegisterCategory(preset.category);
                          }}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-blue-600/20 hover:text-blue-300 text-zinc-300 rounded-lg border border-zinc-800 text-[11px] transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={registerCategory}
                        onChange={(e) => setRegisterCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={registerDepartment}
                        onChange={(e) => setRegisterDepartment(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {registerAssignMode === 'EXISTING' && (
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Select Target Campus Asset
                  </label>
                  <select
                    value={registerAssetId}
                    onChange={(e) => setRegisterAssetId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select an Asset --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_name} ({a.asset_code}) - {a.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Register Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
