const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const upload = require('../middleware/upload');
const crudRouter = require('../utils/crud');

/* ---------- team ---------- */
const team = crudRouter({
  table: 'team_members',
  slugFrom: 'name',
  fields: ['name', 'slug', 'designation', 'specialization', 'qualifications', 'experience',
    'bio', 'quote', 'photo', 'facebook', 'instagram', 'linkedin', 'sort_order', 'is_active',
    'name_bn', 'designation_bn', 'bio_bn'],
  searchFields: ['name', 'designation', 'specialization'],
});

/* ---------- gallery ---------- */
const gallery = crudRouter({
  table: 'gallery',
  fields: ['title', 'caption', 'image', 'album', 'sort_order', 'is_active'],
  filters: ['album'],
  searchFields: ['title', 'caption'],
});

/* ---------- testimonials ---------- */
const testimonials = crudRouter({
  table: 'testimonials',
  fields: ['client_name', 'client_title', 'photo', 'rating', 'message', 'service_name', 'is_approved', 'sort_order'],
  publicWhere: 'is_approved = 1',
  searchFields: ['client_name', 'message'],
});

/* ---------- blogs ---------- */
const blogs = express.Router();
const BLOG_FIELDS = ['title', 'slug', 'excerpt', 'content', 'cover_image', 'tags', 'author',
  'status', 'published_at', 'meta_title', 'meta_description',
  'title_bn', 'excerpt_bn', 'content_bn'];

blogs.get('/', asyncHandler(async (req, res) => {
  const where = ["status = 'published'"];
  const params = [];
  if (req.query.tag) { where.push('tags LIKE ?'); params.push(`%${req.query.tag}%`); }
  if (req.query.search) { where.push('(title LIKE ? OR excerpt LIKE ?)'); params.push(`%${req.query.search}%`, `%${req.query.search}%`); }
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const clause = `WHERE ${where.join(' AND ')}`;
  const rows = await query(
    `SELECT id, title, title_bn, slug, excerpt, excerpt_bn, cover_image, tags, author, views, published_at, created_at
     FROM blogs ${clause} ORDER BY COALESCE(published_at, created_at) DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params
  );
  const total = await one(`SELECT COUNT(*) AS c FROM blogs ${clause}`, params);
  res.json({ data: rows, total: total.c, page, limit });
}));

blogs.get('/admin/all', auth, adminOnly, asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM blogs ORDER BY created_at DESC'));
}));

blogs.get('/:slug', asyncHandler(async (req, res) => {
  const byId = /^\d+$/.test(req.params.slug);
  const row = await one(`SELECT * FROM blogs WHERE ${byId ? 'id' : 'slug'} = ?`, [req.params.slug]);
  if (!row) return res.status(404).json({ message: 'Post not found' });
  await query('UPDATE blogs SET views = views + 1 WHERE id = ?', [row.id]);
  const related = await query(
    "SELECT id, title, title_bn, slug, excerpt, excerpt_bn, cover_image FROM blogs WHERE id <> ? AND status = 'published' ORDER BY created_at DESC LIMIT 3",
    [row.id]
  );
  res.json({ ...row, related });
}));

blogs.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const { makeSlug, pick } = require('../utils/helpers');
  const data = pick(req.body, BLOG_FIELDS);
  if (!data.title) return res.status(400).json({ message: 'Title is required' });
  data.slug = data.slug || makeSlug(data.title);
  if (data.status === 'published' && !data.published_at) data.published_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const keys = Object.keys(data);
  const r = await query(`INSERT INTO blogs (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(data));
  res.status(201).json({ id: r.insertId, ...data });
}));

blogs.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { pick } = require('../utils/helpers');
  const data = pick(req.body, BLOG_FIELDS);
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ message: 'No data supplied' });
  await query(`UPDATE blogs SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...Object.values(data), req.params.id]);
  res.json(await one('SELECT * FROM blogs WHERE id = ?', [req.params.id]));
}));

blogs.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM blogs WHERE id = ?', [req.params.id]);
  res.json({ message: 'Post deleted' });
}));

/* ---------- contact ---------- */
const contact = express.Router();
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

contact.post('/', contactLimiter, asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ message: 'Name and message are required' });
  const r = await query(
    'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?,?,?,?,?)',
    [name, email || null, phone || null, subject || 'Website enquiry', message]
  );
  res.status(201).json({ id: r.insertId, message: 'Thank you. We will get back to you shortly.' });
}));

contact.get('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 300);
  const rows = await query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ${limit}`);
  res.json({ data: rows, total: rows.length });
}));

contact.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { is_read, replied } = req.body;
  await query('UPDATE contact_messages SET is_read = COALESCE(?, is_read), replied = COALESCE(?, replied) WHERE id = ?',
    [is_read ?? null, replied ?? null, req.params.id]);
  res.json(await one('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]));
}));

contact.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ message: 'Message deleted' });
}));

/* ---------- subscribers ---------- */
const subscribers = express.Router();

subscribers.post('/', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'A valid email is required' });
  await query('INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active = 1', [email.toLowerCase()]);
  res.status(201).json({ message: 'Subscribed. Thank you!' });
}));

subscribers.get('/', auth, adminOnly, asyncHandler(async (req, res) => {
  res.json({ data: await query('SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 1000') });
}));

subscribers.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM subscribers WHERE id = ?', [req.params.id]);
  res.json({ message: 'Subscriber removed' });
}));

/* ---------- uploads ---------- */
const uploads = express.Router();

uploads.post('/', auth, adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.status(201).json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
});

uploads.post('/multiple', auth, adminOnly, upload.array('files', 12), (req, res) => {
  const files = (req.files || []).map((f) => ({ url: `/uploads/${f.filename}`, filename: f.filename }));
  res.status(201).json({ files });
});

uploads.delete('/:filename', auth, adminOnly, (req, res) => {
  const safe = path.basename(req.params.filename);
  const file = path.join(__dirname, '..', '..', 'uploads', safe);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ message: 'File deleted' });
});

module.exports = { team, gallery, testimonials, blogs, contact, subscribers, uploads };
