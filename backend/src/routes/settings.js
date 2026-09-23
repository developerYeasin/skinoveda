const express = require('express');
const { query } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const toObject = (rows) => rows.reduce((acc, r) => ({ ...acc, [r.setting_key]: r.setting_value }), {});

/** Public: everything the storefront needs, including tracking ids. */
router.get('/public', asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT setting_key, setting_value FROM settings WHERE setting_group IN ('general','contact','social','tracking','seo')"
  );
  res.json(toObject(rows));
}));

/** Public: tracking ids only (used by the pixel/GTM loader). */
router.get('/tracking', asyncHandler(async (req, res) => {
  const rows = await query("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'tracking'");
  res.json(toObject(rows));
}));

router.get('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM settings ORDER BY setting_group, setting_key');
  const grouped = rows.reduce((acc, r) => {
    (acc[r.setting_group] = acc[r.setting_group] || {})[r.setting_key] = r.setting_value;
    return acc;
  }, {});
  res.json({ flat: toObject(rows), grouped });
}));

/** Bulk upsert: { settings: { key: value }, group: 'tracking' } */
router.put('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const payload = req.body.settings || req.body;
  const group = req.body.group || 'general';
  const entries = Object.entries(payload).filter(([k]) => k !== 'settings' && k !== 'group');
  if (!entries.length) return res.status(400).json({ message: 'No settings supplied' });

  for (const [key, value] of entries) {
    await query(
      `INSERT INTO settings (setting_key, setting_value, setting_group) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [String(key).slice(0, 100), value === null || value === undefined ? '' : String(value), group]
    );
  }
  await logActivity(req, 'update_settings', 'settings', group, entries.map(([k]) => k).join(','));
  res.json({ message: 'Settings saved', updated: entries.length });
}));

router.delete('/:key', auth, adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM settings WHERE setting_key = ?', [req.params.key]);
  res.json({ message: 'Setting removed' });
}));

module.exports = router;
