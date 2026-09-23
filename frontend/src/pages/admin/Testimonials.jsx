import { useEffect, useState } from 'react';
import { testimonialApi } from '../../api/endpoints';
import { Panel, Modal, Field, Confirm, Toast, useToast, ImageUpload } from '../../components/admin-ui';

const EMPTY = {
  client_name: '', client_title: 'Client', photo: '', rating: 5,
  message: '', service_name: '', is_approved: 1, sort_order: 0,
};

export default function Testimonials() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    testimonialApi.list({ limit: 200 })
      .then((r) => setRows(r.data || []))
      .catch(() => show('Could not load testimonials', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setEditing((x) => ({ ...x, [k]: v }));
  };

  const save = async () => {
    if (!editing.client_name || !editing.message) return show('Name and message are required', 'error');
    setBusy(true);
    try {
      if (editing.id) await testimonialApi.update(editing.id, editing);
      else await testimonialApi.create(editing);
      show(editing.id ? 'Testimonial updated' : 'Testimonial added');
      setEditing(null);
      load();
    } catch (e) { show(e.response?.data?.message || 'Could not save', 'error'); }
    finally { setBusy(false); }
  };

  const toggle = async (t) => {
    try {
      await testimonialApi.update(t.id, { is_approved: t.is_approved ? 0 : 1 });
      setRows((rs) => rs.map((r) => (r.id === t.id ? { ...r, is_approved: r.is_approved ? 0 : 1 } : r)));
    } catch { show('Could not update', 'error'); }
  };

  const remove = async () => {
    try { await testimonialApi.remove(confirmDel.id); show('Deleted'); setConfirmDel(null); load(); }
    catch { show('Could not delete', 'error'); }
  };

  return (
    <>
      <div className="toolbar">
        <span className="muted" style={{ fontSize: '.88rem' }}>Reviews shown on the homepage. Unapproved ones stay hidden.</span>
        <div className="spacer" />
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ Add Testimonial</button>
      </div>

      {loading && <div className="skeleton" style={{ height: 220 }} />}

      <div className="admin-grid-3">
        {rows.map((t) => (
          <Panel key={t.id}>
            <div className="stars" style={{ color: 'var(--gold-500)' }}>{'★'.repeat(t.rating)}</div>
            <p style={{ fontSize: '.9rem', fontStyle: 'italic' }}>“{t.message}”</p>
            <div className="flex justify-between items-center gap-8">
              <div>
                <strong style={{ fontSize: '.9rem' }}>{t.client_name}</strong>
                <div className="muted" style={{ fontSize: '.78rem' }}>{t.service_name || t.client_title}</div>
              </div>
              <span className={`badge ${t.is_approved ? 'badge-green' : 'badge-gray'}`}>
                {t.is_approved ? 'live' : 'hidden'}
              </span>
            </div>
            <div className="flex gap-8 mt-16">
              <button className="btn btn-outline btn-sm" onClick={() => setEditing({ ...t })}>Edit</button>
              <button className="btn btn-outline btn-sm" onClick={() => toggle(t)}>{t.is_approved ? 'Hide' : 'Show'}</button>
              <button className="icon-btn danger" onClick={() => setConfirmDel(t)}>🗑</button>
            </div>
          </Panel>
        ))}
        {!loading && rows.length === 0 && <p className="muted">No testimonials yet.</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => setEditing(null)} onSubmit={save} busy={busy}>
          <ImageUpload value={editing.photo} onChange={(url) => setEditing((x) => ({ ...x, photo: url }))} label="Client photo (optional)" />
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Client name *"><input value={editing.client_name} onChange={set('client_name')} required /></Field>
            <Field label="Treatment received"><input value={editing.service_name || ''} onChange={set('service_name')} /></Field>
            <Field label="Rating">
              <select value={editing.rating} onChange={set('rating')}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </Field>
            <Field label="Sort order"><input type="number" value={editing.sort_order ?? 0} onChange={set('sort_order')} /></Field>
          </div>
          <Field label="Review message *"><textarea rows={4} value={editing.message} onChange={set('message')} required /></Field>
          <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
            <input type="checkbox" checked={!!editing.is_approved} onChange={set('is_approved')} style={{ width: 'auto' }} />
            Approved — show on the website
          </label>
        </Modal>
      )}

      {confirmDel && <Confirm text={`Delete the review from ${confirmDel.client_name}?`} onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
