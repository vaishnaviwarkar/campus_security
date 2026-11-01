import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  let list = [...db.maintenance];
  if (req.query.status) {
    list = list.filter((m) => m.status === req.query.status);
  }
  res.json({
    success: true,
    count: list.length,
    records: list
  });
});

router.post('/', (req, res) => {
  const { asset_id, issue_description, priority, reported_by, cost } = req.body;
  const asset = db.assets.find((a) => a.id === parseInt(asset_id));
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }

  asset.maintenance_status = 'UNDER_REPAIR';
  asset.status = 'UNDER_REPAIR';

  const newRecord = {
    id: db.maintenance.length + 1,
    asset_id: asset.id,
    asset_name: asset.asset_name,
    asset_code: asset.asset_code,
    issue_description,
    reported_by: reported_by || 'Lab Staff',
    status: 'IN_PROGRESS' as const,
    priority: priority || 'MEDIUM',
    technician_notes: 'Ticket logged. Diagnostic diagnostics queued.',
    cost: parseFloat(cost) || 0,
    created_at: new Date().toISOString(),
    resolved_at: null
  };

  db.maintenance.unshift(newRecord);
  res.status(201).json({ success: true, record: newRecord, asset });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.maintenance.find((m) => m.id === id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  const { status, technician_notes, cost } = req.body;
  if (status) record.status = status;
  if (technician_notes) record.technician_notes = technician_notes;
  if (cost !== undefined) record.cost = parseFloat(cost);

  const asset = db.assets.find((a) => a.id === record.asset_id);
  if (status === 'COMPLETED') {
    record.resolved_at = new Date().toISOString();
    if (asset) {
      asset.maintenance_status = 'WORKING';
      asset.status = 'AVAILABLE';
    }
  }

  res.json({ success: true, record, asset });
});

export default router;
