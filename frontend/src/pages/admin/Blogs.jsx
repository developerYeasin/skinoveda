import { useEffect, useState } from 'react';
import { blogApi } from '../../api/endpoints';
import { Panel, Modal, Field, Confirm, Toast, useToast, ImageUpload, StatusBadge } from '../../components/admin-ui';

const EMPTY = {
  title: '', excerpt: '', content: '', cover_image: '', tags: '',
  author: 'Skinoveda', status: 'published', meta_title: '', meta_description: '',
  title_bn: '', excerpt_bn: '', content_bn: '',
};

export default function Blogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    blogApi.all()
      .then(setRows)
      .catch(() => show('Could not load posts', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) => setEditing((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (!editing.title) return show('Title is required', 'error');
    setBusy(true);
    try {
      if (editing.id) await blogApi.update(editing.id, editing);
      else await blogApi.create(editing);
      show(editing.id ? 'Post updated' : 'Post published');
      setEditing(null);
      load();
    } catch (e) { show(e.response?.data?.message || 'Could not save', 'error'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    try { await blogApi.remove(confirmDel.id); show('Post deleted'); setConfirmDel(null); load(); }
    catch { show('Could not delete', 'error'); }
  };

  const filtered = rows.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
        <div className="spacer" />
        <span className="muted" style={{ fontSize: '.85rem' }}>{rows.length} posts</span>
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ Write Post</button>
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Title</th><th>Tags</th><th>Author</th><th>Views</th><th>Status</th><th>Published</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>No posts found</td></tr>}
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.title}</strong><br /><small className="muted">{b.excerpt?.slice(0, 70)}…</small></td>
                  <td style={{ fontSize: '.8rem' }} className="muted">{b.tags}</td>
                  <td style={{ fontSize: '.84rem' }}>{b.author}</td>
                  <td>{b.views}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ fontSize: '.8rem' }} className="muted">
                    {b.published_at ? new Date(b.published_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" onClick={() => setEditing({ ...b })}>✎</button>
                      <button className="icon-btn danger" onClick={() => setConfirmDel(b)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <Modal wide title={editing.id ? 'Edit Post' : 'Write Post'} onClose={() => setEditing(null)} onSubmit={save} busy={busy}
               submitLabel={editing.status === 'draft' ? 'Save Draft' : 'Publish'}>
          <Field label="Title *"><input value={editing.title} onChange={set('title')} required /></Field>
          <ImageUpload value={editing.cover_image} onChange={(url) => setEditing((x) => ({ ...x, cover_image: url }))} label="Cover image" />
          <Field label="Excerpt" hint="One or two sentences shown on the blog listing.">
            <textarea rows={2} value={editing.excerpt || ''} onChange={set('excerpt')} maxLength={500} />
          </Field>
          <Field label="Content" hint="HTML is supported — use <p>, <h3>, <ul> and <li> tags for structure.">
            <textarea rows={12} value={editing.content || ''} onChange={set('content')} style={{ fontFamily: 'monospace', fontSize: '.84rem' }} />
          </Field>
          <div style={{ background: 'var(--purple-50)', padding: 18, borderRadius: 12, margin: '6px 0 18px' }}>
            <p style={{ fontSize: '.8rem', color: 'var(--purple-700)', fontWeight: 600, margin: '0 0 12px' }}>
              বাংলা অনুবাদ — leave empty to fall back to the English text
            </p>
            <Field label="শিরোনাম (Bangla title)"><input value={editing.title_bn || ''} onChange={set('title_bn')} /></Field>
            <Field label="সারসংক্ষেপ (Bangla excerpt)">
              <textarea rows={2} value={editing.excerpt_bn || ''} onChange={set('excerpt_bn')} maxLength={600} />
            </Field>
            <Field label="মূল লেখা (Bangla content, HTML supported)">
              <textarea rows={8} value={editing.content_bn || ''} onChange={set('content_bn')}
                        style={{ fontFamily: 'monospace', fontSize: '.84rem' }} />
            </Field>
          </div>

          <div className="grid grid-3" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Tags" hint="Comma separated"><input value={editing.tags || ''} onChange={set('tags')} /></Field>
            <Field label="Author"><input value={editing.author || ''} onChange={set('author')} /></Field>
            <Field label="Status">
              <select value={editing.status} onChange={set('status')}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
          </div>
          <Field label="Meta title"><input value={editing.meta_title || ''} onChange={set('meta_title')} /></Field>
          <Field label="Meta description"><input value={editing.meta_description || ''} onChange={set('meta_description')} maxLength={320} /></Field>
        </Modal>
      )}

      {confirmDel && <Confirm text={`Delete "${confirmDel.title}"?`} onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
