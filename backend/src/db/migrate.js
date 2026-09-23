require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function splitStatements(sql) {
  return sql
    .split(/;\s*[\r\n]/)
    .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);
}

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = splitStatements(sql);

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      const name = (stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i) || [])[1];
      if (name) console.log(`  ok  table: ${name}`);
    } catch (e) {
      console.error(`  !!  ${e.message}`);
    }
  }

  console.log('\nMigration finished.');
  await conn.end();
}

if (require.main === module) {
  migrate().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = migrate;
