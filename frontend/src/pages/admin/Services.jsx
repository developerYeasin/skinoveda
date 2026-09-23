import { useCallback, useEffect, useState } from 'react';
import { serviceApi, categoryApi } from '../../api/endpoints';
import { Panel, Modal, Field, Confirm, Toast, useToast, ImageUpload } from '../../components/admin-ui';

const EMPTY = {
  name: '', category_id: '', group_id: '', short_description: '', description: '', benefits: '',
  image: '', duration: '30 - 60 min', price: '', price_note: '', sort_order: 0,
  is_featured: 0, is_active: 1, meta_title: '', meta_description: '',
  name_bn: '', short_description_bn: '', description_bn: '', benefits_bn: '',
};

export default function Services() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  useEffect(() => { categoryApi.list().then(setCategories).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true);
    serviceApi.list({ ...filters, limit: 500 })
      .then((r) => { setRows(r.data); setTotal(r.total); })
      .catch(() => show('Could not load services', 'error'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  // load the groups for whichever category is selected in the editor
  useEffect(() => {
    if (!editing?.category_id) { setGroups([]); return; }
    categoryApi.groups(editing.category_id).then(setGroups).catch(() => setGroups([]));
  }, [editing?.category_id]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setEditing((x) => ({ ...x, [k]: v }));
  };

  const save = async () => {
    if (!editing.name || !editing.category_id) return show('Name and category are required', 'error');
    setBusy(true);
    try {
      const payload = { ...editing, price: editing.price === '' ? null : editing.price, group_id: editing.group_id || null };
      if (editing.id) await serviceApi.update(editing.id, payload);
      else await serviceApi.create(payload);
      show(editing.id ? 'Service updated' : 'Service created');
      setEditing(null);
      load();
    } catch (e) {
      show(e.response?.data?.message || 'Could not save', 'error');
    } finally { setBusy(false); }
  };

  const remove = async () => {
    try {
      await serviceApi.remove(confirmDel.id);
      show('Service deleted');
      setConfirmDel(null);
      load();
    } catch { show('Could not delete', 'error'); }
  };

  return (
    <>
      <div className="toolbar">
        <input
          placeholder="Search treatments…" value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} style={{ minWidth: 240 }}
        />
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All specialities</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <div className="spacer" />
        <span className="muted" style={{ fontSize: '.85rem' }}>{total} treatments</span>
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY, category_id: filters.category || '' })}>
          + Add Service
        </button>
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Treatment</th><th>Speciality</th><th>Group</th><th>Price</th><th>Views</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>No services found</td></tr>}
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    {s.is_featured === 1 && <span className="badge badge-gold" style={{ marginLeft: 8 }}>featured</span>}
                    <br /><small className="muted">{s.short_description?.slice(0, 70)}</small>
                  </td>
                  <td style={{ fontSize: '.85rem' }}>{s.category_icon} {s.category_name}</td>
                  <td style={{ fontSize: '.82rem' }} className="muted">{s.group_name || '—'}</td>
                  <td>{s.price ? `৳ ${Number(s.price).toLocaleString()}` : '—'}</td>
                  <td>{s.views}</td>
                  <td><span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'live' : 'hidden'}</span></td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" onClick={() => setEditing({ ...s, price: s.price ?? '' })}>✎</button>
                      <button className="icon-btn danger" onClick={() => setConfirmDel(s)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <Modal
          wide title={editing.id ? 'Edit Service' : 'Add Service'}
          onClose={() => setEditing(null)} onSubmit={save} busy={busy}
        >
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Treatment name (English) *"><input value={editing.name} onChange={set('name')} required /></Field>
            <Field label="Speciality *">
              <select value={editing.category_id} onChange={set('category_id')} required>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
            <Field label="Service group">
              <select value={editing.group_id || ''} onChange={set('group_id')}>
                <option value="">None</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Duration"><input value={editing.duration || ''} onChange={set('duration')} placeholder="e.g. 45 min" /></Field>
            <Field label="Price (৳)"><input type="number" step="0.01" value={editing.price} onChange={set('price')} placeholder="Leave empty for 'on consultation'" /></Field>
            <Field label="Price note"><input value={editing.price_note || ''} onChange={set('price_note')} placeholder="e.g. per session" /></Field>
          </div>

          <Field label="Short description (English)" hint="Shown on cards and listings.">
            <input value={editing.short_description || ''} onChange={set('short_description')} maxLength={400} />
          </Field>

          <div style={{ background: 'var(--purple-50)', padding: 18, borderRadius: 12, margin: '6px 0 18px' }}>
            <p style={{ fontSize: '.8rem', color: 'var(--purple-700)', fontWeight: 600, margin: '0 0 12px' }}>
              বাংলা অনুবাদ — leave empty to fall back to the English text
            </p>
            <Field label="নাম (Bangla name)">
              <input value={editing.name_bn || ''} onChange={set('name_bn')} />
            </Field>
            <Field label="সংক্ষিপ্ত বিবরণ (Bangla short description)">
              <input value={editing.short_description_bn || ''} onChange={set('short_description_bn')} maxLength={500} />
            </Field>
            <Field label="বিস্তারিত (Bangla description)">
              <textarea rows={4} value={editing.description_bn || ''} onChange={set('description_bn')} />
            </Field>
            <Field label="উপকারিতা (Bangla benefits, one per line)">
              <textarea rows={3} value={editing.benefits_bn || ''} onChange={set('benefits_bn')} />
            </Field>
          </div>
          <Field label="Full description">
            <textarea rows={5} value={editing.description || ''} onChange={set('description')} />
          </Field>
          <Field label="Key benefits" hint="One benefit per line.">
            <textarea rows={4} value={editing.benefits || ''} onChange={set('benefits')} placeholder={'Visible results from the first session\nNo downtime'} />
          </Field>

          <ImageUpload value={editing.image} onChange={(url) => setEditing((x) => ({ ...x, image: url }))} />

          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Meta title"><input value={editing.meta_title || ''} onChange={set('meta_title')} /></Field>
            <Field label="Sort order"><input type="number" value={editing.sort_order ?? 0} onChange={set('sort_order')} /></Field>
          </div>
          <Field label="Meta description"><input value={editing.meta_description || ''} onChange={set('meta_description')} maxLength={320} /></Field>

          <div className="flex gap-24 mt-8">
            <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!editing.is_featured} onChange={set('is_featured')} style={{ width: 'auto' }} />
              Featured on homepage
            </label>
            <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!editing.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
              Visible on the website
            </label>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Confirm text={`Delete "${confirmDel.name}"? This cannot be undone.`} onYes={remove} onNo={() => setConfirmDel(null)} />
      )}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
