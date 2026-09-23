import { useSite } from '../context/SiteContext';
import { trackEvent } from '../api/tracking';

export default function FloatingActions() {
  const { settings } = useSite();
  const wa = (settings.whatsapp || '').replace(/[^\d]/g, '');
  const phone = settings.contact_phone;

  return (
    <div className="float-actions">
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
