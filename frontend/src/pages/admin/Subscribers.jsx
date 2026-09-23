import { useEffect, useState } from 'react';
import { subscriberApi } from '../../api/endpoints';
import { Panel, Confirm, Toast, useToast, Stat } from '../../components/admin-ui';

export default function Subscribers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState('');
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    subscriberApi.list()
      .then((r) => setRows(r.data || []))
      .catch(() => show('Could not load subscribers', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async () => {
    try { await subscriberApi.remove(confirmDel.id); show('Subscriber removed'); setConfirmDel(null); load(); }
    catch { show('Could not remove', 'error'); }
  };

  const exportCsv = () => {
    const csv = ['email,subscribed_at', ...rows.map((r) => `${r.email},${r.created_at}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `skinoveda-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rows.filter((r) => r.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Total Subscribers" value={rows.length} icon="📧" />
        <Stat label="Active" value={rows.filter((r) => r.is_active).length} icon="✓" />
        <Stat
          label="Joined This Month"
          value={rows.filter((r) => new Date(r.created_at).getMonth() === new Date().getMonth()).length}
          icon="📈"
        />
      </div>

      <div className="toolbar">
        <input placeholder="Search email…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
        <div className="spacer" />
        <button className="btn btn-purple btn-sm" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Email</th><th>Subscribed</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={4} className="text-center muted" style={{ padding: 40 }}>No subscribers yet</td></tr>}
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.email}</strong></td>
                  <td className="muted" style={{ fontSize: '.84rem' }}>{new Date(s.created_at).toLocaleString('en-GB')}</td>
                  <td><span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'active' : 'unsubscribed'}</span></td>
                  <td><button className="icon-btn danger" onClick={() => setConfirmDel(s)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {confirmDel && <Confirm text={`Remove ${confirmDel.email} from the mailing list?`} onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
