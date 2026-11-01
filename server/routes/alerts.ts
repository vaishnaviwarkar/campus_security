import { Router } from 'express';
import { db } from '../db';
import { broadcastAlert } from '../socket';

const router = Router();

router.get('/', (req, res) => {
  let list = db.alerts.map((a: any) => {
    const validTime = a.created_at || a.timestamp || new Date().toISOString();
    return {
      ...a,
      created_at: validTime,
      timestamp: validTime
    };
  });
  if (req.query.status) {
    list = list.filter((a) => a.status === req.query.status);
  }
  if (req.query.severity) {
    list = list.filter((a) => a.severity === req.query.severity);
  }
  if (req.query.checkpoint_id) {
    const cpId = parseInt(req.query.checkpoint_id as string);
    list = list.filter((a) => a.checkpoint_id === cpId);
  }
  res.json({
    success: true,
    count: list.length,
    alerts: list
  });
});

router.post('/:id/acknowledge', (req, res) => {
  const id = parseInt(req.params.id);
  const alert = db.alerts.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledged_by = 'Officer Marcus Kane';
  alert.acknowledged_at = new Date().toISOString();

  res.json({ success: true, alert });
});

router.post('/:id/resolve', (req, res) => {
  const id = parseInt(req.params.id);
  const alert = db.alerts.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }

  alert.status = 'RESOLVED';
  alert.resolved_by = 'Officer Marcus Kane';
  alert.resolved_at = new Date().toISOString();
  alert.resolution_notes = req.body.resolution_notes || 'Incident inspected and verified on-site.';

  res.json({ success: true, alert });
});

router.post('/', (req, res) => {
  const { asset_id, message, severity, alert_type, checkpoint_id } = req.body;
  const asset = asset_id ? db.assets.find((a) => a.id === parseInt(asset_id)) : null;
  const cp = db.checkpoints.find((c) => c.id === parseInt(checkpoint_id)) || db.checkpoints[0];

  const newAlert = {
    id: db.alerts.length + 1,
    alert_code: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
    asset_id: asset ? asset.id : null,
    asset_name: asset ? asset.asset_name : undefined,
    asset_code: asset ? asset.asset_code : undefined,
    rfid_uid: asset ? (asset.rfid_uid || undefined) : undefined,
    checkpoint_id: cp.id,
    checkpointId: cp.id,
    checkpoint_name: cp.name,
    device_code: cp.id === 2 ? 'ESP32-CP02-GATE' : 'ESP32-CP01-GATE',
    device_id: cp.id === 2 ? 'ESP32-CP02-GATE' : 'ESP32-CP01-GATE',
    alert_type: alert_type || 'MANUAL_SECURITY_FLAG',
    severity: severity || 'MEDIUM',
    message: message || `Manual security alert triggered by operator at ${cp.name}`,
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
  broadcastAlert(newAlert);

  res.status(201).json({ success: true, alert: newAlert });
});

export default router;
