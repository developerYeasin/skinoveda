const express = require('express');
const { query, one } = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

router.get('/stats', auth, adminOnly, asyncHandler(async (req, res) => {
  const [counts, appt, today, visitors] = await Promise.all([
    one(`SELECT
      (SELECT COUNT(*) FROM categories WHERE is_active = 1) AS categories,
      (SELECT COUNT(*) FROM services WHERE is_active = 1) AS services,
      (SELECT COUNT(*) FROM team_members WHERE is_active = 1) AS team,
      (SELECT COUNT(*) FROM blogs WHERE status = 'published') AS blogs,
      (SELECT COUNT(*) FROM gallery WHERE is_active = 1) AS gallery,
      (SELECT COUNT(*) FROM testimonials) AS testimonials,
      (SELECT COUNT(*) FROM subscribers WHERE is_active = 1) AS subscribers,
      (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0) AS unread_messages`),
    one(`SELECT
      COUNT(*) AS total,
      SUM(status = 'pending') AS pending,
      SUM(status = 'confirmed') AS confirmed,
      SUM(status = 'completed') AS completed,
      SUM(status = 'cancelled') AS cancelled
      FROM appointments`),
    one(`SELECT
      (SELECT COUNT(*) FROM appointments WHERE DATE(created_at) = CURDATE()) AS appointments_today,
      (SELECT COUNT(*) FROM page_views WHERE DATE(created_at) = CURDATE()) AS views_today,
      (SELECT COUNT(DISTINCT visitor_id) FROM page_views WHERE DATE(created_at) = CURDATE()) AS visitors_today,
      (SELECT COUNT(*) FROM contact_messages WHERE DATE(created_at) = CURDATE()) AS messages_today`),
    one(`SELECT COUNT(DISTINCT visitor_id) AS active_now FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`),
  ]);

  const appointmentTrend = await query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM appointments
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC`
  );

  const topServices = await query(
    `SELECT s.name, s.views, c.name AS category_name,
            (SELECT COUNT(*) FROM appointments a WHERE a.service_id = s.id) AS bookings
     FROM services s JOIN categories c ON c.id = s.category_id
     ORDER BY bookings DESC, s.views DESC LIMIT 10`
  );

  const categoryBreakdown = await query(
    `SELECT c.name, c.icon, c.color, COUNT(a.id) AS bookings
     FROM categories c LEFT JOIN appointments a ON a.category_id = c.id
     GROUP BY c.id ORDER BY bookings DESC`
  );

  const recentAppointments = await query(
    `SELECT a.id, a.booking_code, a.name, a.phone, a.status, a.preferred_date, a.created_at, s.name AS service_name
     FROM appointments a LEFT JOIN services s ON s.id = a.service_id
     ORDER BY a.created_at DESC LIMIT 8`
  );

  const recentMessages = await query(
    'SELECT id, name, email, subject, is_read, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 6'
  );

  const recentActivity = await query(
    `SELECT l.*, u.name AS user_name FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.id DESC LIMIT 12`
  );

  res.json({
    counts, appointments: appt, today, active_now: visitors.active_now,
    appointmentTrend, topServices, categoryBreakdown,
    recentAppointments, recentMessages, recentActivity,
  });
}));

module.exports = router;
