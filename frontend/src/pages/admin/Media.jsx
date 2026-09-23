import { useEffect, useState } from 'react';
import api from '../../api/client';
import { assetUrl } from '../../api/client';
import { settingApi, uploadApi } from '../../api/endpoints';
import { Panel, Field, Toast, useToast, Stat } from '../../components/admin-ui';

const PRESETS = [
  'skincare spa', 'facial treatment', 'laser clinic', 'ayurveda massage',
  'herbal medicine', 'spa interior', 'female doctor', 'skincare products',
  'yoga wellness', 'hydrotherapy',
];

export default function Media() {
  const [tab, setTab] = useState('library');
  const [library, setLibrary] = useState([]);
  const [results, setResults] = useState([]);
  const [q, setQ] = useState('skincare spa');
  const [orientation, setOrientation] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState('');
  const { toast, show, clear } = useToast();

  const loadLibrary = () =>
    api.get('/media/library')
      .then((r) => setLibrary(r.data.files || []))
      .catch(() => show('Could not load the media library', 'error'));

  useEffect(() => { loadLibrary(); }, []);
  useEffect(() => {
    settingApi.all().then((r) => setApiKey(r.grouped.media?.pexels_api_key || '')).catch(() => {});
  }, []);

  const search = async (term = q, page = 1) => {
    setBusy(true); setNeedsKey(false);
    try {
      const r = await api.get('/media/stock/search', {
        params: { q: term, page, orientation: orientation || undefined },
      });
      setResults(r.data.photos || []);
      if (!r.data.photos?.length) show('No photos matched that search');
    } catch (e) {
      if (e.response?.data?.needsKey) setNeedsKey(true);
      show(e.response?.data?.message || 'Search failed', 'error');
      setResults([]);
    } finally { setBusy(false); }
  };

  const importPhoto = async (photo) => {
    setBusy(true);
    try {
      const r = await api.post('/media/stock/import', {
        url: photo.full,
        filename: (photo.alt || q).slice(0, 40),
      });
      show(`Saved to the library as ${r.data.filename}`);
      loadLibrary();
      setTab('library');
    } catch (e) {
      show(e.response?.data?.message || 'Import failed', 'error');
    } finally { setBusy(false); }
  };

  const uploadOwn = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadApi.file(file);
      show('Uploaded');
      loadLibrary();
    } catch (ex) {
      show(ex.response?.data?.message || 'Upload failed', 'error');
    } finally { setBusy(false); e.target.value = ''; }
  };

  const saveKey = async () => {
    setBusy(true);
    try {
      await settingApi.save({ pexels_api_key: apiKey }, 'media');
      show('API key saved — stock search is ready');
      setNeedsKey(false);
    } catch (e) {
      show(e.response?.data?.message || 'Could not save', 'error');
    } finally { setBusy(false); }
  };

  const copy = (url) => {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(''), 1800);
  };

  const totalSize = library.reduce((n, f) => n + f.size, 0);

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Images in Library" value={library.length} icon="🖼" />
        <Stat label="Storage Used" value={`${(totalSize / 1048576).toFixed(1)} MB`} icon="💾" />
        <Stat label="Stock Search" value={apiKey ? 'Ready' : 'No key'} icon="🔎" />
      </div>

      <div className="tabs">
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Library</button>
        <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Find Stock Photos</button>
        <button className={tab === 'key' ? 'active' : ''} onClick={() => setTab('key')}>API Key</button>
      </div>

      {/* ---------- library ---------- */}
      {tab === 'library' && (
        <Panel
          title="Media Library"
          action={
            <label className="btn btn-purple btn-sm" style={{ cursor: 'pointer' }}>
              + Upload Image
              <input type="file" accept="image/*" onChange={uploadOwn} style={{ display: 'none' }} />
            </label>
          }
        >
          <p className="muted" style={{ fontSize: '.86rem' }}>
            Click any image to copy its path, then paste it into a service, category, team or gallery image field.
          </p>
          <div className="gallery-grid">
            {library.map((f) => (
              <div key={f.url} className="panel" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => copy(f.url)}>
                <div style={{ aspectRatio: '4/3', background: 'var(--purple-100)' }}>
                  <img src={assetUrl(f.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
                <div style={{ padding: 10, fontSize: '.74rem' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div className="muted">
                    {copied === f.url ? '✓ path copied' : `${(f.size / 1024).toFixed(0)} KB`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {library.length === 0 && <p className="muted text-center" style={{ padding: 30 }}>Nothing uploaded yet.</p>}
        </Panel>
      )}

      {/* ---------- stock search ---------- */}
      {tab === 'stock' && (
        <>
          {needsKey && (
            <div className="alert alert-info">
              Stock search needs a free Pexels API key. Get one at{' '}
              <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer">pexels.com/api</a>{' '}
              and paste it into the <strong>API Key</strong> tab.
            </div>
          )}

          <Panel title="Find Stock Photos">
            <div className="toolbar">
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Search photos…" style={{ minWidth: 260 }}
              />
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="">Any orientation</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
                <option value="square">Square</option>
              </select>
              <button className="btn btn-purple btn-sm" onClick={() => search()} disabled={busy}>
                {busy ? 'Searching…' : 'Search'}
              </button>
            </div>

            <div className="flex gap-8 wrap mb-24">
              {PRESETS.map((p) => (
                <button key={p} className="chip" onClick={() => { setQ(p); search(p); }}>{p}</button>
              ))}
            </div>

            <div className="gallery-grid">
              {results.map((p) => (
                <div key={p.id} className="panel" style={{ overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '4/3', background: 'var(--purple-100)' }}>
                    <img src={p.thumb} alt={p.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ padding: 10 }}>
                    <div className="muted" style={{ fontSize: '.72rem', marginBottom: 8 }}>
                      © {p.photographer} · Pexels
                    </div>
                    <button className="btn btn-purple btn-sm btn-block" onClick={() => importPhoto(p)} disabled={busy}>
                      Save to Library
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {results.length === 0 && !busy && (
              <p className="muted text-center" style={{ padding: 30 }}>
                Search above, or pick one of the suggestions.
              </p>
            )}
          </Panel>
        </>
      )}

      {/* ---------- api key ---------- */}
      {tab === 'key' && (
        <Panel
          title="Pexels API Key"
          action={<button className="btn btn-purple btn-sm" onClick={saveKey} disabled={busy}>Save</button>}
        >
          <Field
            label="API key"
            hint="Free from pexels.com/api — 200 requests/hour, no cost. Photos are free for commercial use and attribution is appreciated but not required."
          >
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your Pexels API key" />
          </Field>
          <div className="alert alert-info">
            The site already ships with a curated photo set under <code>/uploads/stock/</code>. This key is
            only needed if you want to search for and add more photos from inside the panel.
          </div>
        </Panel>
      )}

      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
