import { useState } from 'react';
import { Link } from 'react-router-dom';
import { contactApi } from '../api/endpoints';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { trackEvent } from '../api/tracking';
import { PageBanner } from '../components/ui';
import { Blossom } from '../components/Art';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const { settings } = useSite();
  const { t } = useLang();
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ busy: false, msg: '', ok: false });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, msg: '', ok: false });
    try {
      const r = await contactApi.send(form);
      trackEvent('contact_submitted', { label: form.subject || 'general' });
      setState({ busy: false, msg: r.message, ok: true });
      setForm(EMPTY);
    } catch (err) {
      setState({ busy: false, msg: err.response?.data?.message || t('book.error'), ok: false });
    }
  };

  const CARDS = [
    ['📍', t('contact.visit'), settings.contact_address],
    ['📞', t('contact.call'), settings.contact_phone],
    ['✉', t('contact.emailLabel'), settings.contact_email],
    ['🕐', t('contact.hours'), settings.opening_hours],
  ];

  return (
    <div className="site-canvas">
      <PageBanner title={t('contact.title')} subtitle={t('contact.sub')} crumbs={[{ label: t('nav.contact') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tl" size={240} opacity={0.15} />
        <div className="container">
          <div className="split">
            <div>
              <span className="eyebrow">{t('contact.eyebrow')}</span>
              <h2>{t('contact.heading')}</h2>
              <p className="lead">{t('contact.lead')}</p>

              <div className="grid grid-2 mt-24" style={{ gap: 16 }}>
                {CARDS.map(([icon, label, value]) => value && (
                  <div className="glass glass-hover glass-sheen" key={label} style={{ padding: 22 }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
                    <h3 style={{ fontSize: '1rem' }}>{label}</h3>
                    <p className="muted" style={{ fontSize: '.88rem', margin: 0 }}>
                      {label === t('contact.call') ? (
                        <a href={`tel:${value}`} onClick={() => trackEvent('call_click', { label: 'contact_page' })}>{value}</a>
                      ) : label === t('contact.emailLabel') ? (
                        <a href={`mailto:${value}`}>{value}</a>
                      ) : value}
                    </p>
                  </div>
                ))}
              </div>

              <Link to="/book-appointment" className="btn btn-gold mt-24">{t('cta.book')} →</Link>
            </div>

            <div className="glass glass-sheen glass-form" style={{ padding: 32 }}>
              <h2 style={{ fontSize: '1.6rem' }}>{t('contact.sendMessage')}</h2>
              {state.msg && <div className={`alert ${state.ok ? 'alert-success' : 'alert-error'}`}>{state.msg}</div>}
              <form onSubmit={submit}>
                <div className="field">
                  <label>{t('contact.yourName')} *</label>
                  <input required value={form.name} onChange={set('name')} />
                </div>
                <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
                  <div className="field">
                    <label>{t('book.email')}</label>
                    <input type="email" value={form.email} onChange={set('email')} />
                  </div>
                  <div className="field">
                    <label>{t('book.phone')}</label>
                    <input value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
                <div className="field">
                  <label>{t('contact.subject')}</label>
                  <input value={form.subject} onChange={set('subject')} placeholder={t('contact.subjectPlaceholder')} />
                </div>
                <div className="field">
                  <label>{t('contact.message')} *</label>
                  <textarea required value={form.message} onChange={set('message')} />
                </div>
                <button className="btn btn-purple btn-block" disabled={state.busy}>
                  {state.busy ? t('contact.sending') : `${t('contact.send')} →`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="glass" style={{ overflow: 'hidden', padding: 8 }}>
            <iframe
              title="Skinoveda location"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.contact_address || 'Dhanmondi, Dhaka')}&output=embed`}
              style={{ width: '100%', height: 380, border: 0, borderRadius: 'var(--r)' }}
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
