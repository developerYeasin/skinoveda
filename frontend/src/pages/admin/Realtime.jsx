import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsApi } from '../../api/endpoints';
import { Panel } from '../../components/admin-ui';

export default function Realtime() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => analyticsApi.realtime().then(setData).catch((e) => setError(e.response?.data?.message || 'Could not load realtime data'));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="skeleton" style={{ height: 200 }} />;

  return (
    <>
      <div className="panel mb-24" style={{ background: 'var(--grad-hero)', color: '#fff', border: 0 }}>
        <div className="panel-body text-center" style={{ padding: 40 }}>
          <div style={{ fontSize: '.8rem', letterSpacing: '.2em', textTransform: 'uppercase', opacity: .8 }}>
            <span className="live-dot" />Active visitors right now
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 600, lineHeight: 1.1 }}>
            {data.active_visitors}
          </div>
          <p style={{ opacity: .75, marginBottom: 0 }}>Updated every 10 seconds · last 5 minutes window</p>
        </div>
      </div>

      <Panel title="Page Views — last 30 minutes">
        <div className="chart-box sm">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.perMinute}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE6F2" vertical={false} />
              <XAxis dataKey="minute" tick={{ fontSize: 10 }} stroke="#B9A9C0" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#B9A9C0" />
              <Tooltip />
              <Bar dataKey="views" fill="#C79A4B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="admin-grid-2 mt-24">
        <Panel title="Active Pages (last 30 min)" tight>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Page</th><th>Views</th></tr></thead>
              <tbody>
                {data.pages.map((p) => (
                  <tr key={p.path}>
                    <td><strong style={{ fontSize: '.86rem' }}>{p.title || p.path}</strong><br /><small className="muted">{p.path}</small></td>
                    <td><strong>{p.views}</strong></td>
                  </tr>
                ))}
                {data.pages.length === 0 && <tr><td colSpan={2} className="text-center muted" style={{ padding: 30 }}>No activity in the last 30 minutes</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Live Visitor Feed" tight>
          <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table className="data">
              <thead><tr><th>Time</th><th>Page</th><th>Device</th><th>Source</th></tr></thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '.8rem' }}>
                      {new Date(r.created_at).toLocaleTimeString('en-GB')}
                    </td>
                    <td style={{ fontSize: '.82rem' }}>{r.path}</td>
                    <td><span className="badge badge-gray">{r.device || '—'}</span></td>
                    <td style={{ fontSize: '.8rem' }} className="muted">
                      {r.referrer ? new URL(r.referrer).hostname.replace('www.', '') : 'Direct'}
                    </td>
                  </tr>
                ))}
                {data.recent.length === 0 && <tr><td colSpan={4} className="text-center muted" style={{ padding: 30 }}>No visits recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
