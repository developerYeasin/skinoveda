import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoryApi } from '../api/endpoints';
import { useLang } from '../i18n';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Blossom } from '../components/Art';

export default function CategoryDetail() {
  const { slug } = useParams();
  const { t, pickField } = useLang();
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    categoryApi.get(slug).then(setCat).catch(() => setCat(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('common.loading')} />
        <section className="section"><div className="container grid grid-3"><Skeleton h={160} count={6} /></div></section>
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('common.categoryNotFound')} crumbs={[{ label: t('nav.services'), to: '/services' }]} />
        <section className="section">
          <div className="container">
            <EmptyState icon="🌿" title={t('common.categoryNotFound')} text={t('services.noMatchText')} />
            <div className="text-center mt-24"><Link to="/services" className="btn btn-purple">{t('common.allServices')} →</Link></div>
          </div>
        </section>
      </div>
    );
  }

  const name = pickField(cat, 'name');

  return (
    <div className="site-canvas">
      <PageBanner
        title={`${cat.icon} ${name}`}
        subtitle={pickField(cat, 'description') || pickField(cat, 'tagline')}
        crumbs={[{ label: t('nav.services'), to: '/services' }, { label: name }]}
      />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tr" size={240} opacity={0.16} />
        <div className="container">
          <div className="glass flex items-center justify-between wrap gap-16 mb-24" style={{ padding: '16px 22px' }}>
            <span className="badge badge-purple">{cat.services.length} {t('services.available')}</span>
            <Link to="/book-appointment" className="btn btn-gold btn-sm">{t('services.bookConsult')} →</Link>
          </div>

          {cat.groups.map((g) => (
            <div className="group-block" key={g.id}>
              <h4>{pickField(g, 'name')}</h4>
              <div className="treat-grid">
                {g.services.map((s) => (
                  <Link key={s.id} to={`/services/${s.slug}`} className="treat-pill is-glass">
                    {pickField(s, 'name')}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {cat.groups.length === 0 && (
            <div className="treat-grid">
              {cat.services.map((s) => (
                <Link key={s.id} to={`/services/${s.slug}`} className="treat-pill is-glass">{pickField(s, 'name')}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band glass-sheen">
            <h2>{t('services.startConsult')}</h2>
            <p>{t('services.notSureText')}</p>
            <Link to="/book-appointment" className="btn btn-gold mt-16">{t('cta.book')} →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
