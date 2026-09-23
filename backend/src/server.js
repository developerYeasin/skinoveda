require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = Number(process.env.PORT || 5000);

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log(`Database connected: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  } catch (e) {
    console.error(`Database connection failed: ${e.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Skinoveda API running on http://localhost:${PORT}`);
  });
})();

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
