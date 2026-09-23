/**
 * Skinoveda tracking layer.
 * Loads third-party tags (GTM, GA4, Meta Pixel, TikTok, Google Ads, Snapchat,
 * LinkedIn, Hotjar, Clarity) from admin-managed settings, and records
 * first-party page views / events into our own analytics tables.
 */
import api from './client';

const VISITOR_KEY = 'skv_visitor_id';
const SESSION_KEY = 'skv_session_id';

const uid = () =>
  (crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`).replace(/-/g, '').slice(0, 32);

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = uid();
    localStorage.setItem(VISITOR_KEY, id);
    sessionStorage.setItem('skv_new_visitor', '1');
  }
  return id;
}

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uid();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/* ---------------- third-party tag loading ---------------- */

let loaded = false;
let config = {};

function inject(src, attrs = {}) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
  return s;
}

function runInline(code) {
  const s = document.createElement('script');
  s.text = code;
  document.head.appendChild(s);
}

function loadGTM(id) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  inject(`https://www.googletagmanager.com/gtm.js?id=${id}`);

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(noscript);
}

function loadGtag(id) {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    inject(`https://www.googletagmanager.com/gtag/js?id=${id}`);
    window.gtag('js', new Date());
  }
  window.gtag('config', id, { send_page_view: false });
}

function loadMetaPixel(id) {
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
}

function loadTikTok(id) {
  /* eslint-disable */
  !(function (w, d, t) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
    ttq.methods = ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
    ttq.setAndDefer = function (obj, m) { obj[m] = function () { obj.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id) { var e = ttq._i[id] || []; for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e, n) {
      var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = r + '?sdkid=' + e + '&lib=' + t;
      var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a);
    };
    ttq.load(id);
  })(window, document, 'ttq');
  /* eslint-enable */
}

function loadSnapchat(id) {
  /* eslint-disable */
  (function (e, t, n) {
    if (e.snaptr) return; var a = e.snaptr = function () { a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments); };
    a.queue = []; var s = 'script'; var r = t.createElement(s); r.async = !0; r.src = n;
    var u = t.getElementsByTagName(s)[0]; u.parentNode.insertBefore(r, u);
  })(window, document, 'https://sc-static.net/scevent.min.js');
  /* eslint-enable */
  window.snaptr('init', id);
}

function loadLinkedIn(id) {
  window._linkedin_partner_id = id;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(id);
  inject('https://snap.licdn.com/li.lms-analytics/insight.min.js');
}

function loadHotjar(id) {
  runInline(`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${id},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`);
}

function loadClarity(id) {
  runInline(`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");`);
}

/** Loads every configured tag. Call once at app boot. */
export async function initTracking() {
  if (loaded) return config;
  loaded = true;
  try {
    const { data } = await api.get('/settings/tracking');
    config = data || {};
  } catch {
    config = {};
  }

  const has = (k) => config[k] && String(config[k]).trim() !== '';

  if (has('gtm_id')) loadGTM(config.gtm_id.trim());
  if (has('ga4_id')) loadGtag(config.ga4_id.trim());
  if (has('google_ads_id')) loadGtag(config.google_ads_id.trim());
  if (has('facebook_pixel_id')) loadMetaPixel(config.facebook_pixel_id.trim());
  if (has('tiktok_pixel_id')) loadTikTok(config.tiktok_pixel_id.trim());
  if (has('snapchat_pixel_id')) loadSnapchat(config.snapchat_pixel_id.trim());
  if (has('linkedin_partner_id')) loadLinkedIn(config.linkedin_partner_id.trim());
  if (has('hotjar_id')) loadHotjar(config.hotjar_id.trim());
  if (has('clarity_id')) loadClarity(config.clarity_id.trim());
  if (has('head_scripts')) {
    const holder = document.createElement('div');
    holder.innerHTML = config.head_scripts;
    [...holder.querySelectorAll('script')].forEach((old) => {
      const s = document.createElement('script');
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.text = old.text;
      document.head.appendChild(s);
    });
  }

  return config;
}

/* ---------------- page views ---------------- */

let currentViewId = null;
let enteredAt = Date.now();

function utm() {
  const p = new URLSearchParams(location.search);
  return {
    utm_source: p.get('utm_source') || undefined,
    utm_medium: p.get('utm_medium') || undefined,
    utm_campaign: p.get('utm_campaign') || undefined,
  };
}

export async function trackPageView(path, title) {
  // flush the previous page's time-on-page
  flushDuration();

  // third-party page views
  window.dataLayer?.push({ event: 'page_view', page_path: path, page_title: title });
  if (config.ga4_id && window.gtag) window.gtag('event', 'page_view', { page_path: path, page_title: title });
  window.fbq?.('track', 'PageView');
  window.ttq?.page?.();
  window.snaptr?.('track', 'PAGE_VIEW');

  // first-party
  const isNew = sessionStorage.getItem('skv_new_visitor') === '1';
  if (isNew) sessionStorage.removeItem('skv_new_visitor');

  try {
    const { data } = await api.post('/analytics/track', {
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      path,
      page_title: title || document.title,
      referrer: document.referrer,
      is_new_visitor: isNew,
      ...utm(),
    });
    currentViewId = data.view_id || null;
    enteredAt = Date.now();
  } catch { /* analytics must never break the page */ }
}

export function flushDuration() {
  if (!currentViewId) return;
  const duration = Math.round((Date.now() - enteredAt) / 1000);
  const id = currentViewId;
  currentViewId = null;
  if (duration < 1) return;
  const body = JSON.stringify({ view_id: id, duration });
  const url = `${api.defaults.baseURL}/analytics/duration`;
  if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  else api.post('/analytics/duration', { view_id: id, duration }).catch(() => {});
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushDuration);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushDuration(); });
}

/* ---------------- custom events ---------------- */

/** Maps our event names onto each platform's standard event. */
const STANDARD = {
  appointment_booked: { fb: 'Lead', tt: 'SubmitForm', snap: 'SIGN_UP' },
  book_appointment_click: { fb: 'InitiateCheckout', tt: 'ClickButton' },
  contact_submitted: { fb: 'Contact', tt: 'Contact' },
  newsletter_subscribe: { fb: 'Subscribe', tt: 'Subscribe' },
  whatsapp_click: { fb: 'Contact' },
  call_click: { fb: 'Contact' },
  service_view: { fb: 'ViewContent', tt: 'ViewContent' },
};

export function trackEvent(name, params = {}) {
  const map = STANDARD[name] || {};

  window.dataLayer?.push({ event: name, ...params });
  if (window.gtag) window.gtag('event', name, params);
  if (window.fbq && map.fb) window.fbq('track', map.fb, params);
  else window.fbq?.('trackCustom', name, params);
  if (window.ttq && map.tt) window.ttq.track(map.tt, params);
  if (window.snaptr && map.snap) window.snaptr('track', map.snap, params);

  // Google Ads conversion
  if (name === 'appointment_booked' && config.google_ads_id && config.google_ads_conversion_label && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${config.google_ads_id}/${config.google_ads_conversion_label}`,
    });
  }

  api.post('/analytics/event', {
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    event_name: name,
    event_category: params.category || 'engagement',
    label: params.label,
    value: params.value,
    path: location.pathname,
    meta: params,
  }).catch(() => {});
}

export const getTrackingIds = () => ({ visitor_id: getVisitorId(), session_id: getSessionId() });
