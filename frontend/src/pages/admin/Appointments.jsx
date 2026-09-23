import { useCallback, useEffect, useState } from 'react';
import { appointmentApi, teamApi } from '../../api/endpoints';
import { Panel, Modal, Field, Confirm, Toast, useToast, StatusBadge, Stat } from '../../components/admin-ui';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function Appointments() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', from: '', to: '' });
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const { toast, show, clear } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    appointmentApi.list({ ...params, limit: 200 })
      .then((r) => { setRows(r.data); setTotal(r.total); })
      .catch((e) => show(e.response?.data?.message || 'Could not load appointments', 'error'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => { teamApi.list({ limit: 50 }).then((r) => setDoctors(r.data || [])).catch(() => {}); }, []);

  const save = async () => {
    setBusy(true);
    try {
      await appointmentApi.update(editing.id, {
        status: editing.status,
        admin_note: editing.admin_note,
        preferred_date: editing.preferred_date,
        preferred_time: editing.preferred_time,
        doctor_id: editing.doctor_id || null,
      });
      show('Appointment updated');
      setEditing(null);
      load();
    } catch (e) {
      show(e.response?.data?.message || 'Could not update', 'error');
    } finally { setBusy(false); }
  };

  const quickStatus = async (row, status) => {
    try {
      await appointmentApi.update(row.id, { status });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
      show(`Marked as ${status}`);
    } catch { show('Could not update status', 'error'); }
  };

  const remove = async () => {
    try {
      await appointmentApi.remove(confirmDel.id);
      show('Appointment deleted');
      setConfirmDel(null);
      load();
    } catch { show('Could not delete', 'error'); }
  };

  const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: rows.filter((r) => r.status === s).length }), {});

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Showing" value={total} icon="📅" />
        <Stat label="Pending" value={counts.pending} icon="⏳" />
        <Stat label="Confirmed" value={counts.confirmed} icon="✓" />
        <Stat label="Completed" value={counts.completed} icon="🎉" />
      </div>

      <div className="toolbar">
        <input
          placeholder="Search name, phone, code…"
          value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          style={{ minWidth: 240 }}
        />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} title="From" />
        <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} title="To" />
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ status: '', search: '', from: '', to: '' })}>Clear</button>
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Code</th><th>Client</th><th>Treatment</th><th>Preferred</th>
                <th>Status</th><th>Requested</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>No appointments found</td></tr>
              )}
              {rows.map((a) => (
                <tr key={a.id}>
                  <td><code style={{ fontSize: '.76rem' }}>{a.booking_code}</code></td>
                  <td>
                    <strong>{a.name}</strong><br />
                    <small className="muted">
                      <a href={`tel:${a.phone}`}>{a.phone}</a>{a.email && ` · ${a.email}`}
                    </small>
                  </td>
                  <td style={{ fontSize: '.85rem' }}>
                    {a.service_name || '—'}
                    {a.category_name && <><br /><small className="muted">{a.category_name}</small></>}
                  </td>
                  <td style={{ fontSize: '.84rem' }}>
                    {a.preferred_date ? new Date(a.preferred_date).toLocaleDateString('en-GB') : '—'}
                    {a.preferred_time && <><br /><small className="muted">{a.preferred_time}</small></>}
                  </td>
                  <td>
                    <select
                      value={a.status} onChange={(e) => quickStatus(a, e.target.value)}
                      style={{ padding: '5px 8px', fontSize: '.78rem', border: '1px solid var(--line)', borderRadius: 8 }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '.8rem' }} className="muted">
                    {new Date(a.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" title="View / edit" onClick={() => setEditing({ ...a })}>✎</button>
                      <button className="icon-btn danger" title="Delete" onClick={() => setConfirmDel(a)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <Modal title={`Appointment ${editing.booking_code}`} onClose={() => setEditing(null)} onSubmit={save} busy={busy}>
          <div className="alert alert-info">
            <strong>{editing.name}</strong> · {editing.phone}{editing.email && ` · ${editing.email}`}<br />
            {editing.gender} {editing.age ? `· ${editing.age} years` : ''} · requested {new Date(editing.created_at).toLocaleString('en-GB')}
          </div>

          {editing.message && (
            <Field label="Client's message">
              <p className="muted" style={{ fontSize: '.9rem', background: 'var(--purple-50)', padding: 14, borderRadius: 10 }}>
                {editing.message}
              </p>
            </Field>
          )}

          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Status">
              <select value={editing.status} onChange={(e) => setEditing((x) => ({ ...x, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Assigned specialist">
              <select value={editing.doctor_id || ''} onChange={(e) => setEditing((x) => ({ ...x, doctor_id: e.target.value }))}>
                <option value="">Not assigned</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Confirmed date">
              <input type="date" value={editing.preferred_date || ''} onChange={(e) => setEditing((x) => ({ ...x, preferred_date: e.target.value }))} />
            </Field>
            <Field label="Confirmed time">
              <input value={editing.preferred_time || ''} onChange={(e) => setEditing((x) => ({ ...x, preferred_time: e.target.value }))} />
            </Field>
          </div>

          <Field label="Internal note" hint="Only visible to your team.">
            <textarea value={editing.admin_note || ''} onChange={(e) => setEditing((x) => ({ ...x, admin_note: e.target.value }))} />
          </Field>
        </Modal>
      )}

      {confirmDel && (
        <Confirm
          text={`Delete the appointment request from ${confirmDel.name}? This cannot be undone.`}
          onYes={remove} onNo={() => setConfirmDel(null)}
        />
      )}

      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
