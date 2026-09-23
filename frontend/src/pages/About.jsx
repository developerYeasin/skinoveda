import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { PageBanner, SectionHead } from '../components/ui';
import { Photo, Blossom } from '../components/Art';

const VALUES = [
  ['🌿', 'why.natural', 'why.naturalText'],
  ['✨', 'why.advanced', 'why.advancedText'],
  ['🪷', 'why.ayurvedic', 'why.ayurvedicText'],
  ['💜', 'why.personal', 'why.personalText'],
  ['🩺', 'why.holistic', 'why.holisticText'],
];

const SPACES = [
  ['🏛', 'clinic.reception'],
  ['🩺', 'clinic.consultRoom'],
  ['✨', 'clinic.laserRoom'],
  ['🌿', 'clinic.ayurvedaRoom'],
  ['🪷', 'clinic.therapyRoom'],
];

export default function About() {
  const { settings, categories } = useSite();
  const { t, pickField } = useLang();

  return (
    <div className="site-canvas">
      <PageBanner title={t('about.title')} subtitle={t('about.sub')} crumbs={[{ label: t('nav.about') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tr" size={250} opacity={0.16} />
        <div className="container">
          <div className="split">
            <div className="glass glass-sheen" style={{ padding: 34 }}>
              <span className="eyebrow">{t('about.eyebrow')}</span>
              <h2>{t('about.heading')}</h2>
              <p className="lead">{t('about.p1')}</p>
              <p className="muted">{t('about.p2')}</p>
              <p className="muted">{t('about.p3')}</p>
              <div className="flex gap-12 wrap mt-24">
                <Link to="/services" className="btn btn-purple">{t('hero.ctaPrimary')} →</Link>
                <Link to="/our-team" className="btn btn-outline">{t('about.meetTeam')}</Link>
              </div>
            </div>
            <div className="split-visual">
              <Photo src={settings.about_image} icon="🪷" alt={t('about.title')} tone="purple" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <SectionHead eyebrow={t('about.values')} title={t('why.title')} />
          <div className="grid grid-5">
            {VALUES.map(([icon, titleKey, textKey]) => (
              <div className="why-card is-glass" key={titleKey}>
                <div className="ico">{icon}</div>
                <h3>{t(titleKey)}</h3>
                <p>{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHead light eyebrow={t('nav.specialities')} title={t('about.specialitiesTitle')} />
          <div className="grid grid-3">
            {categories.map((c) => (
              <Link key={c.id} to={`/services/category/${c.slug}`} className="glass-dark glass-sheen glass-hover"
                    style={{ padding: 26, display: 'block' }}>
                <div style={{ fontSize: '1.9rem', marginBottom: 10 }}>{c.icon}</div>
                <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>{pickField(c, 'name')}</h3>
                <p style={{ color: 'rgba(255,255,255,.74)', fontSize: '.88rem', margin: 0 }}>{pickField(c, 'tagline')}</p>
                <p style={{ color: 'var(--gold-400)', fontSize: '.82rem', marginTop: 10, marginBottom: 0 }}>
                  {c.service_count} {t('services.treatments')} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow={t('about.spacesEyebrow')} title={t('clinic.title')} text={t('clinic.text')} />
          <div className="grid grid-3">
            {SPACES.map(([icon, key]) => (
              <div className="glass glass-hover glass-sheen" key={key} style={{ padding: 26 }}>
                <div style={{ fontSize: '1.9rem', marginBottom: 10 }}>{icon}</div>
                <h3 style={{ fontSize: '1.15rem' }}>{t(key)}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band glass-sheen">
            <h2>{t('cta.eyebrow')}</h2>
            <p>{t('cta.text')}</p>
            <div className="flex gap-12 wrap mt-16" style={{ justifyContent: 'center' }}>
              <Link to="/book-appointment" className="btn btn-gold">{t('cta.book')} →</Link>
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone}`} className="btn btn-outline-light">
                  {t('cta.call')} {settings.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
