const slugify = require('slugify');

const makeSlug = (text) => slugify(String(text || ''), { lower: true, strict: true });

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

function buildUpdate(table, data, idField = 'id') {
  const keys = Object.keys(data);
  const set = keys.map((k) => `\`${k}\` = ?`).join(', ');
  return { sql: `UPDATE \`${table}\` SET ${set} WHERE \`${idField}\` = ?`, values: Object.values(data) };
}

module.exports = { makeSlug, asyncHandler, pick, buildUpdate };
