const { query } = require('../config/db');

function clientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    ''
  ).slice(0, 60);
}

async function logActivity(req, action, entity, entityId, detail = null) {
  try {
    await query(
      'INSERT INTO activity_logs (user_id, action, entity, entity_id, detail, ip) VALUES (?,?,?,?,?,?)',
      [req.user?.id || null, action, entity, String(entityId ?? ''), detail, clientIp(req)]
    );
  } catch (e) {
    console.error('[activity]', e.message);
  }
}

module.exports = { logActivity, clientIp };
