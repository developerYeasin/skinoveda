/**
 * Stock photo search + import.
 *
 * Lets an admin search Pexels from inside the panel and save a photo straight
 * into /uploads, so image slots can be filled without leaving the dashboard.
 * The API key is stored in settings (group: media) and set in Site Settings.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const getKey = async () => {
  const row = await one("SELECT setting_value v FROM settings WHERE setting_key = 'pexels_api_key'");
  return (row?.v || process.env.PEXELS_API_KEY || '').trim();
};

/** GET /api/media/stock/search?q=facial&page=1 */
router.get('/stock/search', auth, adminOnly, asyncHandler(async (req, res) => {
  const key = await getKey();
  if (!key) {
    return res.status(400).json({
      message: 'No Pexels API key configured. Add one in Site Settings → Media (free at pexels.com/api).',
      needsKey: true,
    });
  }

  const q = (req.query.q || 'skincare spa').slice(0, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const perPage = Math.min(Number(req.query.per_page) || 24, 40);
  const orientation = ['landscape', 'portrait', 'square'].includes(req.query.orientation)
    ? `&orientation=${req.query.orientation}`
    : '';

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}${orientation}`;
  const r = await fetch(url, { headers: { Authorization: key } });

  if (!r.ok) {
    const detail = r.status === 401 ? 'The Pexels API key was rejected.' : `Pexels returned ${r.status}.`;
    return res.status(502).json({ message: detail });
  }

  const data = await r.json();
  res.json({
    total: data.total_results,
    page: data.page,
    photos: (data.photos || []).map((p) => ({
      id: p.id,
      thumb: p.src?.medium,
      preview: p.src?.large,
      full: p.src?.large2x || p.src?.large,
      width: p.width,
      height: p.height,
      photographer: p.photographer,
      photographer_url: p.photographer_url,
      alt: p.alt,
    })),
  });
}));

/** POST /api/media/stock/import  { url, filename } — downloads into /uploads */
router.post('/stock/import', auth, adminOnly, asyncHandler(async (req, res) => {
  const { url, filename } = req.body;
  if (!url) return res.status(400).json({ message: 'An image url is required' });

  // only accept the Pexels image CDN, so this cannot be used to fetch arbitrary hosts
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ message: 'Invalid url' }); }
  if (parsed.hostname !== 'images.pexels.com') {
    return res.status(400).json({ message: 'Only images.pexels.com urls can be imported' });
  }

  const r = await fetch(url);
  if (!r.ok) return res.status(502).json({ message: `Could not download the image (${r.status})` });

  const type = r.headers.get('content-type') || '';
  if (!type.startsWith('image/')) return res.status(400).json({ message: 'That url is not an image' });

  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ message: 'Image is larger than 8MB' });

  const safe = String(filename || 'stock')
    .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'stock';
  const ext = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : '.jpg';
  const name = `${safe}-${Date.now().toString(36)}${ext}`;

  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  await logActivity(req, 'import_stock_photo', 'media', name);

  res.status(201).json({ url: `/uploads/${name}`, filename: name, size: buf.length });
}));

/** GET /api/media/library — everything already in /uploads */
router.get('/library', auth, adminOnly, asyncHandler(async (req, res) => {
  const walk = (dir, prefix = '') =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      if (e.isDirectory()) return walk(path.join(dir, e.name), `${prefix}${e.name}/`);
      if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(e.name)) return [];
      const stat = fs.statSync(path.join(dir, e.name));
      return [{ url: `/uploads/${prefix}${e.name}`, name: e.name, size: stat.size, modified: stat.mtime }];
    });

  const files = fs.existsSync(UPLOAD_DIR) ? walk(UPLOAD_DIR) : [];
  files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  res.json({ files, total: files.length });
}));

module.exports = router;
