import { useEffect, useState } from 'react';
import { galleryApi } from '../api/endpoints';
import { assetUrl } from '../api/client';
import { useLang } from '../i18n';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Photo, Blossom } from '../components/Art';

const ALBUMS = [
  ['', 'gallery.all'],
  ['clinic', 'gallery.clinic'],
  ['treatment', 'gallery.treatment'],
  ['before_after', 'gallery.beforeAfter'],
  ['team', 'gallery.team'],
  ['event', 'gallery.event'],
];

export default function Gallery() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [album, setAlbum] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    galleryApi.list({ album: album || undefined, limit: 200 })
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [album]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="site-canvas">
      <PageBanner title={t('gallery.title')} subtitle={t('gallery.sub')} crumbs={[{ label: t('nav.gallery') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tl" size={230} opacity={0.15} />
        <div className="container">
          <div className="glass flex gap-8 wrap mb-24" style={{ padding: 12, justifyContent: 'center' }}>
            {ALBUMS.map(([key, labelKey]) => (
              <button key={key} className={`chip ${album === key ? 'active' : ''}`} onClick={() => setAlbum(key)}>
                {t(labelKey)}
              </button>
            ))}
          </div>

          {loading && <div className="gallery-grid"><Skeleton h={200} count={8} /></div>}

          {!loading && items.length === 0 && (
            <EmptyState icon="🖼" title={t('gallery.empty')} text={t('gallery.emptyText')} />
          )}

          <div className="gallery-grid">
            {items.map((g) => (
              <div className="gallery-item is-glass" key={g.id} onClick={() => g.image && setLightbox(g)}>
                <Photo src={g.image} icon="🖼" alt={g.title || ''} tone="purple" />
                {(g.title || g.caption) && <div className="cap">{g.title || g.caption}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="close" aria-label="Close">×</button>
          <img src={assetUrl(lightbox.image)} alt={lightbox.title || ''} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
