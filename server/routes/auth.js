import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { readDB, writeDB } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();
const publicUser = ({ password, ...u }) => u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = readDB();
  const normalized = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === normalized)) return res.status(409).json({ error: 'An account with this email already exists' });

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    phone: phone?.trim() || '',
    password: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = readDB().users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

export default router;
