import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Simulated valid JWT token for authenticated session
  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json({
    success: true,
    token,
    user
  });
});

router.get('/me', (req, res) => {
  res.json({
    success: true,
    user: db.users[0]
  });
});

router.get('/users', (req, res) => {
  res.json({
    success: true,
    users: db.users,
    roles: [
      { id: 1, role_code: 'ADMIN', role_name: 'System Administrator' },
      { id: 2, role_code: 'LAB_STAFF', role_name: 'Laboratory Staff' },
      { id: 3, role_code: 'SECURITY', role_name: 'Campus Security Officer' }
    ]
  });
});

router.post('/users', (req, res) => {
  const newUser = {
    id: db.users.length + 1,
    name: req.body.name,
    email: req.body.email,
    role_id: req.body.role_id || 2,
    role_code: req.body.role_code || 'LAB_STAFF',
    department: req.body.department || 'Campus Department',
    phone: req.body.phone || '',
    status: 'ACTIVE' as const,
    created_at: new Date().toISOString()
  };
  db.users.push(newUser);
  res.status(201).json({ success: true, user: newUser });
});

router.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = db.users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  db.users[userIndex] = {
    ...db.users[userIndex],
    ...req.body
  };
  res.json({ success: true, user: db.users[userIndex] });
});

router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.users = db.users.filter((u) => u.id !== id);
  res.json({ success: true });
});

export default router;
