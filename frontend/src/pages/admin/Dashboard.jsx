import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { dashboardApi } from '../../api/endpoints';
import { Stat, Panel, StatusBadge } from '../../components/admin-ui';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.stats().then(setData).catch((e) => setError(e.response?.data?.message || 'Could not load dashboard'));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="stat-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 118 }} />)}</div>;

  const { counts, appointments, today, active_now, appointmentTrend, topServices, categoryBreakdown, recentAppointments, recentMessages, recentActivity } = data;

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Visitors Today" value={today.visitors_today} icon="👥" />
        <Stat label="Page Views Today" value={today.views_today} icon="📊" />
        <Stat label="Active Right Now" value={active_now} icon="⚡" />
        <Stat label="Bookings Today" value={today.appointments_today} icon="📅" />
      </div>

      <div className="stat-grid mb-24">
        <Stat label="Pending Bookings" value={appointments.pending || 0} icon="⏳" />
        <Stat label="Confirmed" value={appointments.confirmed || 0} icon="✓" />
        <Stat label="Completed" value={appointments.completed || 0} icon="🎉" />
        <Stat label="Unread Messages" value={counts.unread_messages} icon="✉" />
      </div>

      <div className="admin-grid-2 mb-24">
        <Panel title="Appointment Requests — last 30 days">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appointmentTrend}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8A3BA3" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8A3BA3" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE6F2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
                <Tooltip labelFormatter={fmtDate} />
                <Area type="monotone" dataKey="count" name="Requests" stroke="#6F2385" strokeWidth={2} fill="url(#gA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Bookings by Speciality">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE6F2" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} stroke="#B9A9C0" />
                <Tooltip />
                <Bar dataKey="bookings" radius={[0, 6, 6, 0]}>
                  {categoryBreakdown.map((c) => <Cell key={c.name} fill={c.color || '#6F2385'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="admin-grid-2 mb-24">
        <Panel
          title="Recent Appointment Requests"
          action={<Link to="/admin/appointments" className="btn btn-outline btn-sm">View All</Link>}
          tight
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Code</th><th>Client</th><th>Treatment</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentAppointments.map((a) => (
                  <tr key={a.id}>
                    <td><code style={{ fontSize: '.78rem' }}>{a.booking_code}</code></td>
                    <td><strong>{a.name}</strong><br /><small className="muted">{a.phone}</small></td>
                    <td>{a.service_name || '—'}</td>
                    <td>{a.preferred_date ? fmtDate(a.preferred_date) : '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
                {recentAppointments.length === 0 && (
                  <tr><td colSpan={5} className="text-center muted" style={{ padding: 30 }}>No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Most Requested Treatments">
          {topServices.slice(0, 8).map((s) => {
            const max = Math.max(...topServices.map((x) => x.bookings || 0), 1);
            return (
              <div className="bar-row" key={s.name}>
                <div className="top">
                  <span>{s.name}</span>
                  <strong>{s.bookings}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${((s.bookings || 0) / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <div className="admin-grid-3">
        <Panel title="Content Summary">
          <ul className="legend-list">
            <li><span className="dot" style={{ background: '#6F2385' }} />Categories <span className="val">{counts.categories}</span></li>
            <li><span className="dot" style={{ background: '#8A3BA3' }} />Services <span className="val">{counts.services}</span></li>
            <li><span className="dot" style={{ background: '#A863BD' }} />Team members <span className="val">{counts.team}</span></li>
            <li><span className="dot" style={{ background: '#C79A4B' }} />Blog posts <span className="val">{counts.blogs}</span></li>
            <li><span className="dot" style={{ background: '#E0BC72' }} />Gallery photos <span className="val">{counts.gallery}</span></li>
            <li><span className="dot" style={{ background: '#4E7A46' }} />Testimonials <span className="val">{counts.testimonials}</span></li>
            <li><span className="dot" style={{ background: '#2F6690' }} />Subscribers <span className="val">{counts.subscribers}</span></li>
          </ul>
        </Panel>

        <Panel title="Latest Messages" action={<Link to="/admin/messages" className="btn btn-outline btn-sm">All</Link>}>
          {recentMessages.map((m) => (
            <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="flex justify-between gap-8">
                <strong style={{ fontSize: '.9rem' }}>{m.name}</strong>
                {!m.is_read && <span className="badge badge-amber">new</span>}
              </div>
              <div className="muted" style={{ fontSize: '.82rem' }}>{m.subject}</div>
            </div>
          ))}
          {recentMessages.length === 0 && <p className="muted text-center">No messages yet</p>}
        </Panel>

        <Panel title="Recent Admin Activity">
          {recentActivity.map((l) => (
            <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '.84rem' }}>
              <strong>{l.user_name || 'System'}</strong> <span className="muted">{l.action.replace(/_/g, ' ')}</span>{' '}
              {l.entity && <span className="badge badge-gray">{l.entity}</span>}
              <div className="muted" style={{ fontSize: '.74rem' }}>
                {new Date(l.created_at).toLocaleString('en-GB')}
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && <p className="muted text-center">No activity logged</p>}
        </Panel>
      </div>
    </>
  );
}
