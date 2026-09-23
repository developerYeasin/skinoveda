const express = require('express');
const rateLimit = require('express-rate-limit');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const bookLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 15 });

function bookingCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `SKV-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/** Public booking */
router.post('/', bookLimiter, asyncHandler(async (req, res) => {
  const {
    name, email, phone, gender, age, category_id, service_id, doctor_id,
    preferred_date, preferred_time, message, source,
  } = req.body;

  if (!name || !phone) return res.status(400).json({ message: 'Name and phone number are required' });

  const code = bookingCode();
  const r = await query(
    `INSERT INTO appointments
      (booking_code, name, email, phone, gender, age, category_id, service_id, doctor_id, preferred_date, preferred_time, message, source)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      code, name, email || null, phone, gender || 'female', age || null,
      category_id || null, service_id || null, doctor_id || null,
      preferred_date || null, preferred_time || null, message || null, source || 'website',
    ]
  );

  // count as a conversion in internal analytics
  await query(
    'INSERT INTO analytics_events (visitor_id, session_id, event_name, event_category, label, path) VALUES (?,?,?,?,?,?)',
    [req.body.visitor_id || null, req.body.session_id || null, 'appointment_booked', 'conversion', code, '/book-appointment']
  ).catch(() => {});

  res.status(201).json({
    id: r.insertId,
    booking_code: code,
    message: 'Your appointment request has been received. Our team will call you shortly to confirm.',
  });
}));

router.get('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status) { where.push('a.status = ?'); params.push(req.query.status); }
  if (req.query.from) { where.push('DATE(a.created_at) >= ?'); params.push(req.query.from); }
  if (req.query.to) { where.push('DATE(a.created_at) <= ?'); params.push(req.query.to); }
  if (req.query.search) {
    where.push('(a.name LIKE ? OR a.phone LIKE ? OR a.booking_code LIKE ? OR a.email LIKE ?)');
    const q = `%${req.query.search}%`;
    params.push(q, q, q, q);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const rows = await query(
    `SELECT a.*, s.name AS service_name, c.name AS category_name, t.name AS doctor_name
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN team_members t ON t.id = a.doctor_id
     ${clause} ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params
  );
  const total = await one(`SELECT COUNT(*) AS c FROM appointments a ${clause}`, params);
  res.json({ data: rows, total: total.c, page, limit });
}));

router.get('/track/:code', asyncHandler(async (req, res) => {
  const row = await one(
    `SELECT a.booking_code, a.name, a.status, a.preferred_date, a.preferred_time, s.name AS service_name
     FROM appointments a LEFT JOIN services s ON s.id = a.service_id WHERE a.booking_code = ?`,
    [req.params.code]
  );
  if (!row) return res.status(404).json({ message: 'Booking not found' });
  res.json(row);
}));

router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { status, admin_note, preferred_date, preferred_time, doctor_id } = req.body;
  await query(
    `UPDATE appointments SET
       status = COALESCE(?, status),
       admin_note = COALESCE(?, admin_note),
       preferred_date = COALESCE(?, preferred_date),
       preferred_time = COALESCE(?, preferred_time),
       doctor_id = COALESCE(?, doctor_id)
     WHERE id = ?`,
    [status || null, admin_note || null, preferred_date || null, preferred_time || null, doctor_id || null, req.params.id]
  );
  await logActivity(req, 'update_appointment', 'appointments', req.params.id, status);
  res.json(await one('SELECT * FROM appointments WHERE id = ?', [req.params.id]));
}));

router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
  await logActivity(req, 'delete', 'appointments', req.params.id);
  res.json({ message: 'Appointment deleted' });
}));

module.exports = router;
