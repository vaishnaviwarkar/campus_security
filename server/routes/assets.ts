import { Router } from 'express';
import { db, DbAsset } from '../db';

const router = Router();

router.get('/', (req, res) => {
  let list = [...db.assets];
  if (req.query.status) {
    list = list.filter((a) => a.status === req.query.status);
  }
  if (req.query.category_id) {
    list = list.filter((a) => a.category_id === parseInt(req.query.category_id as string));
  }
  if (req.query.location_id) {
    list = list.filter((a) => a.location_id === parseInt(req.query.location_id as string));
  }
  if (req.query.search) {
    const s = (req.query.search as string).toLowerCase();
    list = list.filter((a) =>
      a.asset_name.toLowerCase().includes(s) ||
      a.asset_code.toLowerCase().includes(s) ||
      (a.rfid_uid && a.rfid_uid.toLowerCase().includes(s))
    );
  }
  res.json({
    success: true,
    count: list.length,
    assets: list
  });
});

router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: db.categories
  });
});

router.get('/locations', (req, res) => {
  res.json({
    success: true,
    locations: db.locations
  });
});

router.get('/checkpoints', (req, res) => {
  res.json({
    success: true,
    checkpoints: db.checkpoints
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const asset = db.assets.find((a) => a.id === id);
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }
  res.json({ success: true, asset });
});

router.post('/', (req, res) => {
  const cat = db.categories.find((c) => c.id === parseInt(req.body.category_id));
  const loc = db.locations.find((l) => l.id === parseInt(req.body.location_id));

  const newAsset: DbAsset = {
    id: db.assets.length + 1,
    asset_code: req.body.asset_code || `AST-2024-${String(db.assets.length + 1).padStart(3, '0')}`,
    asset_name: req.body.asset_name,
    category_id: parseInt(req.body.category_id) || 1,
    category_name: cat?.category_name || 'General Equipment',
    description: req.body.description || '',
    department: req.body.department || 'Computer Science',
    location_id: parseInt(req.body.location_id) || 1,
    location_name: loc?.name || 'Main Lab',
    status: req.body.status || 'AVAILABLE',
    maintenance_status: req.body.maintenance_status || 'WORKING',
    condition_rating: req.body.condition_rating || 'EXCELLENT',
    risk_score: parseInt(req.body.risk_score) || 75,
    risk_level: parseInt(req.body.risk_score) > 80 ? 'HIGH' : parseInt(req.body.risk_score) > 50 ? 'MEDIUM' : 'LOW',
    assigned_to: req.body.assigned_to || null,
    rfid_uid: req.body.rfid_uid || null,
    purchase_date: req.body.purchase_date || new Date().toISOString().split('T')[0],
    warranty_expiry: req.body.warranty_expiry || '2027-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.assets.push(newAsset);

  // If RFID UID provided, update or add to registry
  if (newAsset.rfid_uid) {
    const isIssued = newAsset.status === 'ISSUED';
    const existingTag = db.rfidTags.find((t) => t.uid === newAsset.rfid_uid);
    if (existingTag) {
      existingTag.asset_id = newAsset.id;
      existingTag.asset_name = newAsset.asset_name;
      existingTag.asset_code = newAsset.asset_code;
      existingTag.assigned_at = new Date().toISOString();
      existingTag.status = 'ASSIGNED';
      existingTag.authorization_status = isIssued ? 'AUTHORIZED' : 'UNAUTHORIZED';
      existingTag.checkout_authorized = isIssued;
      existingTag.assigned_to = isIssued ? (newAsset.assigned_to || null) : null;
    } else {
      db.rfidTags.push({
        id: db.rfidTags.length + 1,
        uid: newAsset.rfid_uid,
        asset_id: newAsset.id,
        asset_name: newAsset.asset_name,
        asset_code: newAsset.asset_code,
        tag_type: 'MFRC522_HF',
        status: 'ASSIGNED',
        authorization_status: isIssued ? 'AUTHORIZED' : 'UNAUTHORIZED',
        checkout_authorized: isIssued,
        assigned_to: isIssued ? (newAsset.assigned_to || null) : null,
        is_active: true,
        assigned_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }
  }

  res.status(201).json({ success: true, asset: newAsset });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.assets.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }

  db.assets[index] = {
    ...db.assets[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };

  res.json({ success: true, asset: db.assets[index] });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.assets = db.assets.filter((a) => a.id !== id);
  res.json({ success: true });
});

export default router;
