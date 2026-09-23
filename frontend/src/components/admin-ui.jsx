import { useEffect, useState } from 'react';
import { uploadApi } from '../api/endpoints';
import { assetUrl } from '../api/client';

export function Stat({ label, value, icon, delta, suffix }) {
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
  return (
    <div className="stat">
      {icon && <span className="ico">{icon}</span>}
      <div className="label">{label}</div>
      <div className="value">{value ?? 0}{suffix}</div>
      {delta !== null && delta !== undefined && (
        <div className={`delta ${dir}`}>
          {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta)}% vs previous period
        </div>
      )}
    </div>
  );
}

export function Panel({ title, action, children, tight }) {
  return (
    <div className="panel">
      {(title || action) && (
        <div className="panel-head">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      <div className={`panel-body ${tight ? 'tight' : ''}`}>{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, onSubmit, submitLabel = 'Save', busy, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" style={wide ? { width: 'min(900px, 100%)' } : undefined}
            onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          {onSubmit && (
            <button className="btn btn-purple btn-sm" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
          )}
        </div>
      </form>
    </div>
  );
}

export function Field({ label, hint, children, span }) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : undefined}>
      {label && <label>{label}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function ImageUpload({ value, onChange, label = 'Image' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const r = await uploadApi.file(file);
      onChange(r.url);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex gap-12 items-center wrap">
        {value && (
          <img src={assetUrl(value)} alt="" style={{ width: 74, height: 74, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <input type="file" accept="image/*" onChange={handle} disabled={busy} />
          <input
            value={value || ''} onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL" style={{ marginTop: 8 }}
          />
        </div>
        {value && <button type="button" className="icon-btn danger" onClick={() => onChange('')}>×</button>}
      </div>
      {busy && <div className="hint">Uploading…</div>}
      {err && <div className="hint" style={{ color: '#C0392B' }}>{err}</div>}
    </div>
  );
}

export function Confirm({ text, onYes, onNo }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onNo()}>
      <div className="modal" style={{ width: 'min(420px, 100%)' }}>
        <div className="modal-body text-center">
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>⚠</div>
          <h3>Are you sure?</h3>
          <p className="muted">{text}</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline btn-sm" onClick={onNo}>Cancel</button>
          <button className="btn btn-sm" style={{ background: '#C0392B', color: '#fff' }} onClick={onYes}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 500,
      padding: '14px 22px', borderRadius: 12, color: '#fff',
      background: type === 'error' ? '#C0392B' : '#2E7D4F',
      boxShadow: 'var(--shadow-lg)', fontSize: '.9rem',
    }}>
      {message}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending: 'badge-amber', confirmed: 'badge-purple', completed: 'badge-green',
    cancelled: 'badge-red', no_show: 'badge-gray',
    published: 'badge-green', draft: 'badge-gray',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{String(status).replace('_', ' ')}</span>;
}

export function useToast() {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  return {
    toast,
    show: (message, type = 'success') => setToast({ message, type }),
    clear: () => setToast({ message: '', type: 'success' }),
  };
}
