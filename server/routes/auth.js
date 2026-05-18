import express   from 'express';
import bcrypt    from 'bcryptjs';
import jwt       from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { db }   from '../db/database.js';
import { asyncHandler } from '../middleware/auth.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// POST /api/auth/google
router.post('/google', asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Google credential required' });

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { sub: googleId, email, name, picture } = ticket.getPayload();

  let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email);

  if (user) {
    // Link google_id if this email was registered without OAuth
    if (!user.google_id) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
      user = { ...user, google_id: googleId };
    }
  } else {
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, google_id, createdAt) VALUES (?, ?, NULL, ?, ?, ?)'
    ).run(name, email, 'customer', googleId, new Date().toISOString());
    user = { id: result.lastInsertRowid, name, email, role: 'customer', google_id: googleId };
  }

  const { password: _, google_id: __, ...safe } = user;
  res.json({ user: safe, token: sign(user) });
}));

export default router;
