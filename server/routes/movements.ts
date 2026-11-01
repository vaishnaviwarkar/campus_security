import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  let list = db.movements.map((m: any) => {
    const validTime = m.timestamp || m.scanned_at || m.created_at || new Date().toISOString();
    return {
      ...m,
      timestamp: validTime,
      scanned_at: validTime,
      created_at: validTime
    };
  });
  if (req.query.authorization_status) {
    list = list.filter((m) => m.authorization_status === req.query.authorization_status);
  }
  if (req.query.checkpoint_id) {
    list = list.filter((m) => m.checkpoint_id === parseInt(req.query.checkpoint_id as string));
  }
  res.json({
    success: true,
    count: list.length,
    movements: list
  });
});

export default router;
