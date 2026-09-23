import { useEffect, useState } from 'react';
import { settingApi } from '../../api/endpoints';
import { Panel, Field, Toast, useToast } from '../../components/admin-ui';

/** Every tag the site can load, with the exact id format so nothing is pasted wrong. */
const TAGS = [
  {
    key: 'gtm_id', label: 'Google Tag Manager', icon: '🏷',
    placeholder: 'GTM-XXXXXXX',
    help: 'Container ID from tagmanager.google.com. Loads on every public page and receives every event through dataLayer.',
  },
  {
    key: 'ga4_id', label: 'Google Analytics 4', icon: '📈',
    placeholder: 'G-XXXXXXXXXX',
    help: 'GA4 Measurement ID. Leave empty if you already fire GA4 through GTM.',
  },
  {
    key: 'facebook_pixel_id', label: 'Meta (Facebook) Pixel', icon: '📘',
    placeholder: '1234567890123456',
    help: 'Pixel ID from Meta Events Manager. Bookings fire as a Lead event.',
  },
  {
    key: 'tiktok_pixel_id', label: 'TikTok Pixel', icon: '🎵',
    placeholder: 'CXXXXXXXXXXXXXXXXXXX',
    help: 'Pixel ID from TikTok Events Manager. Bookings fire as SubmitForm.',
  },
  {
    key: 'google_ads_id', label: 'Google Ads Conversion ID', icon: '🎯',
    placeholder: 'AW-123456789',
    help: 'Used together with the conversion label below to report booking conversions.',
  },
  {
    key: 'google_ads_conversion_label', label: 'Google Ads Conversion Label', icon: '🏁',
    placeholder: 'AbC-D_efGhIjKlMnOp',
    help: 'The label of your "Appointment booked" conversion action.',
  },
  {
    key: 'snapchat_pixel_id', label: 'Snapchat Pixel', icon: '👻',
    placeholder: '00000000-0000-0000-0000-000000000000',
    help: 'Snap Pixel ID from Snapchat Ads Manager.',
  },
  {
    key: 'linkedin_partner_id', label: 'LinkedIn Insight Tag', icon: '💼',
    placeholder: '1234567',
    help: 'Partner ID from LinkedIn Campaign Manager.',
  },
  {
    key: 'hotjar_id', label: 'Hotjar Site ID', icon: '🔥',
    placeholder: '1234567',
    help: 'Heatmaps and session recordings.',
  },
  {
    key: 'clarity_id', label: 'Microsoft Clarity', icon: '🔍',
    placeholder: 'abcdefghij',
    help: 'Free heatmaps and recordings from clarity.microsoft.com.',
  },
];

/** The events the site sends automatically, shown so marketers know what to build audiences on. */
const EVENTS = [
  ['page_view', 'Every page view', 'PageView', 'page'],
  ['appointment_booked', 'Booking form submitted', 'Lead', 'SubmitForm'],
  ['book_appointment_click', 'Any "Book Appointment" button click', 'InitiateCheckout', 'ClickButton'],
  ['service_view', 'A treatment page is opened', 'ViewContent', 'ViewContent'],
  ['contact_submitted', 'Contact form submitted', 'Contact', 'Contact'],
  ['newsletter_subscribe', 'Newsletter signup', 'Subscribe', 'Subscribe'],
  ['whatsapp_click', 'WhatsApp button click', 'Contact', '—'],
  ['call_click', 'Phone number click', 'Contact', '—'],
  ['social_click', 'Social media link click', 'custom', '—'],
];

export default function Tracking() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  useEffect(() => {
    settingApi.all()
      .then((r) => setValues(r.grouped.tracking || {}))
      .catch(() => show('Could not load tracking settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      await settingApi.save(values, 'tracking');
      show('Tracking settings saved. Reload the public site to load the new tags.');
    } catch (e) {
      show(e.response?.data?.message || 'Could not save', 'error');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  const activeCount = TAGS.filter((t) => values[t.key]?.trim()).length;

  return (
    <>
      <div className="alert alert-info">
        <strong>{activeCount} of {TAGS.length} tags configured.</strong>{' '}
        Paste an ID to switch a platform on, clear it to switch it off. Changes apply on the next page load of the public site — nothing needs redeploying.
      </div>

      <Panel
        title="Marketing Tags & Pixels"
        action={<button className="btn btn-purple btn-sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save All'}</button>}
      >
        <div className="admin-grid-3">
          {TAGS.map((t) => {
            const on = values[t.key]?.trim();
            return (
              <div key={t.key} style={{
                padding: 18, border: `1px solid ${on ? 'var(--purple-300)' : 'var(--line)'}`,
                borderRadius: 'var(--r)', background: on ? 'var(--purple-50)' : '#fff',
              }}>
                <div className="flex items-center justify-between mb-8">
                  <strong style={{ fontSize: '.92rem' }}>{t.icon} {t.label}</strong>
                  <span className={`badge ${on ? 'badge-green' : 'badge-gray'}`}>{on ? 'active' : 'off'}</span>
                </div>
                <input value={values[t.key] || ''} onChange={set(t.key)} placeholder={t.placeholder}
                       style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, outline: 'none' }} />
                <div className="hint">{t.help}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="admin-grid-2 mt-24">
        <Panel title="Events Sent Automatically" tight>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Event name</th><th>Fires when</th><th>Meta</th><th>TikTok</th></tr></thead>
              <tbody>
                {EVENTS.map(([name, when, fb, tt]) => (
                  <tr key={name}>
                    <td><code style={{ fontSize: '.78rem' }}>{name}</code></td>
                    <td style={{ fontSize: '.84rem' }}>{when}</td>
                    <td><span className="badge badge-purple">{fb}</span></td>
                    <td><span className="badge badge-gray">{tt}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div>
          <Panel title="First-Party Analytics">
            <Field
              label="Internal visit tracking"
              hint="Records page views, sessions, devices, referrers and UTM campaigns into your own database. This is what powers the Analytics and Realtime pages."
            >
              <select
                value={values.internal_analytics_enabled ?? '1'}
                onChange={set('internal_analytics_enabled')}
              >
                <option value="1">Enabled</option>
                <option value="0">Disabled</option>
              </select>
            </Field>
          </Panel>

          <Panel title="Custom Scripts" >
            <Field
              label="Extra head scripts"
              hint="Any additional verification or tracking snippet. Paste the complete <script> tag. Only add code from sources you trust — it runs on every public page."
            >
              <textarea
                rows={7} value={values.head_scripts || ''} onChange={set('head_scripts')}
                placeholder="<!-- e.g. a search console verification meta or a partner tag -->"
                style={{ fontFamily: 'monospace', fontSize: '.82rem' }}
              />
            </Field>
            <button className="btn btn-purple btn-sm" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save All Settings'}
            </button>
          </Panel>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
