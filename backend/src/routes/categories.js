const express = require('express');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler, makeSlug, pick } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const FIELDS = ['name', 'slug', 'icon', 'code', 'tagline', 'description', 'image', 'color',
  'sort_order', 'is_featured', 'is_active', 'meta_title', 'meta_description',
  'name_bn', 'tagline_bn', 'description_bn'];

router.get('/', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.is_active = 1) AS service_count
     FROM categories c WHERE c.is_active = 1 ORDER BY c.sort_order ASC`
  );
  res.json(rows);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const byId = /^\d+$/.test(req.params.slug);
  const cat = await one(`SELECT * FROM categories WHERE ${byId ? 'id' : 'slug'} = ?`, [req.params.slug]);
  if (!cat) return res.status(404).json({ message: 'Category not found' });

  const groups = await query('SELECT * FROM service_groups WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC', [cat.id]);
  const services = await query('SELECT * FROM services WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC', [cat.id]);
  res.json({
    ...cat,
    groups: groups.map((g) => ({ ...g, services: services.filter((s) => s.group_id === g.id) })),
    services,
  });
}));

router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.name) return res.status(400).json({ message: 'Category name is required' });
  data.slug = data.slug || makeSlug(data.name);
  const keys = Object.keys(data);
  const r = await query(`INSERT INTO categories (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(data));
  await logActivity(req, 'create', 'categories', r.insertId, data.name);
  res.status(201).json({ id: r.insertId, ...data });
}));

router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ message: 'No data supplied' });
  await query(`UPDATE categories SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...Object.values(data), req.params.id]);
  await logActivity(req, 'update', 'categories', req.params.id);
  res.json(await one('SELECT * FROM categories WHERE id = ?', [req.params.id]));
}));

router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  await logActivity(req, 'delete', 'categories', req.params.id);
  res.json({ message: 'Category deleted' });
}));

/* ---- service groups ---- */
router.get('/:id/groups', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM service_groups WHERE category_id = ? ORDER BY sort_order ASC', [req.params.id]));
}));

router.post('/:id/groups', auth, adminOnly, asyncHandler(async (req, res) => {
  const { name, description, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ message: 'Group name is required' });
  const r = await query(
    'INSERT INTO service_groups (category_id, name, slug, description, sort_order) VALUES (?,?,?,?,?)',
    [req.params.id, name, makeSlug(name), description || null, sort_order]
  );
  res.status(201).json({ id: r.insertId, name });
}));

router.delete('/groups/:groupId', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM service_groups WHERE id = ?', [req.params.groupId]);
  res.json({ message: 'Group deleted' });
}));

module.exports = router;
