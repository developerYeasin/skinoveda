const express = require('express');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler, makeSlug, pick } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const FIELDS = [
  'category_id', 'group_id', 'name', 'slug', 'short_description', 'description', 'benefits',
  'image', 'duration', 'price', 'price_note', 'sort_order', 'is_featured', 'is_active',
  'meta_title', 'meta_description',
  'name_bn', 'short_description_bn', 'description_bn', 'benefits_bn',
];

/** Full nested catalog: categories -> groups -> services (used by the Services page) */
router.get('/catalog', asyncHandler(async (req, res) => {
  const categories = await query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC');
  const groups = await query('SELECT * FROM service_groups WHERE is_active = 1 ORDER BY sort_order ASC');
  const services = await query(
    `SELECT id, category_id, group_id, name, name_bn, slug, short_description, short_description_bn,
            image, duration, price, is_featured
     FROM services WHERE is_active = 1 ORDER BY sort_order ASC`
  );

  const catalog = categories.map((c) => ({
    ...c,
    groups: groups
      .filter((g) => g.category_id === c.id)
      .map((g) => ({ ...g, services: services.filter((s) => s.group_id === g.id) })),
    total_services: services.filter((s) => s.category_id === c.id).length,
  }));

  res.json(catalog);
}));

router.get('/featured', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const rows = await query(
    `SELECT s.*, c.name AS category_name, c.name_bn AS category_name_bn, c.slug AS category_slug,
            c.icon AS category_icon, c.color AS category_color
     FROM services s JOIN categories c ON c.id = s.category_id
     WHERE s.is_featured = 1 AND s.is_active = 1
     ORDER BY s.sort_order ASC LIMIT ${limit}`
  );
  res.json(rows);
}));

router.get('/', asyncHandler(async (req, res) => {
  const where = ['s.is_active = 1'];
  const params = [];

  if (req.query.category) {
    where.push('(c.slug = ? OR c.id = ?)');
    params.push(req.query.category, Number(req.query.category) || 0);
  }
  if (req.query.group_id) { where.push('s.group_id = ?'); params.push(req.query.group_id); }
  if (req.query.search) {
    where.push('(s.name LIKE ? OR s.short_description LIKE ? OR c.name LIKE ?)');
    const q = `%${req.query.search}%`;
    params.push(q, q, q);
  }

  const limit = Math.min(Number(req.query.limit) || 60, 500);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const clause = `WHERE ${where.join(' AND ')}`;

  const rows = await query(
    `SELECT s.*, c.name AS category_name, c.name_bn AS category_name_bn, c.slug AS category_slug,
            c.icon AS category_icon, c.color AS category_color,
            g.name AS group_name, g.name_bn AS group_name_bn
     FROM services s
     JOIN categories c ON c.id = s.category_id
     LEFT JOIN service_groups g ON g.id = s.group_id
     ${clause} ORDER BY s.sort_order ASC, s.id ASC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const total = await one(
    `SELECT COUNT(*) AS c FROM services s JOIN categories c ON c.id = s.category_id ${clause}`,
    params
  );
  res.json({ data: rows, total: total.c, page, limit });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const byId = /^\d+$/.test(req.params.slug);
  const row = await one(
    `SELECT s.*, c.name AS category_name, c.name_bn AS category_name_bn, c.slug AS category_slug,
            c.icon AS category_icon, c.color AS category_color,
            g.name AS group_name, g.name_bn AS group_name_bn
     FROM services s
     JOIN categories c ON c.id = s.category_id
     LEFT JOIN service_groups g ON g.id = s.group_id
     WHERE s.${byId ? 'id' : 'slug'} = ? LIMIT 1`,
    [req.params.slug]
  );
  if (!row) return res.status(404).json({ message: 'Service not found' });

  await query('UPDATE services SET views = views + 1 WHERE id = ?', [row.id]);

  const related = await query(
    `SELECT id, name, name_bn, slug, short_description, short_description_bn, image FROM services
     WHERE category_id = ? AND id <> ? AND is_active = 1 ORDER BY RAND() LIMIT 6`,
    [row.category_id, row.id]
  );
  res.json({ ...row, related });
}));

router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.name) return res.status(400).json({ message: 'Service name is required' });
  data.slug = data.slug || makeSlug(`${data.name}-${Date.now().toString(36)}`);
  const keys = Object.keys(data);
  const r = await query(
    `INSERT INTO services (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    Object.values(data)
  );
  await logActivity(req, 'create', 'services', r.insertId, data.name);
  res.status(201).json({ id: r.insertId, ...data });
}));

router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ message: 'No data supplied' });
  await query(
    `UPDATE services SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), req.params.id]
  );
  await logActivity(req, 'update', 'services', req.params.id);
  res.json(await one('SELECT * FROM services WHERE id = ?', [req.params.id]));
}));

router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM services WHERE id = ?', [req.params.id]);
  await logActivity(req, 'delete', 'services', req.params.id);
  res.json({ message: 'Service deleted' });
}));

module.exports = router;
