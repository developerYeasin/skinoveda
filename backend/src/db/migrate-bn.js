/**
 * Adds the Bangla content columns so the admin can enter both languages.
 * Safe to run repeatedly — existing columns are skipped.
 */
require('dotenv').config();
const { pool, query } = require('../config/db');

const COLUMNS = [
  ['categories', 'name_bn', 'VARCHAR(200)'],
  ['categories', 'tagline_bn', 'VARCHAR(300)'],
  ['categories', 'description_bn', 'TEXT'],

  ['service_groups', 'name_bn', 'VARCHAR(200)'],

  ['services', 'name_bn', 'VARCHAR(250)'],
  ['services', 'short_description_bn', 'VARCHAR(500)'],
  ['services', 'description_bn', 'TEXT'],
  ['services', 'benefits_bn', 'TEXT'],

  ['team_members', 'name_bn', 'VARCHAR(200)'],
  ['team_members', 'designation_bn', 'VARCHAR(250)'],
  ['team_members', 'bio_bn', 'TEXT'],

  ['blogs', 'title_bn', 'VARCHAR(300)'],
  ['blogs', 'excerpt_bn', 'VARCHAR(600)'],
  ['blogs', 'content_bn', 'LONGTEXT'],
];

async function run() {
  const existing = await query(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?`,
    [process.env.DB_NAME]
  );
  const have = new Set(existing.map((r) => `${r.t}.${r.c}`));

  let added = 0;
  for (const [table, column, type] of COLUMNS) {
    if (have.has(`${table}.${column}`)) {
      console.log(`  skip  ${table}.${column}`);
      continue;
    }
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type} NULL`);
    console.log(`  add   ${table}.${column}`);
    added++;
  }

  console.log(`\nBangla columns ready (${added} added).`);
  await pool.end();
}

run().catch(async (e) => {
  console.error(e.message);
  try { await pool.end(); } catch {}
  process.exit(1);
});
