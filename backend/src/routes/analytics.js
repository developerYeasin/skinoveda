const express = require('express');
const UAParser = require('ua-parser-js');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const { clientIp } = require('../utils/activity');

const router = express.Router();

/* ============ COLLECTION (public) ============ */

router.post('/track', asyncHandler(async (req, res) => {
  const enabled = await one("SELECT setting_value v FROM settings WHERE setting_key = 'internal_analytics_enabled'");
  if (enabled && enabled.v === '0') return res.json({ ok: false, disabled: true });

  const {
    visitor_id, session_id, path, page_title, referrer,
    utm_source, utm_medium, utm_campaign, is_new_visitor,
  } = req.body;
  if (!visitor_id || !session_id || !path) return res.status(400).json({ message: 'visitor_id, session_id and path are required' });

  const ua = new UAParser(req.headers['user-agent'] || '').getResult();
  const device = ua.device.type || 'desktop';

  const r = await query(
    `INSERT INTO page_views
      (visitor_id, session_id, path, page_title, referrer, utm_source, utm_medium, utm_campaign, device, browser, os, ip, is_new_visitor)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(visitor_id).slice(0, 64), String(session_id).slice(0, 64), String(path).slice(0, 400),
      (page_title || '').slice(0, 250), (referrer || '').slice(0, 500),
      utm_source || null, utm_medium || null, utm_campaign || null,
      device, ua.browser.name || null, ua.os.name || null, clientIp(req), is_new_visitor ? 1 : 0,
    ]
  );
  res.json({ ok: true, view_id: r.insertId });
}));

/** Update time-on-page when the visitor leaves */
router.post('/duration', asyncHandler(async (req, res) => {
  const { view_id, duration } = req.body;
  if (view_id) await query('UPDATE page_views SET duration = ? WHERE id = ?', [Math.min(Number(duration) || 0, 7200), view_id]);
  res.json({ ok: true });
}));

router.post('/event', asyncHandler(async (req, res) => {
  const { visitor_id, session_id, event_name, event_category, label, value, path, meta } = req.body;
  if (!event_name) return res.status(400).json({ message: 'event_name is required' });
  await query(
    'INSERT INTO analytics_events (visitor_id, session_id, event_name, event_category, label, value, path, meta) VALUES (?,?,?,?,?,?,?,?)',
    [
      visitor_id || null, session_id || null, String(event_name).slice(0, 120),
      event_category || null, (label || '').slice(0, 250), value ?? null,
      (path || '').slice(0, 400), meta ? JSON.stringify(meta).slice(0, 2000) : null,
    ]
  );
  res.json({ ok: true });
}));

/* ============ REPORTING (admin) ============ */

function rangeClause(req, col = 'created_at') {
  const days = Math.min(Number(req.query.days) || 30, 365);
  if (req.query.from && req.query.to) {
    return { clause: `DATE(${col}) BETWEEN ? AND ?`, params: [req.query.from, req.query.to], days };
  }
  return { clause: `${col} >= DATE_SUB(NOW(), INTERVAL ? DAY)`, params: [days], days };
}

router.get('/overview', auth, adminOnly, asyncHandler(async (req, res) => {
  const { clause, params, days } = rangeClause(req);

  const totals = await one(
    `SELECT COUNT(*) AS page_views,
            COUNT(DISTINCT visitor_id) AS visitors,
            COUNT(DISTINCT session_id) AS sessions,
            ROUND(AVG(duration)) AS avg_duration,
            SUM(is_new_visitor) AS new_visitors
     FROM page_views WHERE ${clause}`,
    params
  );

  const prevParams = req.query.from && req.query.to ? params : [days * 2, days];
  const prevClause = req.query.from && req.query.to
    ? clause
    : 'created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
  const previous = await one(
    `SELECT COUNT(*) AS page_views, COUNT(DISTINCT visitor_id) AS visitors FROM page_views WHERE ${prevClause}`,
    prevParams
  );

  const bounce = await one(
    `SELECT ROUND(100 * SUM(single) / NULLIF(COUNT(*),0), 1) AS bounce_rate FROM (
       SELECT session_id, IF(COUNT(*) = 1, 1, 0) AS single
       FROM page_views WHERE ${clause} GROUP BY session_id
     ) t`,
    params
  );

  const daily = await query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors,
            COUNT(DISTINCT session_id) AS sessions
     FROM page_views WHERE ${clause} GROUP BY DATE(created_at) ORDER BY date ASC`,
    params
  );

  const topPages = await query(
    `SELECT path, MAX(page_title) AS title, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors,
            ROUND(AVG(duration)) AS avg_duration
     FROM page_views WHERE ${clause} GROUP BY path ORDER BY views DESC LIMIT 15`,
    params
  );

  const devices = await query(
    `SELECT COALESCE(device,'unknown') AS name, COUNT(*) AS value FROM page_views WHERE ${clause} GROUP BY device ORDER BY value DESC`,
    params
  );
  const browsers = await query(
    `SELECT COALESCE(browser,'unknown') AS name, COUNT(*) AS value FROM page_views WHERE ${clause} GROUP BY browser ORDER BY value DESC LIMIT 8`,
    params
  );
  const os = await query(
    `SELECT COALESCE(os,'unknown') AS name, COUNT(*) AS value FROM page_views WHERE ${clause} GROUP BY os ORDER BY value DESC LIMIT 8`,
    params
  );

  const referrers = await query(
    `SELECT CASE
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%facebook%' THEN 'Facebook'
        WHEN referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
        WHEN referrer LIKE '%youtube%' THEN 'YouTube'
        ELSE 'Other'
      END AS name, COUNT(*) AS value
     FROM page_views WHERE ${clause} GROUP BY name ORDER BY value DESC`,
    params
  );

  const campaigns = await query(
    `SELECT utm_source AS source, utm_medium AS medium, utm_campaign AS campaign,
            COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
     FROM page_views WHERE ${clause} AND utm_source IS NOT NULL
     GROUP BY utm_source, utm_medium, utm_campaign ORDER BY views DESC LIMIT 10`,
    params
  );

  const hourly = await query(
    `SELECT HOUR(created_at) AS hour, COUNT(*) AS views FROM page_views WHERE ${clause} GROUP BY HOUR(created_at) ORDER BY hour ASC`,
    params
  );

  const events = await query(
    `SELECT event_name, COUNT(*) AS count FROM analytics_events WHERE ${clause} GROUP BY event_name ORDER BY count DESC LIMIT 15`,
    params
  );

  const pct = (now, before) => (before > 0 ? Number((((now - before) / before) * 100).toFixed(1)) : null);

  res.json({
    range: { days, from: req.query.from || null, to: req.query.to || null },
    totals: {
      ...totals,
      bounce_rate: bounce?.bounce_rate ?? 0,
      views_change: pct(totals.page_views, previous.page_views),
      visitors_change: pct(totals.visitors, previous.visitors),
    },
    daily, topPages, devices, browsers, os, referrers, campaigns, hourly, events,
  });
}));

/** Who is on the site right now (last 5 minutes) */
router.get('/realtime', auth, adminOnly, asyncHandler(async (req, res) => {
  const active = await one(
    'SELECT COUNT(DISTINCT visitor_id) AS active_visitors FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
  );
  const pages = await query(
    `SELECT path, MAX(page_title) AS title, COUNT(*) AS views
     FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
     GROUP BY path ORDER BY views DESC LIMIT 10`
  );
  const recent = await query(
    `SELECT path, page_title, device, browser, country, referrer, created_at
     FROM page_views ORDER BY id DESC LIMIT 20`
  );
  const perMinute = await query(
    `SELECT DATE_FORMAT(created_at, '%H:%i') AS minute, COUNT(*) AS views
     FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
     GROUP BY minute ORDER BY minute ASC`
  );
  res.json({ active_visitors: active.active_visitors, pages, recent, perMinute });
}));

router.get('/events', auth, adminOnly, asyncHandler(async (req, res) => {
  const { clause, params } = rangeClause(req);
  const rows = await query(
    `SELECT * FROM analytics_events WHERE ${clause} ORDER BY id DESC LIMIT 200`,
    params
  );
  res.json(rows);
}));

router.delete('/purge', auth, adminOnly, asyncHandler(async (req, res) => {
  const days = Math.max(Number(req.query.older_than_days) || 365, 30);
  await query('DELETE FROM page_views WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [days]);
  await query('DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [days]);
  res.json({ message: `Analytics older than ${days} days removed` });
}));

module.exports = router;
