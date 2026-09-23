import { useEffect, useState } from 'react';
import { contactApi } from '../../api/endpoints';
import { Panel, Modal, Confirm, Toast, useToast, Stat } from '../../components/admin-ui';

export default function Messages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    contactApi.list({ limit: 200 })
      .then((r) => setRows(r.data || []))
      .catch(() => show('Could not load messages', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const view = async (m) => {
    setOpen(m);
    if (!m.is_read) {
      try {
        await contactApi.update(m.id, { is_read: 1 });
        setRows((rs) => rs.map((r) => (r.id === m.id ? { ...r, is_read: 1 } : r)));
      } catch { /* not critical */ }
    }
  };

  const markReplied = async (m) => {
    try {
      await contactApi.update(m.id, { replied: 1 });
      setRows((rs) => rs.map((r) => (r.id === m.id ? { ...r, replied: 1 } : r)));
      show('Marked as replied');
      setOpen(null);
    } catch { show('Could not update', 'error'); }
  };

  const remove = async () => {
    try { await contactApi.remove(confirmDel.id); show('Message deleted'); setConfirmDel(null); load(); }
    catch { show('Could not delete', 'error'); }
  };

  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Total Messages" value={rows.length} icon="✉" />
        <Stat label="Unread" value={unread} icon="🔔" />
        <Stat label="Replied" value={rows.filter((r) => r.replied).length} icon="↩" />
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>From</th><th>Subject</th><th>Received</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="text-center muted" style={{ padding: 40 }}>No messages yet</td></tr>}
              {rows.map((m) => (
                <tr key={m.id} style={!m.is_read ? { background: 'var(--purple-50)' } : undefined}>
                  <td>
                    <strong>{m.name}</strong><br />
                    <small className="muted">{m.email || m.phone || '—'}</small>
                  </td>
                  <td style={{ fontSize: '.88rem' }}>{m.subject}</td>
                  <td style={{ fontSize: '.8rem' }} className="muted">{new Date(m.created_at).toLocaleString('en-GB')}</td>
                  <td>
                    {!m.is_read && <span className="badge badge-amber">new</span>}
                    {m.replied === 1 && <span className="badge badge-green">replied</span>}
                    {m.is_read === 1 && m.replied === 0 && <span className="badge badge-gray">read</span>}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" onClick={() => view(m)}>👁</button>
                      <button className="icon-btn danger" onClick={() => setConfirmDel(m)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {open && (
        <Modal title={open.subject || 'Message'} onClose={() => setOpen(null)}>
          <div className="alert alert-info">
            <strong>{open.name}</strong><br />
            {open.email && <>✉ <a href={`mailto:${open.email}`}>{open.email}</a><br /></>}
            {open.phone && <>📞 <a href={`tel:${open.phone}`}>{open.phone}</a><br /></>}
            <small>{new Date(open.created_at).toLocaleString('en-GB')}</small>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{open.message}</p>
          <div className="flex gap-8 mt-16">
            {open.email && (
              <a className="btn btn-purple btn-sm" href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject || '')}`}>
                Reply by Email
              </a>
            )}
            {!open.replied && <button className="btn btn-outline btn-sm" onClick={() => markReplied(open)}>Mark as Replied</button>}
          </div>
        </Modal>
      )}

      {confirmDel && <Confirm text={`Delete the message from ${confirmDel.name}?`} onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
