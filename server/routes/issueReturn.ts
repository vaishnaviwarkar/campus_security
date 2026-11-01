import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  let list = [...db.issues];
  if (req.query.status) {
    list = list.filter((i) => i.status === req.query.status);
  }
  res.json({
    success: true,
    count: list.length,
    issues: list
  });
});

router.post('/issue', (req, res) => {
  const { asset_id, issued_to_name, issued_to_id, issued_by_id, expected_return, purpose, rfid_uid } = req.body;
  const asset = db.assets.find((a) => a.id === parseInt(asset_id));
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }

  asset.status = 'ISSUED';
  asset.assigned_to = `${issued_to_name} (ID: ${issued_to_id})`;

  // If a tag UID was explicitly selected or if asset already has an assigned tag, authorize RFID checkout
  const targetTagUid = rfid_uid || asset.rfid_uid;
  let targetTag = null;
  if (targetTagUid) {
    targetTag = db.rfidTags.find((t) => t.uid === targetTagUid);
  } else {
    targetTag = db.rfidTags.find((t) => t.asset_id === asset.id);
  }

  if (targetTag) {
    targetTag.asset_id = asset.id;
    targetTag.asset_name = asset.asset_name;
    targetTag.asset_code = asset.asset_code;
    targetTag.assigned_at = new Date().toISOString();
    targetTag.assigned_to = asset.assigned_to;
    targetTag.status = 'ASSIGNED';
    targetTag.authorization_status = 'AUTHORIZED';
    targetTag.checkout_authorized = true;
    asset.rfid_uid = targetTag.uid;
  }

  const staff = db.users.find((u) => u.id === parseInt(issued_by_id)) || db.users[1];

  const newIssue = {
    id: db.issues.length + 1,
    asset_id: asset.id,
    asset_name: asset.asset_name,
    asset_code: asset.asset_code,
    issued_to_name,
    issued_to_id,
    issued_by_id: staff.id,
    issued_by_name: staff.name,
    issued_at: new Date().toISOString(),
    expected_return: expected_return || new Date(Date.now() + 7 * 86400000).toISOString(),
    actual_return: null,
    purpose: purpose || 'Academic coursework & lab experimentation',
    status: 'ISSUED' as const
  };

  db.issues.unshift(newIssue);
  res.status(201).json({ success: true, issue: newIssue, asset, tag: targetTag });
});

router.post('/return', (req, res) => {
  const { issue_id, asset_id, condition_rating, return_notes } = req.body;

  let issue = null;
  if (issue_id) {
    issue = db.issues.find((i) => i.id === parseInt(issue_id));
  } else if (asset_id) {
    issue = db.issues.find((i) => i.asset_id === parseInt(asset_id) && i.status === 'ISSUED');
  }

  if (issue) {
    issue.status = 'RETURNED';
    issue.actual_return = new Date().toISOString();
  }

  const targetAssetId = issue ? issue.asset_id : parseInt(asset_id);
  const asset = db.assets.find((a) => a.id === targetAssetId);
  const updatedTags: any[] = [];

  if (asset) {
    // 1. Asset status is set back to AVAILABLE in inventory / lab stand
    asset.status = 'AVAILABLE';
    asset.assigned_to = null;
    if (condition_rating) asset.condition_rating = condition_rating;

    // 2. Keep RFID card attached and preserve history, but REVOKE checkout authorization
    // Once the asset is returned, it again requires checkout authorization to take it out.
    const tagsToUpdate = db.rfidTags.filter(
      (t) => t.asset_id === asset.id || (asset.rfid_uid && t.uid === asset.rfid_uid)
    );

    tagsToUpdate.forEach((tag) => {
      // Preserve asset binding and tag identity so full history is maintained
      tag.asset_id = asset.id;
      tag.asset_name = asset.asset_name;
      tag.asset_code = asset.asset_code;
      // Revoke checkout authorization: returned to stand, requires authorization again before exit
      tag.status = 'ASSIGNED';
      tag.authorization_status = 'UNAUTHORIZED';
      tag.checkout_authorized = false;
      tag.assigned_to = null;
      updatedTags.push(tag);
    });

    // Ensure asset keeps its rfid_uid so identity and history remain intact!
    if (tagsToUpdate.length > 0 && !asset.rfid_uid) {
      asset.rfid_uid = tagsToUpdate[0].uid;
    }
  }

  res.json({
    success: true,
    message: 'Asset returned successfully. History preserved. RFID card authorization revoked (requires new checkout authorization to take out).',
    asset,
    tags: updatedTags
  });
});

export default router;
