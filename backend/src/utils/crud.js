const express = require('express');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler, makeSlug, pick } = require('./helpers');
const { logActivity } = require('./activity');

/**
 * Builds a REST router for a table.
 *  GET    /            public list (active only unless ?admin=1 with token)
 *  GET    /:id         single
 *  POST   /            admin create
 *  PUT    /:id         admin update
 *  DELETE /:id         admin delete
 */
function crudRouter({
  table,
  fields,
  slugFrom = null,
  defaultOrder = 'sort_order ASC, id DESC',
  publicWhere = 'is_active = 1',
  searchFields = [],
  filters = [],
}) {
  const router = express.Router();

  const listHandler = asyncHandler(async (req, res) => {
    const where = [];
    const params = [];

    if (!req.user) where.push(publicWhere);
    else if (req.query.is_active !== undefined) {
      where.push('is_active = ?');
      params.push(Number(req.query.is_active));
    }

    filters.forEach((f) => {
      if (req.query[f] !== undefined && req.query[f] !== '') {
        where.push(`\`${f}\` = ?`);
        params.push(req.query[f]);
      }
    });

    if (req.query.search && searchFields.length) {
      where.push(`(${searchFields.map((f) => `\`${f}\` LIKE ?`).join(' OR ')})`);
      searchFields.forEach(() => params.push(`%${req.query.search}%`));
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const rows = await query(
      `SELECT * FROM \`${table}\` ${clause} ORDER BY ${defaultOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const total = await one(`SELECT COUNT(*) AS c FROM \`${table}\` ${clause}`, params);
    res.json({ data: rows, total: total.c, page, limit });
  });

  // Optional auth for list: read token if present
  router.get('/', (req, res, next) => {
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) {
      try {
        req.user = require('jsonwebtoken').verify(h.slice(7), process.env.JWT_SECRET);
      } catch { /* ignore, treat as public */ }
    }
    next();
  }, listHandler);

  router.get('/:id', asyncHandler(async (req, res) => {
    const byId = /^\d+$/.test(req.params.id);
    const row = await one(
      `SELECT * FROM \`${table}\` WHERE ${byId ? 'id' : 'slug'} = ? LIMIT 1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  }));

  router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
    const data = pick(req.body, fields);
    if (slugFrom && !data.slug && data[slugFrom]) data.slug = makeSlug(data[slugFrom]);
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ message: 'No data supplied' });
    const sql = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
    const result = await query(sql, Object.values(data));
    await logActivity(req, 'create', table, result.insertId);
    res.status(201).json({ id: result.insertId, ...data });
  }));

  router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
    const data = pick(req.body, fields);
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ message: 'No data supplied' });
    const sql = `UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`;
    await query(sql, [...Object.values(data), req.params.id]);
    await logActivity(req, 'update', table, req.params.id);
    const row = await one(`SELECT * FROM \`${table}\` WHERE id = ?`, [req.params.id]);
    res.json(row);
  }));

  router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
    await query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]);
    await logActivity(req, 'delete', table, req.params.id);
    res.json({ message: 'Deleted' });
  }));

  return router;
}

module.exports = crudRouter;
