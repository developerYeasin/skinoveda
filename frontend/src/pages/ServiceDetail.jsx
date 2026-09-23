import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { serviceApi } from '../api/endpoints';
import { useLang } from '../i18n';
import { trackEvent } from '../api/tracking';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Photo, Blossom } from '../components/Art';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t, pickField } = useLang();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    serviceApi.get(slug)
      .then((s) => {
        setService(s);
        document.title = `${s.name} | Skinoveda`;
        trackEvent('service_view', { label: s.name, category: s.category_name });
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
    return () => { document.title = 'Skinoveda'; };
  }, [slug]);

  if (loading) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('common.loading')} />
        <section className="section"><div className="container"><Skeleton h={320} /></div></section>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('common.serviceNotFound')} crumbs={[{ label: t('nav.services'), to: '/services' }]} />
        <section className="section">
          <div className="container">
            <EmptyState icon="✦" title={t('common.serviceNotFound')} />
            <div className="text-center mt-24"><Link to="/services" className="btn btn-purple">{t('common.allServices')} →</Link></div>
          </div>
        </section>
      </div>
    );
  }

  const name = pickField(service, 'name');
  const benefits = (pickField(service, 'benefits') || '').split('\n').filter(Boolean);

  return (
    <div className="site-canvas">
      <PageBanner
        title={name}
        subtitle={pickField(service, 'short_description')}
        crumbs={[
          { label: t('nav.services'), to: '/services' },
          { label: pickField(service, 'category_name'), to: `/services/category/${service.category_slug}` },
          { label: name },
        ]}
      />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tl" size={230} opacity={0.15} />
        <div className="container">
          <div className="split">
            <div className="glass glass-sheen" style={{ padding: 32 }}>
              <span className="eyebrow">{service.category_icon} {pickField(service, 'category_name')}</span>
              <h2>{t('services.about')}</h2>
              <p className="lead">{pickField(service, 'description')}</p>

              {benefits.length > 0 && (
                <>
                  <h3 className="mt-24">{t('services.benefits')}</h3>
                  <ul className="treatment-list">{benefits.map((b) => <li key={b}>{b}</li>)}</ul>
                </>
              )}

              <div className="flex gap-12 wrap mt-24">
                <Link
                  to={`/book-appointment?service=${service.id}`} className="btn btn-gold"
                  onClick={() => trackEvent('book_appointment_click', { label: service.name })}
                >
                  {t('services.bookThis')} →
                </Link>
                <Link to="/contact" className="btn btn-outline">{t('services.askQuestion')}</Link>
              </div>
            </div>

            <div>
              <div className="split-visual" style={{ aspectRatio: '1/1' }}>
                <Photo src={service.image} icon={service.category_icon} alt={name} tone="purple" />
              </div>

              <div className="glass glass-sheen mt-24" style={{ padding: 26 }}>
                <h3 style={{ fontSize: '1.1rem' }}>{t('services.details')}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                  {service.group_name && (
                    <li className="flex justify-between gap-12">
                      <span className="muted">{t('services.programme')}</span><strong>{pickField(service, 'group_name')}</strong>
                    </li>
                  )}
                  {service.duration && (
                    <li className="flex justify-between gap-12">
                      <span className="muted">{t('services.duration')}</span><strong>{service.duration}</strong>
                    </li>
                  )}
                  <li className="flex justify-between gap-12">
                    <span className="muted">{t('services.price')}</span>
                    <strong>{service.price ? `৳ ${Number(service.price).toLocaleString()}` : t('services.onConsult')}</strong>
                  </li>
                  {service.price_note && <li className="muted" style={{ fontSize: '.82rem' }}>{service.price_note}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {service.related?.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <h2 className="text-center mb-24">{t('services.related')}</h2>
            <div className="treat-grid">
              {service.related.map((r) => (
                <Link key={r.id} to={`/services/${r.slug}`} className="treat-pill is-glass">{pickField(r, 'name')}</Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
