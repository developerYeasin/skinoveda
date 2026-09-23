import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { analyticsApi } from '../../api/endpoints';
import { Stat, Panel } from '../../components/admin-ui';

const COLORS = ['#6F2385', '#8A3BA3', '#A863BD', '#C79A4B', '#E0BC72', '#4E7A46', '#2F6690', '#C2649A'];
const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last year']];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtDuration = (s) => (!s ? '0s' : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    analyticsApi.overview({ days })
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'Could not load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (loading || !data) {
    return <div className="stat-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 118 }} />)}</div>;
  }

  const { totals, daily, topPages, devices, browsers, os, referrers, campaigns, hourly, events } = data;
  const hourlyFull = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    views: hourly.find((x) => x.hour === h)?.views || 0,
  }));

  return (
    <>
      <div className="toolbar">
        {RANGES.map(([d, label]) => (
          <button key={d} className={`chip ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>{label}</button>
        ))}
        <div className="spacer" />
        <span className="muted" style={{ fontSize: '.84rem' }}>First-party analytics · no cookies shared</span>
      </div>

      <div className="stat-grid mb-24">
        <Stat label="Page Views" value={Number(totals.page_views).toLocaleString()} icon="📊" delta={totals.views_change} />
        <Stat label="Unique Visitors" value={Number(totals.visitors).toLocaleString()} icon="👥" delta={totals.visitors_change} />
        <Stat label="Sessions" value={Number(totals.sessions).toLocaleString()} icon="🔄" />
        <Stat label="New Visitors" value={Number(totals.new_visitors || 0).toLocaleString()} icon="✨" />
        <Stat label="Avg. Time on Page" value={fmtDuration(totals.avg_duration)} icon="⏱" />
        <Stat label="Bounce Rate" value={totals.bounce_rate} suffix="%" icon="↩" />
      </div>

      <Panel title="Traffic Over Time" >
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8A3BA3" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#8A3BA3" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C79A4B" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#C79A4B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE6F2" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
              <Tooltip labelFormatter={fmtDate} />
              <Legend />
              <Area type="monotone" dataKey="views" name="Page views" stroke="#6F2385" strokeWidth={2} fill="url(#gV)" />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#C79A4B" strokeWidth={2} fill="url(#gU)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="admin-grid-2 mt-24">
        <Panel title="Top Pages" tight>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th>Avg. time</th></tr></thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.path}>
                    <td>
                      <strong style={{ fontSize: '.86rem' }}>{p.title || p.path}</strong>
                      <br /><small className="muted">{p.path}</small>
                    </td>
                    <td>{p.views}</td>
                    <td>{p.visitors}</td>
                    <td>{fmtDuration(p.avg_duration)}</td>
                  </tr>
                ))}
                {topPages.length === 0 && <tr><td colSpan={4} className="text-center muted" style={{ padding: 30 }}>No traffic recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Traffic Sources">
          <div className="chart-box sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={referrers} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {referrers.map((r, i) => <Cell key={r.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="admin-grid-3 mt-24">
        <Panel title="Devices">
          <div className="chart-box sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78}>
                  {devices.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Browsers">
          <ul className="legend-list">
            {browsers.map((b, i) => (
              <li key={b.name}>
                <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
                {b.name}<span className="val">{b.value}</span>
              </li>
            ))}
            {browsers.length === 0 && <li className="muted">No data yet</li>}
          </ul>
        </Panel>

        <Panel title="Operating Systems">
          <ul className="legend-list">
            {os.map((o, i) => (
              <li key={o.name}>
                <span className="dot" style={{ background: COLORS[(i + 3) % COLORS.length] }} />
                {o.name}<span className="val">{o.value}</span>
              </li>
            ))}
            {os.length === 0 && <li className="muted">No data yet</li>}
          </ul>
        </Panel>
      </div>

      <div className="admin-grid-2 mt-24">
        <Panel title="Visits by Hour of Day">
          <div className="chart-box sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyFull}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE6F2" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} stroke="#B9A9C0" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
                <Tooltip />
                <Bar dataKey="views" name="Views" fill="#8A3BA3" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Tracked Events & Conversions" tight>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Event</th><th>Count</th></tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.event_name}>
                    <td>
                      {e.event_name === 'appointment_booked' && <span className="badge badge-green" style={{ marginRight: 8 }}>conversion</span>}
                      {e.event_name.replace(/_/g, ' ')}
                    </td>
                    <td><strong>{e.count}</strong></td>
                  </tr>
                ))}
                {events.length === 0 && <tr><td colSpan={2} className="text-center muted" style={{ padding: 30 }}>No events recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {campaigns.length > 0 && (
        <Panel title="Campaign Performance (UTM)" tight>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Source</th><th>Medium</th><th>Campaign</th><th>Views</th><th>Visitors</th></tr></thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.source}</strong></td>
                    <td>{c.medium || '—'}</td>
                    <td>{c.campaign || '—'}</td>
                    <td>{c.views}</td>
                    <td>{c.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
