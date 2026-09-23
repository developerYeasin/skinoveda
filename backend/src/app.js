require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { notFound, errorHandler } = require('./middleware/error');
const misc = require('./routes/misc');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
const allowed = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  credentials: true,
  origin(origin, cb) {
    // server-to-server / curl requests have no origin
    if (!origin) return cb(null, true);
    // in development Vite may fall back to another port, so allow any localhost
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    if (!allowed.length || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`Origin not allowed by CORS: ${origin}`));
  },
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '7d' }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'skinoveda-api', time: new Date().toISOString() })
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/media', require('./routes/media'));
app.use('/api/team', misc.team);
app.use('/api/gallery', misc.gallery);
app.use('/api/testimonials', misc.testimonials);
app.use('/api/blogs', misc.blogs);
app.use('/api/contact', misc.contact);
app.use('/api/subscribers', misc.subscribers);
app.use('/api/upload', misc.uploads);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
