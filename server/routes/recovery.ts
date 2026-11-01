import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/missing', (req, res) => {
  const missing = db.assets.filter((a) => a.status === 'MISSING');
  res.json({
    success: true,
    count: missing.length,
    missingAssets: missing
  });
});

router.post('/flag-missing', (req, res) => {
  const { asset_id, reason } = req.body;
  const asset = db.assets.find((a) => a.id === parseInt(asset_id));
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }

  asset.status = 'MISSING';

  // Add Alert
  const newAlert = {
    id: db.alerts.length + 1,
    alert_code: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
    asset_id: asset.id,
    asset_name: asset.asset_name,
    asset_code: asset.asset_code,
    rfid_uid: asset.rfid_uid || undefined,
    checkpoint_id: 1,
    checkpointId: 1,
    checkpoint_name: 'Campus Perimeter',
    device_code: 'CAMPUS-CORE',
    device_id: 'CAMPUS-CORE',
    alert_type: 'MISSING_ASSET_DETECTED',
    severity: 'HIGH' as const,
    message: `⚠️ Asset flagged MISSING: ${asset.asset_name} (${reason || 'Unaccounted for during audit'})`,
    camera_event_id: null,
    camera_image_url: undefined,
    status: 'OPEN' as const,
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    resolution_notes: null,
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
  db.alerts.unshift(newAlert);

  res.json({ success: true, message: 'Asset flagged as missing', asset });
});

router.post('/confirm-recovered', (req, res) => {
  const { asset_id, condition_rating, notes } = req.body;
  const asset = db.assets.find((a) => a.id === parseInt(asset_id));
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }

  asset.status = 'RECOVERED';
  asset.assigned_to = null;
  if (condition_rating) asset.condition_rating = condition_rating;

  // Preserve RFID card and history, but ensure checkout authorization is revoked until new loan
  const tagsToUpdate = db.rfidTags.filter(
    (t) => t.asset_id === asset.id || (asset.rfid_uid && t.uid === asset.rfid_uid)
  );
  tagsToUpdate.forEach((tag) => {
    tag.asset_id = asset.id;
    tag.asset_name = asset.asset_name;
    tag.asset_code = asset.asset_code;
    tag.status = 'ASSIGNED';
    tag.authorization_status = 'UNAUTHORIZED';
    tag.checkout_authorized = false;
    tag.assigned_to = null;
  });

  // Resolve related alerts
  db.alerts.forEach((alert) => {
    if (alert.asset_id === asset.id && alert.status === 'OPEN') {
      alert.status = 'RESOLVED';
      alert.resolved_by = 'Dr. Robert Vance';
      alert.resolved_at = new Date().toISOString();
      alert.resolution_notes = `Asset recovered successfully: ${notes || 'Verified on-site'}`;
    }
  });

  res.json({ success: true, message: 'Asset confirmed recovered', asset });
});

export default router;
