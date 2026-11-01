import { Router } from 'express';
import { db, DbAsset } from '../db';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    count: db.rfidTags.length,
    tags: db.rfidTags
  });
});

router.post('/', (req, res) => {
  const { uid, tag_type, asset_id, asset_name, department, category_name } = req.body;
  const existing = db.rfidTags.find((t) => t.uid === uid);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Tag already registered' });
  }

  let boundAssetId: number | null = null;
  let boundAssetName: string | undefined = undefined;
  let boundAssetCode: string | undefined = undefined;

  // Option 1: User chose to create a new custom asset name immediately
  if (asset_name && typeof asset_name === 'string' && asset_name.trim().length > 0) {
    const trimmedName = asset_name.trim();
    const newAsset: DbAsset = {
      id: db.assets.length + 1,
      asset_code: `AST-2024-${String(db.assets.length + 1).padStart(3, '0')}`,
      asset_name: trimmedName,
      category_id: 1,
      category_name: category_name || 'Lab Equipment',
      description: `Campus Asset registered via RFID Tag [${uid}]`,
      department: department || 'Computer Science',
      location_id: 1,
      location_name: 'CS Department Lab',
      status: 'AVAILABLE',
      maintenance_status: 'WORKING',
      condition_rating: 'EXCELLENT',
      risk_score: 65,
      risk_level: 'MEDIUM',
      assigned_to: null,
      rfid_uid: uid,
      purchase_date: new Date().toISOString().split('T')[0],
      warranty_expiry: '2028-01-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.assets.push(newAsset);
    boundAssetId = newAsset.id;
    boundAssetName = newAsset.asset_name;
    boundAssetCode = newAsset.asset_code;
  }
  // Option 2: User picked an existing asset
  else if (asset_id) {
    const asset = db.assets.find((a) => a.id === parseInt(asset_id));
    if (asset) {
      asset.rfid_uid = uid;
      boundAssetId = asset.id;
      boundAssetName = asset.asset_name;
      boundAssetCode = asset.asset_code;
    }
  }

  const boundAsset = boundAssetId ? db.assets.find((a) => a.id === boundAssetId) : null;
  const isIssued = boundAsset && boundAsset.status === 'ISSUED';

  const newTag = {
    id: db.rfidTags.length + 1,
    uid,
    asset_id: boundAssetId,
    asset_name: boundAssetName,
    asset_code: boundAssetCode,
    tag_type: tag_type || 'MFRC522_HF',
    status: (boundAssetId ? 'ASSIGNED' : 'UNASSIGNED') as 'ASSIGNED' | 'UNASSIGNED',
    authorization_status: (isIssued ? 'AUTHORIZED' : 'UNAUTHORIZED') as 'AUTHORIZED' | 'UNAUTHORIZED',
    checkout_authorized: Boolean(isIssued),
    assigned_to: isIssued ? (boundAsset?.assigned_to || null) : null,
    is_active: true,
    assigned_at: boundAssetId ? new Date().toISOString() : null,
    created_at: new Date().toISOString()
  };

  db.rfidTags.push(newTag);
  res.status(201).json({ success: true, tag: newTag });
});

router.post('/assign', (req, res) => {
  const { uid, asset_id, new_asset_name, department, category_name } = req.body;
  const tag = db.rfidTags.find((t) => t.uid === uid);
  if (!tag) {
    return res.status(404).json({ success: false, message: 'Tag not found' });
  }

  // User choice: Create a brand new custom named asset and bind it
  if (new_asset_name && typeof new_asset_name === 'string' && new_asset_name.trim().length > 0) {
    // If tag was previously bound to an asset, release old asset
    if (tag.asset_id) {
      const oldAsset = db.assets.find((a) => a.id === tag.asset_id);
      if (oldAsset) oldAsset.rfid_uid = null;
    }

    const trimmedName = new_asset_name.trim();
    const newAsset: DbAsset = {
      id: db.assets.length + 1,
      asset_code: `AST-2024-${String(db.assets.length + 1).padStart(3, '0')}`,
      asset_name: trimmedName,
      category_id: 1,
      category_name: category_name || 'Lab Equipment',
      description: `Asset registered with custom name by user`,
      department: department || 'Computer Science',
      location_id: 1,
      location_name: 'CS Department Lab',
      status: 'AVAILABLE',
      maintenance_status: 'WORKING',
      condition_rating: 'EXCELLENT',
      risk_score: 65,
      risk_level: 'MEDIUM',
      assigned_to: null,
      rfid_uid: uid,
      purchase_date: new Date().toISOString().split('T')[0],
      warranty_expiry: '2028-01-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.assets.push(newAsset);
    tag.asset_id = newAsset.id;
    tag.asset_name = newAsset.asset_name;
    tag.asset_code = newAsset.asset_code;
    tag.assigned_at = new Date().toISOString();
    tag.status = 'ASSIGNED';
    tag.authorization_status = 'UNAUTHORIZED'; // available on stand, not issued for checkout
    tag.checkout_authorized = false;
    tag.assigned_to = null;

    return res.json({ success: true, tag, asset: newAsset });
  }

  // Bind to existing asset by ID
  if (asset_id) {
    const asset = db.assets.find((a) => a.id === parseInt(asset_id));
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    // Release any previous asset bound to this tag
    if (tag.asset_id && tag.asset_id !== asset.id) {
      const oldAsset = db.assets.find((a) => a.id === tag.asset_id);
      if (oldAsset) oldAsset.rfid_uid = null;
    }
    tag.asset_id = asset.id;
    tag.asset_name = asset.asset_name;
    tag.asset_code = asset.asset_code;
    tag.assigned_at = new Date().toISOString();
    tag.status = 'ASSIGNED';
    const isIssued = asset.status === 'ISSUED';
    tag.authorization_status = isIssued ? 'AUTHORIZED' : 'UNAUTHORIZED';
    tag.checkout_authorized = isIssued;
    tag.assigned_to = isIssued ? (asset.assigned_to || null) : null;
    asset.rfid_uid = uid;
  } else {
    // Unassign - restoring initial state
    if (tag.asset_id) {
      const asset = db.assets.find((a) => a.id === tag.asset_id);
      if (asset) asset.rfid_uid = null;
    }
    tag.asset_id = null;
    tag.asset_name = undefined;
    tag.asset_code = undefined;
    tag.assigned_at = null;
    tag.assigned_to = null;
    tag.status = 'UNASSIGNED';
    tag.authorization_status = 'UNAUTHORIZED';
    tag.checkout_authorized = false;
  }

  res.json({ success: true, tag });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tag = db.rfidTags.find((t) => t.id === id);
  if (tag && tag.asset_id) {
    const asset = db.assets.find((a) => a.id === tag.asset_id);
    if (asset) asset.rfid_uid = null;
  }
  db.rfidTags = db.rfidTags.filter((t) => t.id !== id);
  res.json({ success: true });
});

router.get('/lookup/:uid', (req, res) => {
  const { uid } = req.params;
  const tag = db.rfidTags.find((t) => t.uid === uid);
  if (!tag) {
    return res.json({ success: true, registered: false });
  }
  const asset = tag.asset_id ? db.assets.find((a) => a.id === tag.asset_id) : null;
  res.json({ success: true, registered: true, tag, asset });
});

export default router;
