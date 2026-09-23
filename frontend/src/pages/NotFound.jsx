import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { Blossom } from '../components/Art';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="site-canvas" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', position: 'relative' }}>
      <Blossom style={{ top: 80, left: -40 }} size={240} opacity={0.2} />
      <Blossom style={{ bottom: 60, right: -40 }} size={220} opacity={0.18} />
      <div className="container" style={{ maxWidth: 560, paddingTop: 100 }}>
        <div className="glass glass-sheen text-center" style={{ padding: 48 }}>
          <div style={{ fontSize: '3.4rem' }}>🪷</div>
          <h1 style={{ fontSize: '4rem', marginBottom: 0 }} className="gold-text">404</h1>
          <h2>{t('common.notFound')}</h2>
          <p className="muted">{t('common.notFoundText')}</p>
          <div className="flex gap-12 wrap mt-24" style={{ justifyContent: 'center' }}>
            <Link to="/" className="btn btn-purple">{t('common.backHome')}</Link>
            <Link to="/services" className="btn btn-outline">{t('common.browseServices')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
