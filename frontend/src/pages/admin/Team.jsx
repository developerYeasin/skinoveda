import { useEffect, useState } from 'react';
import { teamApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import { Panel, Modal, Field, Confirm, Toast, useToast, ImageUpload } from '../../components/admin-ui';

const EMPTY = {
  name: '', designation: '', specialization: '', qualifications: '', experience: '',
  bio: '', quote: '', photo: '', facebook: '', instagram: '', linkedin: '',
  sort_order: 0, is_active: 1,
  name_bn: '', designation_bn: '', bio_bn: '',
};

export default function Team() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    teamApi.list({ limit: 100 })
      .then((r) => setRows(r.data || []))
      .catch(() => show('Could not load team', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setEditing((x) => ({ ...x, [k]: v }));
  };

  const save = async () => {
    if (!editing.name) return show('Name is required', 'error');
    setBusy(true);
    try {
      if (editing.id) await teamApi.update(editing.id, editing);
      else await teamApi.create(editing);
      show(editing.id ? 'Profile updated' : 'Team member added');
      setEditing(null);
      load();
    } catch (e) { show(e.response?.data?.message || 'Could not save', 'error'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    try { await teamApi.remove(confirmDel.id); show('Removed'); setConfirmDel(null); load(); }
    catch { show('Could not delete', 'error'); }
  };

  return (
    <>
      <div className="toolbar">
        <span className="muted" style={{ fontSize: '.88rem' }}>Doctors and specialists shown on the site and in the booking form.</span>
        <div className="spacer" />
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ Add Member</button>
      </div>

      {loading && <div className="skeleton" style={{ height: 240 }} />}

      <div className="admin-grid-3">
        {rows.map((m) => (
          <Panel key={m.id}>
            <div className="flex gap-16">
              <div style={{
                width: 76, height: 76, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                background: 'var(--grad-hero)', display: 'grid', placeItems: 'center', fontSize: '1.8rem',
              }}>
                {m.photo ? <img src={assetUrl(m.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👩‍⚕️'}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 2 }}>{m.name}</h3>
                <p className="muted" style={{ fontSize: '.82rem', marginBottom: 6 }}>{m.designation}</p>
                <span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'}`}>{m.is_active ? 'live' : 'hidden'}</span>
              </div>
            </div>
            <div className="flex gap-8 mt-16">
              <button className="btn btn-outline btn-sm" onClick={() => setEditing({ ...m })}>Edit</button>
              <button className="icon-btn danger" onClick={() => setConfirmDel(m)}>🗑</button>
            </div>
          </Panel>
        ))}
        {!loading && rows.length === 0 && <p className="muted">No team members yet.</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Team Member' : 'Add Team Member'} onClose={() => setEditing(null)} onSubmit={save} busy={busy}>
          <ImageUpload value={editing.photo} onChange={(url) => setEditing((x) => ({ ...x, photo: url }))} label="Profile photo" />
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Full name *"><input value={editing.name} onChange={set('name')} required /></Field>
            <Field label="Designation"><input value={editing.designation || ''} onChange={set('designation')} placeholder="Aesthetic Dermatologist" /></Field>
            <Field label="Qualifications"><input value={editing.qualifications || ''} onChange={set('qualifications')} placeholder="MBBS, MD (Dermatology)" /></Field>
            <Field label="Experience"><input value={editing.experience || ''} onChange={set('experience')} placeholder="10+ Years" /></Field>
          </div>
          <Field label="Specialization"><input value={editing.specialization || ''} onChange={set('specialization')} /></Field>
          <Field label="Short bio"><textarea rows={4} value={editing.bio || ''} onChange={set('bio')} /></Field>
          <Field label="Quote" hint="Shown in italics on the homepage."><input value={editing.quote || ''} onChange={set('quote')} /></Field>

          <div style={{ background: 'var(--purple-50)', padding: 18, borderRadius: 12, margin: '6px 0 18px' }}>
            <p style={{ fontSize: '.8rem', color: 'var(--purple-700)', fontWeight: 600, margin: '0 0 12px' }}>
              বাংলা অনুবাদ — leave empty to fall back to the English text
            </p>
            <Field label="নাম (Bangla name)"><input value={editing.name_bn || ''} onChange={set('name_bn')} /></Field>
            <Field label="পদবি (Bangla designation)"><input value={editing.designation_bn || ''} onChange={set('designation_bn')} /></Field>
            <Field label="পরিচিতি (Bangla bio)"><textarea rows={3} value={editing.bio_bn || ''} onChange={set('bio_bn')} /></Field>
          </div>
          <div className="grid grid-3" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Facebook"><input value={editing.facebook || ''} onChange={set('facebook')} /></Field>
            <Field label="Instagram"><input value={editing.instagram || ''} onChange={set('instagram')} /></Field>
            <Field label="LinkedIn"><input value={editing.linkedin || ''} onChange={set('linkedin')} /></Field>
          </div>
          <div className="flex gap-24 items-center">
            <Field label="Sort order"><input type="number" value={editing.sort_order ?? 0} onChange={set('sort_order')} /></Field>
            <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!editing.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
              Visible on the website
            </label>
          </div>
        </Modal>
      )}

      {confirmDel && <Confirm text={`Remove ${confirmDel.name} from the team?`} onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
