import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../api/endpoints';
import { assetUrl } from '../api/client';
import { useLang } from '../i18n';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Photo, Blossom } from '../components/Art';

export default function BlogDetail() {
  const { slug } = useParams();
  const { t, pickField, lang } = useLang();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    blogApi.get(slug)
      .then((p) => { setPost(p); document.title = `${p.title} | Skinoveda`; })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
    return () => { document.title = 'Skinoveda'; };
  }, [slug]);

  if (loading) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('common.loading')} />
        <section className="section"><div className="container"><Skeleton h={400} /></div></section>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('blog.notFound')} crumbs={[{ label: t('nav.blog'), to: '/blog' }]} />
        <section className="section">
          <div className="container">
            <EmptyState icon="📖" title={t('blog.notFound')} />
            <div className="text-center mt-24"><Link to="/blog" className="btn btn-purple">{t('blog.backToBlog')} →</Link></div>
          </div>
        </section>
      </div>
    );
  }

  const title = pickField(post, 'title');

  return (
    <div className="site-canvas">
      <PageBanner
        title={title}
        subtitle={pickField(post, 'excerpt')}
        crumbs={[{ label: t('nav.blog'), to: '/blog' }, { label: `${title.slice(0, 40)}…` }]}
      />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tl" size={220} opacity={0.14} />
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="glass glass-sheen" style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
            <div className="flex gap-16 wrap muted mb-24" style={{ fontSize: '.85rem' }}>
              <span>✍ {post.author}</span>
              <span>
                {new Date(post.published_at || post.created_at)
                  .toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span>👁 {post.views} {t('blog.views')}</span>
            </div>

            {post.cover_image && (
              <img src={assetUrl(post.cover_image)} alt={title}
                   style={{ borderRadius: 'var(--r-lg)', marginBottom: 32, width: '100%' }} />
            )}

            <div className="post-body" dangerouslySetInnerHTML={{ __html: pickField(post, 'content') || '' }} />

            {post.tags && (
              <div className="flex gap-8 wrap mt-40">
                {post.tags.split(',').map((tag) => (
                  <span key={tag} className="badge badge-purple">#{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {post.related?.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <h2 className="text-center mb-24">{t('blog.keepReading')}</h2>
            <div className="grid grid-3">
              {post.related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="service-card is-glass post-card">
                  <div className="thumb">
                    <Photo src={r.cover_image} icon="📖" alt={pickField(r, 'title')} tone="purple" />
                  </div>
                  <div className="body">
                    <h3 style={{ fontSize: '1.1rem' }}>{pickField(r, 'title')}</h3>
                    <p>{pickField(r, 'excerpt')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
