import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { subscriberApi } from '../api/endpoints';
import { trackEvent } from '../api/tracking';

export default function Footer() {
  const { settings, categories } = useSite();
  const { t, pickField } = useLang();
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ msg: '', ok: false, busy: false });

  const subscribe = async (e) => {
    e.preventDefault();
    setState({ msg: '', ok: false, busy: true });
    try {
      const r = await subscriberApi.subscribe(email);
      trackEvent('newsletter_subscribe', { label: 'footer' });
      setState({ msg: r.message, ok: true, busy: false });
      setEmail('');
    } catch (err) {
      setState({ msg: err.response?.data?.message || 'Could not subscribe', ok: false, busy: false });
    }
  };

  const social = [['facebook', 'f'], ['instagram', '◎'], ['youtube', '▶'], ['tiktok', '♪'], ['linkedin', 'in']]
    .filter(([k]) => settings[k]);

  const NAV = [
    ['/', 'nav.home'], ['/about', 'nav.about'], ['/services', 'nav.services'],
    ['/our-team', 'nav.team'], ['/gallery', 'nav.gallery'], ['/blog', 'nav.blog'], ['/contact', 'nav.contact'],
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 16 }}>
              <img src="/logo.svg" alt="" style={{ width: 42 }} />
              <span className="brand-text">
                <strong>{t('hero.brand')}</strong>
                <span>{t('hero.brandSub')}</span>
              </span>
            </div>
            <p style={{ fontSize: '.9rem' }}>{t('footer.desc')}</p>
            {social.length > 0 && (
              <div className="socials">
                {social.map(([k, icon]) => (
                  <a key={k} href={settings[k]} target="_blank" rel="noreferrer" aria-label={k}
                     onClick={() => trackEvent('social_click', { label: k })}>{icon}</a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4>{t('footer.quickLinks')}</h4>
            <ul>{NAV.map(([to, key]) => <li key={to}><Link to={to}>{t(key)}</Link></li>)}</ul>
          </div>

          <div>
            <h4>{t('footer.ourServices')}</h4>
            <ul>
              {categories.map((c) => (
                <li key={c.id}><Link to={`/services/category/${c.slug}`}>{pickField(c, 'name')}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{t('footer.contactUs')}</h4>
            <ul>
              <li>📍 {settings.contact_address}</li>
              {settings.contact_phone && (
                <li>📞 <a href={`tel:${settings.contact_phone}`} onClick={() => trackEvent('call_click', { label: 'footer' })}>{settings.contact_phone}</a></li>
              )}
              {settings.contact_email && <li>✉ <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>}
              {settings.opening_hours && <li>🕐 {settings.opening_hours}</li>}
            </ul>

            <h4 style={{ marginTop: 26 }}>{t('footer.newsletter')}</h4>
            <p style={{ fontSize: '.82rem' }}>{t('footer.newsletterText')}</p>
            <form className="newsletter" onSubmit={subscribe}>
              <input type="email" required placeholder={t('footer.emailPlaceholder')}
                     value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-gold btn-sm" disabled={state.busy}>
                {state.busy ? '…' : t('footer.subscribe')}
              </button>
            </form>
            {state.msg && (
              <p style={{ fontSize: '.8rem', marginTop: 8, color: state.ok ? '#8ADCA6' : '#F3A8A8' }}>{state.msg}</p>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {t('hero.brand')}. {t('footer.rights')}</span>
          <span>{t('footer.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
