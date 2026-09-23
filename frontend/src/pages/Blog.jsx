import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../api/endpoints';
import { useLang } from '../i18n';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Photo, Blossom } from '../components/Art';

export default function Blog() {
  const { t, pickField, lang } = useLang();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      blogApi.list({ search: search || undefined, limit: 24 })
        .then((r) => setPosts(r.data || []))
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fmt = (d) =>
    new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="site-canvas">
      <PageBanner title={t('blog.title')} subtitle={t('blog.sub')} crumbs={[{ label: t('nav.blog') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tr" size={240} opacity={0.15} />
        <div className="container">
          <div className="text-center mb-24">
            <input
              type="search" placeholder={t('blog.search')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '13px 24px', minWidth: 320, borderRadius: 999,
                border: '1px solid rgba(255,255,255,.8)', background: 'rgba(255,255,255,.6)',
                backdropFilter: 'blur(12px)', outline: 'none',
              }}
            />
          </div>

          {loading && <div className="grid grid-3"><Skeleton h={320} count={6} /></div>}

          {!loading && posts.length === 0 && (
            <EmptyState icon="📖" title={t('blog.empty')} text={t('blog.emptyText')} />
          )}

          <div className="grid grid-3">
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="service-card is-glass post-card">
                <div className="thumb">
                  <Photo src={p.cover_image} icon="📖" alt={pickField(p, 'title')} tone="purple" />
                </div>
                <div className="body">
                  <div className="meta">
                    <span>{fmt(p.published_at || p.created_at)}</span>
                    <span>👁 {p.views}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem' }}>{pickField(p, 'title')}</h3>
                  <p>{pickField(p, 'excerpt')}</p>
                  <span className="go">{t('blog.read')} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
