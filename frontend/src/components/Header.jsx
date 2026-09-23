import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { trackEvent } from '../api/tracking';
import LanguageSwitch from './LanguageSwitch';
import { Icon } from './Icons';

const NAV = [
  ['/', 'nav.home'],
  ['/about', 'nav.about'],
  ['/services', 'nav.services', true],
  ['/our-team', 'nav.team'],
  ['/gallery', 'nav.gallery'],
  ['/blog', 'nav.blog'],
  ['/contact', 'nav.contact'],
];

export default function Header() {
  const { categories } = useSite();
  const { t, pickField } = useLang();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  const solid = scrolled || pathname !== '/';

  return (
    <>
      <header className={`site-header ${solid ? 'solid' : 'transparent'}`}>
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img src="/logo.svg" alt="Skinoveda" />
            <span className="brand-text">
              <strong>{t('hero.brand')}</strong>
              <span>{t('hero.brandSub')}</span>
            </span>
          </Link>

          <nav className="main-nav">
            {NAV.map(([to, key, mega]) =>
              mega ? (
                <div className="nav-item" key={to}>
                  <NavLink to={to} className="nav-trigger">
                    {t(key)} <span style={{ fontSize: '.7rem' }}>▾</span>
                  </NavLink>
                  <div className="mega">
                    {categories.map((c) => (
                      <Link key={c.id} to={`/services/category/${c.slug}`}>
                        <span className="ico">{c.icon}</span>
                        <span>
                          <strong>{pickField(c, 'name')}</strong>
                          <small>{c.service_count || 0} {t('nav.treatments')}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <NavLink key={to} to={to} end={to === '/'}>{t(key)}</NavLink>
              )
            )}
          </nav>

          <div className="header-actions">
            <div className="header-icons">
              <button onClick={() => navigate('/services')} aria-label="Search" title="Search">
                <Icon name="search" size={19} />
              </button>
              <Link to="/contact" aria-label={t('nav.contact')} title={t('nav.contact')}>
                <Icon name="phone" size={19} />
              </Link>
            </div>

            <LanguageSwitch />

            <Link
              to="/book-appointment" className="btn btn-gold btn-sm"
              onClick={() => trackEvent('book_appointment_click', { label: 'header' })}
            >
              <Icon name="calendar" size={16} /> {t('nav.book')}
            </Link>

            <button className="burger" onClick={() => setDrawer(true)} aria-label={t('nav.menu')}>☰</button>
          </div>
        </div>
      </header>

      <div className={`mobile-drawer ${drawer ? 'open' : ''}`}>
        <div className="flex items-center justify-between mb-24">
          <span className="brand-text"><strong>{t('hero.brand')}</strong></span>
          <button className="close" onClick={() => setDrawer(false)} aria-label="Close">×</button>
        </div>

        <div className="mb-24"><LanguageSwitch /></div>

        {NAV.map(([to, key]) => <Link key={to} to={to}>{t(key)}</Link>)}

        <div style={{ paddingTop: 12 }}>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', margin: '18px 0 4px' }}>
            {t('nav.specialities')}
          </p>
          {categories.map((c) => (
            <Link key={c.id} to={`/services/category/${c.slug}`}>{c.icon} {pickField(c, 'name')}</Link>
          ))}
        </div>

        <Link to="/book-appointment" className="btn btn-gold btn-block mt-24">{t('nav.book')} →</Link>
      </div>
    </>
  );
}
