import { useEffect, useState } from 'react';
import { galleryApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import { Modal, Field, Confirm, Toast, useToast, ImageUpload } from '../../components/admin-ui';

const ALBUMS = [
  ['clinic', 'Clinic'], ['treatment', 'Treatments'], ['before_after', 'Before & After'],
  ['team', 'Team'], ['event', 'Events'],
];
const EMPTY = { title: '', caption: '', image: '', album: 'clinic', sort_order: 0, is_active: 1 };

export default function Gallery() {
  const [rows, setRows] = useState([]);
  const [album, setAlbum] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    galleryApi.list({ album: album || undefined, limit: 300 })
      .then((r) => setRows(r.data || []))
      .catch(() => show('Could not load gallery', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [album]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setEditing((x) => ({ ...x, [k]: v }));
  };

  const save = async () => {
    if (!editing.image) return show('Please upload an image first', 'error');
    setBusy(true);
    try {
      if (editing.id) await galleryApi.update(editing.id, editing);
      else await galleryApi.create(editing);
      show(editing.id ? 'Photo updated' : 'Photo added');
      setEditing(null);
      load();
    } catch (e) { show(e.response?.data?.message || 'Could not save', 'error'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    try { await galleryApi.remove(confirmDel.id); show('Photo deleted'); setConfirmDel(null); load(); }
    catch { show('Could not delete', 'error'); }
  };

  return (
    <>
      <div className="toolbar">
        <button className={`chip ${album === '' ? 'active' : ''}`} onClick={() => setAlbum('')}>All</button>
        {ALBUMS.map(([k, l]) => (
          <button key={k} className={`chip ${album === k ? 'active' : ''}`} onClick={() => setAlbum(k)}>{l}</button>
        ))}
        <div className="spacer" />
        <span className="muted" style={{ fontSize: '.85rem' }}>{rows.length} photos</span>
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY, album: album || 'clinic' })}>+ Add Photo</button>
      </div>

      {loading && <div className="skeleton" style={{ height: 240 }} />}

      <div className="gallery-grid">
        {rows.map((g) => (
          <div key={g.id} className="panel" style={{ overflow: 'hidden' }}>
            <div style={{ aspectRatio: '4/3', background: 'var(--purple-100)' }}>
              <img src={assetUrl(g.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: 14 }}>
              <div className="flex justify-between items-center gap-8 mb-8">
                <strong style={{ fontSize: '.88rem' }}>{g.title || 'Untitled'}</strong>
                <span className="badge badge-gray">{g.album.replace('_', ' ')}</span>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-outline btn-sm" onClick={() => setEditing({ ...g })}>Edit</button>
                <button className="icon-btn danger" onClick={() => setConfirmDel(g)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && <p className="muted">No photos in this album yet.</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Photo' : 'Add Photo'} onClose={() => setEditing(null)} onSubmit={save} busy={busy}>
          <ImageUpload value={editing.image} onChange={(url) => setEditing((x) => ({ ...x, image: url }))} label="Photo *" />
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Title"><input value={editing.title || ''} onChange={set('title')} /></Field>
            <Field label="Album">
              <select value={editing.album} onChange={set('album')}>
                {ALBUMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Caption"><input value={editing.caption || ''} onChange={set('caption')} /></Field>
          <div className="flex gap-24 items-center">
            <Field label="Sort order"><input type="number" value={editing.sort_order ?? 0} onChange={set('sort_order')} /></Field>
            <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!editing.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
              Visible on the website
            </label>
          </div>
        </Modal>
      )}

      {confirmDel && <Confirm text="Delete this photo from the gallery?" onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
