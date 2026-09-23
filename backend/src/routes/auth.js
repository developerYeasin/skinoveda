const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { query, one } = require('../config/db');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please try again later.' },
});

function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await one('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
  req.user = user;
  await logActivity(req, 'login', 'users', user.id);

  delete user.password;
  res.json({ token: sign(user), user });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await one('SELECT id, name, email, phone, role, avatar, last_login FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

router.put('/profile', auth, asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  await query('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar) WHERE id = ?',
    [name || null, phone || null, avatar || null, req.user.id]);
  const user = await one('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
}));

router.put('/change-password', auth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: 'New password must be at least 6 characters' });

  const user = await one('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const ok = await bcrypt.compare(currentPassword || '', user.password);
  if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

  await query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(newPassword, 10), req.user.id]);
  await logActivity(req, 'change_password', 'users', req.user.id);
  res.json({ message: 'Password updated' });
}));

module.exports = router;
