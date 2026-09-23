import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/endpoints';

const NAV = [
  ['Overview', [
    ['/admin/dashboard', '▤', 'Dashboard'],
    ['/admin/analytics', '📈', 'Analytics'],
    ['/admin/realtime', '⚡', 'Realtime'],
  ]],
  ['Bookings', [
    ['/admin/appointments', '📅', 'Appointments', 'pending'],
    ['/admin/messages', '✉', 'Messages', 'unread'],
    ['/admin/subscribers', '📧', 'Subscribers'],
  ]],
  ['Content', [
    ['/admin/categories', '🗂', 'Categories'],
    ['/admin/services', '✦', 'Services'],
    ['/admin/team', '👩‍⚕️', 'Team'],
    ['/admin/gallery', '🖼', 'Gallery'],
    ['/admin/media', '📁', 'Media Library'],
    ['/admin/blogs', '📖', 'Blog'],
    ['/admin/testimonials', '★', 'Testimonials'],
  ]],
  ['Configuration', [
    ['/admin/tracking', '🎯', 'Pixel & Tracking'],
    ['/admin/settings', '⚙', 'Site Settings'],
  ]],
];

const TITLES = {
  '/admin/dashboard': ['Dashboard', 'Everything happening at Skinoveda right now'],
  '/admin/analytics': ['Analytics', 'Visitor traffic, sources, devices and events'],
  '/admin/realtime': ['Realtime', 'Who is on the site in the last few minutes'],
  '/admin/appointments': ['Appointments', 'Manage booking requests and confirmations'],
  '/admin/messages': ['Messages', 'Enquiries from the contact form'],
  '/admin/subscribers': ['Subscribers', 'Newsletter mailing list'],
  '/admin/categories': ['Categories', 'The seven service specialities'],
  '/admin/services': ['Services', 'Full treatment catalogue'],
  '/admin/team': ['Team', 'Doctors and specialists'],
  '/admin/gallery': ['Gallery', 'Clinic, treatment and result photos'],
  '/admin/media': ['Media Library', 'Upload photos or pull them from Pexels'],
  '/admin/blogs': ['Blog', 'Wellness journal articles'],
  '/admin/testimonials': ['Testimonials', 'Client reviews shown on the site'],
  '/admin/tracking': ['Pixel & Tracking', 'GTM, GA4, Meta Pixel, TikTok and more'],
  '/admin/settings': ['Site Settings', 'Contact details, social links and SEO'],
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState({ pending: 0, unread: 0 });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const load = () => dashboardApi.stats()
      .then((s) => setBadges({ pending: s.appointments?.pending || 0, unread: s.counts?.unread_messages || 0 }))
      .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const [title, sub] = TITLES[pathname] || ['Admin', ''];

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="" style={{ width: 36 }} />
          <span className="brand-text">
            <strong>Skinoveda</strong>
            <span>Admin Panel</span>
          </span>
        </Link>

        <nav className="admin-nav">
          {NAV.map(([group, items]) => (
            <div key={group}>
              <div className="group-label">{group}</div>
              {items.map(([to, ico, label, badgeKey]) => (
                <NavLink key={to} to={to}>
                  <span className="ico">{ico}</span>
                  <span>{label}</span>
                  {badgeKey && badges[badgeKey] > 0 && <span className="count">{badges[badgeKey]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Link to="/" target="_blank" className="btn btn-outline-light btn-sm btn-block">View Website ↗</Link>
        </div>
      </aside>

      {open && <div className="modal-backdrop" style={{ zIndex: 290 }} onClick={() => setOpen(false)} />}

      <div className="admin-main">
        <header className="admin-top">
          <div className="flex items-center gap-12">
            <button className="mobile-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">☰</button>
            <div>
              <h1>{title}</h1>
              {sub && <div className="sub">{sub}</div>}
            </div>
          </div>
          <div className="admin-user">
            <div style={{ textAlign: 'right' }} className="hide-mobile">
              <div style={{ fontSize: '.88rem', fontWeight: 500 }}>{user?.name}</div>
              <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{user?.role}</div>
            </div>
            <div className="admin-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="admin-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
