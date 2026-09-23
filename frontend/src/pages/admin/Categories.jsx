import { useEffect, useState } from 'react';
import { categoryApi } from '../../api/endpoints';
import { Panel, Modal, Field, Confirm, Toast, useToast, ImageUpload } from '../../components/admin-ui';

const EMPTY = {
  name: '', icon: '✦', code: '', tagline: '', description: '', image: '',
  color: '#6F2385', sort_order: 0, is_featured: 1, is_active: 1, meta_title: '', meta_description: '',
  name_bn: '', tagline_bn: '', description_bn: '',
};

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [groupsFor, setGroupsFor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    categoryApi.list().then(setRows).catch(() => show('Could not load categories', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (!groupsFor) return;
    categoryApi.groups(groupsFor.id).then(setGroups).catch(() => setGroups([]));
  }, [groupsFor]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setEditing((x) => ({ ...x, [k]: v }));
  };

  const save = async () => {
    if (!editing.name) return show('Name is required', 'error');
    setBusy(true);
    try {
      if (editing.id) await categoryApi.update(editing.id, editing);
      else await categoryApi.create(editing);
      show(editing.id ? 'Category updated' : 'Category created');
      setEditing(null);
      load();
    } catch (e) { show(e.response?.data?.message || 'Could not save', 'error'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    try {
      await categoryApi.remove(confirmDel.id);
      show('Category deleted');
      setConfirmDel(null);
      load();
    } catch { show('Could not delete', 'error'); }
  };

  const addGroup = async () => {
    if (!newGroup.trim()) return;
    try {
      await categoryApi.addGroup(groupsFor.id, { name: newGroup, sort_order: groups.length + 1 });
      setNewGroup('');
      categoryApi.groups(groupsFor.id).then(setGroups);
      show('Group added');
    } catch { show('Could not add group', 'error'); }
  };

  return (
    <>
      <div className="toolbar">
        <span className="muted" style={{ fontSize: '.88rem' }}>
          The seven top-level specialities shown across the site.
        </span>
        <div className="spacer" />
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ Add Category</button>
      </div>

      {loading && <div className="skeleton" style={{ height: 260 }} />}

      <div className="admin-grid-3">
        {rows.map((c) => (
          <div className="panel" key={c.id}>
            <div style={{ height: 8, background: c.color || '#6F2385' }} />
            <div className="panel-body">
              <div className="flex justify-between items-center mb-8">
                <span style={{ fontSize: '1.7rem' }}>{c.icon}</span>
                <span className="badge badge-purple">{c.code}</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>{c.name}</h3>
              <p className="muted" style={{ fontSize: '.85rem' }}>{c.tagline}</p>
              <div className="flex gap-8 items-center mb-8">
                <span className="badge badge-gray">{c.service_count} treatments</span>
                <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'live' : 'hidden'}</span>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-outline btn-sm" onClick={() => setEditing({ ...c })}>Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => setGroupsFor(c)}>Groups</button>
                <button className="icon-btn danger" onClick={() => setConfirmDel(c)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Category' : 'Add Category'} onClose={() => setEditing(null)} onSubmit={save} busy={busy}>
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Name *"><input value={editing.name} onChange={set('name')} required /></Field>
            <Field label="Icon (emoji)"><input value={editing.icon || ''} onChange={set('icon')} maxLength={4} /></Field>
            <Field label="Code" hint="Shown as the big number, e.g. 01"><input value={editing.code || ''} onChange={set('code')} maxLength={10} /></Field>
            <Field label="Accent colour"><input type="color" value={editing.color || '#6F2385'} onChange={set('color')} style={{ height: 44, padding: 4 }} /></Field>
          </div>
          <Field label="Tagline"><input value={editing.tagline || ''} onChange={set('tagline')} /></Field>
          <Field label="Description"><textarea rows={4} value={editing.description || ''} onChange={set('description')} /></Field>

          <div style={{ background: 'var(--purple-50)', padding: 18, borderRadius: 12, margin: '6px 0 18px' }}>
            <p style={{ fontSize: '.8rem', color: 'var(--purple-700)', fontWeight: 600, margin: '0 0 12px' }}>
              বাংলা অনুবাদ — leave empty to fall back to the English text
            </p>
            <Field label="নাম (Bangla name)">
              <input value={editing.name_bn || ''} onChange={set('name_bn')} />
            </Field>
            <Field label="ট্যাগলাইন (Bangla tagline)">
              <input value={editing.tagline_bn || ''} onChange={set('tagline_bn')} />
            </Field>
            <Field label="বিবরণ (Bangla description)">
              <textarea rows={4} value={editing.description_bn || ''} onChange={set('description_bn')} />
            </Field>
          </div>
          <ImageUpload value={editing.image} onChange={(url) => setEditing((x) => ({ ...x, image: url }))} label="Cover image" />
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Meta title"><input value={editing.meta_title || ''} onChange={set('meta_title')} /></Field>
            <Field label="Sort order"><input type="number" value={editing.sort_order ?? 0} onChange={set('sort_order')} /></Field>
          </div>
          <Field label="Meta description"><input value={editing.meta_description || ''} onChange={set('meta_description')} /></Field>
          <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
            <input type="checkbox" checked={!!editing.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
            Visible on the website
          </label>
        </Modal>
      )}

      {groupsFor && (
        <Modal title={`${groupsFor.name} — Service Groups`} onClose={() => setGroupsFor(null)}>
          <p className="muted" style={{ fontSize: '.88rem' }}>
            Groups organise the treatments inside this speciality (for example “Laser”, “Face Aesthetics”).
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
            {groups.map((g) => (
              <li key={g.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <strong style={{ fontSize: '.92rem' }}>{g.name}</strong>
              </li>
            ))}
            {groups.length === 0 && <li className="muted">No groups yet.</li>}
          </ul>
          <div className="flex gap-8">
            <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="New group name"
                   style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10 }} />
            <button type="button" className="btn btn-purple btn-sm" onClick={addGroup}>Add</button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Confirm
          text={`Delete "${confirmDel.name}"? All ${confirmDel.service_count} treatments inside it will also be removed.`}
          onYes={remove} onNo={() => setConfirmDel(null)}
        />
      )}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
