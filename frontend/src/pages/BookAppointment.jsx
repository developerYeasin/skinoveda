import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appointmentApi, serviceApi, teamApi } from '../api/endpoints';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { trackEvent, getTrackingIds } from '../api/tracking';
import { PageBanner } from '../components/ui';
import { Blossom, Lotus } from '../components/Art';

const TIMES = {
  en: ['10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'],
  bn: ['সকাল ১০টা - দুপুর ১২টা', 'দুপুর ১২টা - ২টা', 'দুপুর ২টা - বিকেল ৪টা', 'বিকেল ৪টা - সন্ধ্যা ৬টা', 'সন্ধ্যা ৬টা - রাত ৮টা'],
};

const EMPTY = {
  name: '', phone: '', email: '', gender: 'female', age: '',
  category_id: '', service_id: '', doctor_id: '',
  preferred_date: '', preferred_time: '', message: '',
};

export default function BookAppointment() {
  const { categories, settings } = useSite();
  const { t, lang, pickField } = useLang();
  const [params] = useSearchParams();
  const [form, setForm] = useState(EMPTY);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState({ busy: false, error: '', done: null });

  useEffect(() => { teamApi.list({ limit: 20 }).then((r) => setDoctors(r.data || [])).catch(() => {}); }, []);

  useEffect(() => {
    const id = params.get('service');
    if (!id) return;
    serviceApi.get(id)
      .then((s) => setForm((f) => ({ ...f, category_id: String(s.category_id), service_id: String(s.id) })))
      .catch(() => {});
  }, [params]);

  useEffect(() => {
    if (!form.category_id) { setServices([]); return; }
    serviceApi.list({ category: form.category_id, limit: 400 })
      .then((r) => setServices(r.data || []))
      .catch(() => setServices([]));
  }, [form.category_id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: '', done: null });
    try {
      const payload = { ...form, ...getTrackingIds() };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      const res = await appointmentApi.book(payload);
      trackEvent('appointment_booked', { label: res.booking_code, category: 'conversion', service_id: form.service_id });
      setStatus({ busy: false, error: '', done: res });
      setForm(EMPTY);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } catch (err) {
      setStatus({ busy: false, error: err.response?.data?.message || t('book.error'), done: null });
    }
  };

  const times = TIMES[lang] || TIMES.en;

  return (
    <div className="site-canvas">
      <PageBanner title={t('book.title')} subtitle={t('book.sub')} crumbs={[{ label: t('nav.book') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tl" size={250} opacity={0.15} />
        <Blossom className="ambient-blossom br" size={220} opacity={0.14} />

        <div className="container">
          <div className="split" style={{ gridTemplateColumns: '1.35fr .65fr' }}>
            <div className="glass glass-sheen glass-form" style={{ padding: 'clamp(22px, 3vw, 36px)' }}>
              {status.done ? (
                <div className="text-center" style={{ padding: '30px 10px' }}>
                  <div className="flex" style={{ justifyContent: 'center' }}><Lotus size={56} /></div>
                  <h2>{t('book.received')}</h2>
                  <p className="lead">{status.done.message}</p>
                  <div className="alert alert-info" style={{ display: 'inline-block' }}>
                    {t('book.bookingCode')}: <strong>{status.done.booking_code}</strong>
                  </div>
                  <div className="flex gap-12 wrap mt-16" style={{ justifyContent: 'center' }}>
                    <Link to="/" className="btn btn-purple">{t('book.backHome')}</Link>
                    <button className="btn btn-outline" onClick={() => setStatus({ busy: false, error: '', done: null })}>
                      {t('book.bookAnother')}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <h2 style={{ fontSize: '1.7rem' }}>{t('book.yourDetails')}</h2>
                  {status.error && <div className="alert alert-error">{status.error}</div>}

                  <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
                    <div className="field">
                      <label>{t('book.name')} *</label>
                      <input required value={form.name} onChange={set('name')} placeholder={t('book.namePlaceholder')} />
                    </div>
                    <div className="field">
                      <label>{t('book.phone')} *</label>
                      <input required value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
                    </div>
                    <div className="field">
                      <label>{t('book.email')}</label>
                      <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                    </div>
                    <div className="field">
                      <label>{t('book.gender')}</label>
                      <select value={form.gender} onChange={set('gender')}>
                        <option value="female">{t('book.female')}</option>
                        <option value="male">{t('book.male')}</option>
                        <option value="other">{t('book.other')}</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>{t('book.age')}</label>
                      <input type="number" min="1" max="120" value={form.age} onChange={set('age')} />
                    </div>
                    <div className="field">
                      <label>{t('book.doctor')}</label>
                      <select value={form.doctor_id} onChange={set('doctor_id')}>
                        <option value="">{t('book.noPreference')}</option>
                        {doctors.map((d) => <option key={d.id} value={d.id}>{pickField(d, 'name')}</option>)}
                      </select>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginTop: 14 }}>{t('book.forWhat')}</h3>
                  <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
                    <div className="field">
                      <label>{t('book.speciality')}</label>
                      <select value={form.category_id} onChange={set('category_id')}>
                        <option value="">{t('book.selectSpeciality')}</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {pickField(c, 'name')}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>{t('book.treatment')}</label>
                      <select value={form.service_id} onChange={set('service_id')} disabled={!services.length}>
                        <option value="">
                          {form.category_id ? t('book.selectTreatment') : t('book.chooseSpecialityFirst')}
                        </option>
                        {services.map((s) => <option key={s.id} value={s.id}>{pickField(s, 'name')}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>{t('book.date')}</label>
                      <input type="date" min={new Date().toISOString().slice(0, 10)}
                             value={form.preferred_date} onChange={set('preferred_date')} />
                    </div>
                    <div className="field">
                      <label>{t('book.time')}</label>
                      <select value={form.preferred_time} onChange={set('preferred_time')}>
                        <option value="">{t('book.anyTime')}</option>
                        {times.map((tm) => <option key={tm} value={tm}>{tm}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>{t('book.concern')}</label>
                    <textarea value={form.message} onChange={set('message')} placeholder={t('book.concernPlaceholder')} />
                  </div>

                  <button className="btn btn-gold btn-block" disabled={status.busy}>
                    {status.busy ? t('book.submitting') : `${t('book.submit')} →`}
                  </button>
                  <p className="hint text-center mt-8">{t('book.privacy')}</p>
                </form>
              )}
            </div>

            <div>
              <div className="glass glass-sheen" style={{ padding: 26 }}>
                <h3 style={{ fontSize: '1.15rem' }}>{t('book.visitUs')}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14, fontSize: '.92rem' }}>
                  <li>📍 {settings.contact_address}</li>
                  {settings.contact_phone && <li>📞 <a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a></li>}
                  {settings.contact_email && <li>✉ <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>}
                  {settings.opening_hours && <li>🕐 {settings.opening_hours}</li>}
                </ul>
              </div>

              <div className="glass-gold glass-sheen mt-24" style={{ padding: 26 }}>
                <h3 style={{ fontSize: '1.15rem' }}>{t('book.whatNext')}</h3>
                <ol style={{ paddingLeft: 18, margin: 0, color: 'var(--muted)', fontSize: '.9rem', display: 'grid', gap: 10 }}>
                  <li>{t('book.step1')}</li>
                  <li>{t('book.step2')}</li>
                  <li>{t('book.step3')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
