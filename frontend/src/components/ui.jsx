import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { Photo, Blossom } from './Art';

export function PageBanner({ title, subtitle, crumbs = [] }) {
  const { t } = useLang();
  return (
    <section className="page-banner is-glass">
      <Blossom style={{ top: -40, left: -50 }} size={230} opacity={0.42} />
      <Blossom style={{ bottom: -50, right: -40 }} size={200} opacity={0.34} />
      <div className="container">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {crumbs.length > 0 && (
          <div className="crumbs">
            <Link to="/">{t('common.home')}</Link>
            {crumbs.map((c, i) => (
              <span key={i}> / {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, text, light }) {
  return (
    <div className="section-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 style={light ? { color: '#fff' } : undefined}>{title}</h2>
      {text && <p style={light ? { color: 'rgba(255,255,255,.78)' } : undefined}>{text}</p>}
    </div>
  );
}

export function ServiceCard({ service }) {
  const { t, pickField } = useLang();
  return (
    <Link to={`/services/${service.slug}`} className="service-card is-glass">
      <div className="thumb">
        <Photo src={service.image || service.category_image} icon={service.category_icon || '✦'} alt={pickField(service, 'name')} tone="purple" />
      </div>
      <div className="body">
        {service.category_name && <span className="badge badge-gold mb-8">{pickField(service, 'category_name')}</span>}
        <h3>{pickField(service, 'name')}</h3>
        <p>{pickField(service, 'short_description')}</p>
        <span className="go">{t('services.explore')} →</span>
      </div>
    </Link>
  );
}

export function CategoryCard({ category }) {
  const { t, pickField } = useLang();
  return (
    <Link to={`/services/category/${category.slug}`} className="service-card is-glass">
      <div className="thumb">
        <Photo src={category.image} icon={category.icon} alt={pickField(category, 'name')} tone="purple" />
        <span className="badge badge-gold service-count">
          {category.service_count || category.total_services || 0} {t('services.treatments')}
        </span>
      </div>
      <div className="body">
        <h3>{category.icon} {pickField(category, 'name')}</h3>
        <p>{pickField(category, 'description') || pickField(category, 'tagline')}</p>
        <span className="go">{t('services.explore')} →</span>
      </div>
    </Link>
  );
}

export function Testimonial({ item, glass = true }) {
  const { t } = useLang();
  return (
    <div className={`testimonial ${glass ? 'is-glass' : ''}`}>
      <div className="stars">{'★'.repeat(item.rating || 5)}</div>
      <blockquote>“{item.message}”</blockquote>
      <div className="who">
        <div className="avatar">
          <Photo src={item.photo} icon={item.client_name?.[0] || '🙂'} tone="purple" />
        </div>
        <div>
          <strong>{item.client_name}</strong>
          <small>{item.service_name || item.client_title || t('testimonials.client')}</small>
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ h = 200, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 20 }} />
      ))}
    </>
  );
}

export function EmptyState({ icon = '✦', title, text }) {
  return (
    <div className="text-center glass" style={{ padding: '60px 24px' }}>
      <div style={{ fontSize: '2.6rem', marginBottom: 12 }}>{icon}</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
    </div>
  );
}
