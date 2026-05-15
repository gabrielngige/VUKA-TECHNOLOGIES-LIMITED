import express   from 'express';
import bcrypt    from 'bcryptjs';
import jwt       from 'jsonwebtoken';
import { db }   from '../db/database.js';
import { asyncHandler } from '../middleware/auth.js';

const router = express.Router();

const sign = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, hashed, 'customer', new Date().toISOString());

  const user = { id: result.lastInsertRowid, name, email, role: 'customer' };
  res.status(201).json({ user, token: sign(user) });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const { password: _, ...safe } = user;
  res.json({ user: safe, token: sign(user) });
}));

export default router;
