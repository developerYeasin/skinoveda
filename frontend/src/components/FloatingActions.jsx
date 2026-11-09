import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { trackEvent } from '../api/tracking';

const SHOW_AFTER_PX = 400;

export default function FloatingActions() {
  const { settings } = useSite();
  const { t } = useLang();
  const [showTop, setShowTop] = useState(false);
  const wa = (settings.whatsapp || '').replace(/[^\d]/g, '');
  const phone = settings.contact_phone;

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="float-actions">
      {showTop && (
        <button type="button" className="float-btn top" aria-label={t('common.backToTop')} title={t('common.backToTop')} onClick={scrollToTop}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
      {wa && (
        <a
          className="float-btn wa" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"
          aria-label="Chat on WhatsApp"
          onClick={() => trackEvent('whatsapp_click', { label: 'float' })}
        >✆</a>
      )}
      {phone && (
        <a
          className="float-btn call" href={`tel:${phone}`} aria-label="Call us"
          onClick={() => trackEvent('call_click', { label: 'float' })}
        >☎</a>
      )}
    </div>
  );
}
