/**
 * Shop: product catalogue, filters and checkout.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { query, one, pool } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler, makeSlug, pick } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const FIELDS = [
  'category_id', 'brand_id', 'name', 'name_bn', 'slug', 'subtitle', 'subtitle_bn',
  'description', 'description_bn', 'ingredients', 'how_to_use', 'image', 'gallery',
  'price', 'sale_price', 'sku', 'stock', 'size_label', 'skin_type', 'badge',
  'rating', 'review_count', 'sort_order', 'is_featured', 'is_active',
  'meta_title', 'meta_description',
];

const SELECT = `
  p.*, c.name AS category_name, c.name_bn AS category_name_bn, c.slug AS category_slug,
  b.name AS brand_name, b.slug AS brand_slug,
  COALESCE(p.sale_price, p.price) AS effective_price,
  CASE WHEN p.sale_price IS NOT NULL AND p.price > 0
       THEN ROUND((p.price - p.sale_price) / p.price * 100) ELSE 0 END AS discount_percent
`;
const JOINS = `
  FROM products p
  LEFT JOIN product_categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
`;

/* ---------------- filters sidebar ---------------- */

router.get('/filters', asyncHandler(async (req, res) => {
  const categories = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
     FROM product_categories c WHERE c.is_active = 1 ORDER BY c.sort_order ASC`
  );
  const brands = await query(
    `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = 1) AS product_count
     FROM brands b WHERE b.is_active = 1 HAVING product_count > 0 ORDER BY product_count DESC`
  );
  const skinTypes = await query(
    `SELECT skin_type AS value, COUNT(*) AS product_count
     FROM products WHERE is_active = 1 GROUP BY skin_type ORDER BY product_count DESC`
  );
  const range = await one(
    'SELECT MIN(COALESCE(sale_price, price)) AS min, MAX(COALESCE(sale_price, price)) AS max FROM products WHERE is_active = 1'
  );
  const total = await one('SELECT COUNT(*) AS c FROM products WHERE is_active = 1');

  res.json({ categories, brands, skinTypes, priceRange: range, total: total.c });
}));

/* ---------------- product list ---------------- */

router.get('/products', asyncHandler(async (req, res) => {
  const where = ['p.is_active = 1'];
  const params = [];

  if (req.query.category) {
    where.push('c.slug = ?');
    params.push(req.query.category);
  }
  if (req.query.brand) {
    // comma separated slugs
    const slugs = String(req.query.brand).split(',').filter(Boolean);
    if (slugs.length) {
      where.push(`b.slug IN (${slugs.map(() => '?').join(',')})`);
      params.push(...slugs);
    }
  }
  if (req.query.skin_type) {
    const types = String(req.query.skin_type).split(',').filter(Boolean);
    if (types.length) {
      where.push(`p.skin_type IN (${types.map(() => '?').join(',')})`);
      params.push(...types);
    }
  }
  if (req.query.min_price) {
    where.push('COALESCE(p.sale_price, p.price) >= ?');
    params.push(Number(req.query.min_price));
  }
  if (req.query.max_price) {
    where.push('COALESCE(p.sale_price, p.price) <= ?');
    params.push(Number(req.query.max_price));
  }
  if (req.query.badge) { where.push('p.badge = ?'); params.push(req.query.badge); }
  if (req.query.featured === '1') where.push('p.is_featured = 1');
  if (req.query.search) {
    where.push('(p.name LIKE ? OR p.name_bn LIKE ? OR p.subtitle LIKE ? OR b.name LIKE ?)');
    const q = `%${req.query.search}%`;
    params.push(q, q, q, q);
  }

  const SORTS = {
    featured: 'p.is_featured DESC, p.sort_order ASC',
    newest: 'p.created_at DESC',
    price_low: 'effective_price ASC',
    price_high: 'effective_price DESC',
    rating: 'p.rating DESC, p.review_count DESC',
    popular: 'p.sold DESC, p.views DESC',
  };
  const order = SORTS[req.query.sort] || SORTS.featured;

  const limit = Math.min(Number(req.query.limit) || 24, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const clause = `WHERE ${where.join(' AND ')}`;

  const rows = await query(
    `SELECT ${SELECT} ${JOINS} ${clause} ORDER BY ${order} LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params
  );
  const total = await one(`SELECT COUNT(*) AS c ${JOINS} ${clause}`, params);

  res.json({ data: rows, total: total.c, page, limit, pages: Math.ceil(total.c / limit) });
}));

router.get('/products/:slug', asyncHandler(async (req, res) => {
  const byId = /^\d+$/.test(req.params.slug);
  const row = await one(
    `SELECT ${SELECT} ${JOINS} WHERE p.${byId ? 'id' : 'slug'} = ? LIMIT 1`,
    [req.params.slug]
  );
  if (!row) return res.status(404).json({ message: 'Product not found' });

  await query('UPDATE products SET views = views + 1 WHERE id = ?', [row.id]);

  const related = await query(
    `SELECT ${SELECT} ${JOINS}
     WHERE p.category_id <=> ? AND p.id <> ? AND p.is_active = 1
     ORDER BY RAND() LIMIT 4`,
    [row.category_id, row.id]
  );
  const reviews = await query(
    'SELECT customer_name, rating, comment, created_at FROM product_reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC LIMIT 20',
    [row.id]
  );

  res.json({ ...row, related, reviews });
}));

/* ---------------- checkout ---------------- */

const orderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

function orderCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `SKV-O${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

router.post('/orders', orderLimiter, asyncHandler(async (req, res) => {
  const { customer_name, phone, email, address, city, area, note, payment_method, items } = req.body;

  if (!customer_name || !phone || !address) {
    return res.status(400).json({ message: 'Name, phone and address are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Your bag is empty' });
  }

  // price the order from the database, never from what the browser sent
  const ids = items.map((i) => Number(i.product_id)).filter(Boolean);
  if (!ids.length) return res.status(400).json({ message: 'No valid products in the bag' });

  const products = await query(
    `SELECT id, name, image, stock, COALESCE(sale_price, price) AS unit_price
     FROM products WHERE id IN (${ids.map(() => '?').join(',')}) AND is_active = 1`,
    ids
  );
  if (!products.length) return res.status(400).json({ message: 'No valid products in the bag' });

  const lines = [];
  let subtotal = 0;
  for (const item of items) {
    const p = products.find((x) => x.id === Number(item.product_id));
    if (!p) continue;
    const qty = Math.max(1, Math.min(Number(item.quantity) || 1, 99));
    if (p.stock < qty) {
      return res.status(400).json({ message: `${p.name} — only ${p.stock} left in stock` });
    }
    const lineTotal = Number(p.unit_price) * qty;
    subtotal += lineTotal;
    lines.push({ id: p.id, name: p.name, image: p.image, unit: Number(p.unit_price), qty, lineTotal });
  }
  if (!lines.length) return res.status(400).json({ message: 'No valid products in the bag' });

  const cfg = await query(
    "SELECT setting_key k, setting_value v FROM settings WHERE setting_group = 'shop'"
  );
  const get = (k, d) => Number(cfg.find((c) => c.k === k)?.v ?? d);
  const inside = /dhaka/i.test(city || '');
  let delivery = inside ? get('delivery_charge_inside', 70) : get('delivery_charge_outside', 130);
  const freeOver = get('free_delivery_over', 3000);
  if (freeOver > 0 && subtotal >= freeOver) delivery = 0;

  const total = subtotal + delivery;
  const code = orderCode();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.execute(
      `INSERT INTO orders
        (order_code, customer_name, phone, email, address, city, area, note,
         subtotal, delivery_charge, total, payment_method)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, customer_name, phone, email || null, address, city || null, area || null,
        note || null, subtotal, delivery, total, payment_method || 'cod']
    );
    const orderId = r.insertId;

    for (const l of lines) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
         VALUES (?,?,?,?,?,?,?)`,
        [orderId, l.id, l.name, l.image, l.unit, l.qty, l.lineTotal]
      );
      await conn.execute(
        'UPDATE products SET stock = GREATEST(stock - ?, 0), sold = sold + ? WHERE id = ?',
        [l.qty, l.qty, l.id]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  await query(
    'INSERT INTO analytics_events (visitor_id, session_id, event_name, event_category, label, value, path) VALUES (?,?,?,?,?,?,?)',
    [req.body.visitor_id || null, req.body.session_id || null, 'order_placed', 'conversion', code, total, '/checkout']
  ).catch(() => {});

  res.status(201).json({
    order_code: code,
    subtotal,
    delivery_charge: delivery,
    total,
    message: 'Order placed. Our team will call you shortly to confirm.',
  });
}));

/** Public order lookup by code. */
router.get('/orders/track/:code', asyncHandler(async (req, res) => {
  const order = await one(
    'SELECT order_code, customer_name, status, payment_status, total, created_at FROM orders WHERE order_code = ?',
    [req.params.code]
  );
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const items = await query(
    'SELECT product_name, product_image, unit_price, quantity, line_total FROM order_items WHERE order_id = (SELECT id FROM orders WHERE order_code = ?)',
    [req.params.code]
  );
  res.json({ ...order, items });
}));

/* ---------------- admin: orders ---------------- */

router.get('/admin/orders', auth, adminOnly, asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status) { where.push('status = ?'); params.push(req.query.status); }
  if (req.query.search) {
    where.push('(order_code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)');
    const q = `%${req.query.search}%`;
    params.push(q, q, q);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(Number(req.query.limit) || 50, 300);

  const rows = await query(
    `SELECT o.*, (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count
     FROM orders o ${clause} ORDER BY o.created_at DESC LIMIT ${limit}`,
    params
  );
  const total = await one(`SELECT COUNT(*) AS c FROM orders ${clause}`, params);
  res.json({ data: rows, total: total.c });
}));

router.get('/admin/orders/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const order = await one('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const items = await query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.json({ ...order, items });
}));

router.put('/admin/orders/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { status, payment_status, admin_note } = req.body;
  await query(
    `UPDATE orders SET status = COALESCE(?, status),
       payment_status = COALESCE(?, payment_status),
       admin_note = COALESCE(?, admin_note)
     WHERE id = ?`,
    [status || null, payment_status || null, admin_note || null, req.params.id]
  );
  await logActivity(req, 'update_order', 'orders', req.params.id, status);
  res.json(await one('SELECT * FROM orders WHERE id = ?', [req.params.id]));
}));

router.delete('/admin/orders/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM orders WHERE id = ?', [req.params.id]);
  await logActivity(req, 'delete', 'orders', req.params.id);
  res.json({ message: 'Order deleted' });
}));

/* ---------------- admin: products ---------------- */

router.get('/admin/products', auth, adminOnly, asyncHandler(async (req, res) => {
  const rows = await query(`SELECT ${SELECT} ${JOINS} ORDER BY p.sort_order ASC, p.id DESC LIMIT 500`);
  res.json({ data: rows, total: rows.length });
}));

router.post('/products', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.name) return res.status(400).json({ message: 'Product name is required' });
  data.slug = data.slug || makeSlug(`${data.name}-${Date.now().toString(36)}`);
  if (data.sale_price === '' ) data.sale_price = null;
  const keys = Object.keys(data);
  const r = await query(
    `INSERT INTO products (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    Object.values(data)
  );
  await logActivity(req, 'create', 'products', r.insertId, data.name);
  res.status(201).json({ id: r.insertId, ...data });
}));

router.put('/products/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (data.sale_price === '') data.sale_price = null;
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ message: 'No data supplied' });
  await query(
    `UPDATE products SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), req.params.id]
  );
  await logActivity(req, 'update', 'products', req.params.id);
  res.json(await one('SELECT * FROM products WHERE id = ?', [req.params.id]));
}));

router.delete('/products/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM products WHERE id = ?', [req.params.id]);
  await logActivity(req, 'delete', 'products', req.params.id);
  res.json({ message: 'Product deleted' });
}));

/* ---------------- admin: product categories & brands ---------------- */

router.get('/admin/categories', auth, adminOnly, asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM product_categories ORDER BY sort_order ASC'));
}));

router.post('/categories', auth, adminOnly, asyncHandler(async (req, res) => {
  const { name, name_bn, description, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const r = await query(
    'INSERT INTO product_categories (name, name_bn, slug, description, sort_order) VALUES (?,?,?,?,?)',
    [name, name_bn || null, makeSlug(name), description || null, sort_order]
  );
  res.status(201).json({ id: r.insertId, name });
}));

router.delete('/categories/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM product_categories WHERE id = ?', [req.params.id]);
  res.json({ message: 'Category deleted' });
}));

router.get('/admin/brands', auth, adminOnly, asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM brands ORDER BY sort_order ASC'));
}));

router.post('/brands', auth, adminOnly, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const r = await query('INSERT INTO brands (name, slug) VALUES (?,?)', [name, makeSlug(name)]);
  res.status(201).json({ id: r.insertId, name });
}));

router.delete('/brands/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM brands WHERE id = ?', [req.params.id]);
  res.json({ message: 'Brand deleted' });
}));

module.exports = router;
