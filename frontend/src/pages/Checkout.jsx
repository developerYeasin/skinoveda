import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopApi } from '../api/endpoints';
import { assetUrl } from '../api/client';
import { useLang } from '../i18n';
import { useSite } from '../context/SiteContext';
import { useCart } from '../context/CartContext';
import { trackEvent, getTrackingIds } from '../api/tracking';
import { PageBanner } from '../components/ui';
import { Blossom, Lotus } from '../components/Art';
import { money } from '../components/ProductCard';

const EMPTY = {
  customer_name: '', phone: '', email: '',
  address: '', city: '', area: '', note: '',
  payment_method: 'cod',
};

export default function Checkout() {
  const { t, pickField } = useLang();
  const { settings } = useSite();
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ busy: false, error: '', done: null });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /* Delivery is priced again on the server; this is the shopper-facing estimate. */
  const delivery = useMemo(() => {
    const freeOver = Number(settings.free_delivery_over || 0);
    if (freeOver > 0 && subtotal >= freeOver) return 0;
    const inside = /dhaka|ঢাকা/i.test(form.city || '');
    return Number(inside ? settings.delivery_charge_inside || 70 : settings.delivery_charge_outside || 130);
  }, [settings, subtotal, form.city]);

  const total = subtotal + delivery;

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: '', done: null });
    try {
      const res = await shopApi.placeOrder({
        ...form,
        ...getTrackingIds(),
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      trackEvent('purchase', { label: res.order_code, value: res.total, category: 'conversion' });
      setStatus({ busy: false, error: '', done: res });
      clear();
      window.scrollTo({ top: 150, behavior: 'smooth' });
    } catch (err) {
      setStatus({ busy: false, error: err.response?.data?.message || t('book.error'), done: null });
    }
  };

  /* ---------- success ---------- */
  if (status.done) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('checkout.success')} crumbs={[{ label: t('checkout.title') }]} />
        <section className="section">
          <div className="container" style={{ maxWidth: 560 }}>
            <div className="glass glass-sheen text-center" style={{ padding: 44 }}>
              <div className="flex" style={{ justifyContent: 'center' }}><Lotus size={56} /></div>
              <h2>{t('checkout.success')}</h2>
              <p className="lead">{status.done.message}</p>
              <div className="alert alert-info" style={{ display: 'inline-block' }}>
                {t('checkout.orderCode')}: <strong>{status.done.order_code}</strong>
              </div>
              <div className="cart-row total mt-16" style={{ justifyContent: 'center', gap: 12 }}>
                <span>{t('cart.total')}</span><span>{money(status.done.total)}</span>
              </div>
              <div className="flex gap-12 wrap mt-24" style={{ justifyContent: 'center' }}>
                <Link to="/shop" className="btn btn-purple">{t('checkout.keepShopping')}</Link>
                <Link to="/" className="btn btn-outline">{t('book.backHome')}</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ---------- empty bag ---------- */
  if (items.length === 0) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('checkout.title')} crumbs={[{ label: t('checkout.title') }]} />
        <section className="section">
          <div className="container" style={{ maxWidth: 520 }}>
            <div className="glass text-center" style={{ padding: 48 }}>
              <h2>{t('cart.empty')}</h2>
              <p className="muted">{t('cart.emptyText')}</p>
              <Link to="/shop" className="btn btn-purple mt-16">{t('cart.startShopping')}</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ---------- form ---------- */
  return (
    <div className="site-canvas">
      <PageBanner title={t('checkout.title')} subtitle={t('checkout.sub')} crumbs={[{ label: t('checkout.title') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tl" size={230} opacity={0.14} />
        <div className="container">
          <form className="checkout-layout" onSubmit={submit}>
            <div className="glass glass-sheen glass-form" style={{ padding: 'clamp(22px, 3vw, 34px)' }}>
              <h2 style={{ fontSize: '1.55rem' }}>{t('checkout.details')}</h2>
              {status.error && <div className="alert alert-error">{status.error}</div>}

              <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
                <div className="field">
                  <label>{t('checkout.name')} *</label>
                  <input required value={form.customer_name} onChange={set('customer_name')} />
                </div>
                <div className="field">
                  <label>{t('checkout.phone')} *</label>
                  <input required value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
                </div>
                <div className="field">
                  <label>{t('checkout.email')}</label>
                  <input type="email" value={form.email} onChange={set('email')} />
                </div>
                <div className="field">
                  <label>{t('checkout.city')}</label>
                  <input value={form.city} onChange={set('city')} placeholder="Dhaka" />
                </div>
              </div>

              <div className="field">
                <label>{t('checkout.address')} *</label>
                <textarea required rows={3} value={form.address} onChange={set('address')} />
              </div>
              <div className="field">
                <label>{t('checkout.note')}</label>
                <input value={form.note} onChange={set('note')} />
              </div>

              <h3 style={{ fontSize: '1.15rem', marginTop: 18 }}>{t('checkout.payment')}</h3>
              <div className="pay-options">
                {[['cod', t('checkout.cod')], ['bkash', t('checkout.bkash')], ['nagad', t('checkout.nagad')]].map(([v, label]) => (
                  <label key={v} className={`pay-option ${form.payment_method === v ? 'on' : ''}`}>
                    <input
                      type="radio" name="payment" value={v}
                      checked={form.payment_method === v}
                      onChange={set('payment_method')}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <aside className="glass glass-sheen summary-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.15rem' }}>{t('checkout.summary')}</h3>

              {items.map((i) => (
                <div className="summary-line" key={i.product_id}>
                  <div className="thumb">{i.image && <img src={assetUrl(i.image)} alt="" />}</div>
                  <div>
                    {pickField(i, 'name')}
                    <div className="muted" style={{ fontSize: '.76rem' }}>× {i.quantity}</div>
                  </div>
                  <strong>{money(i.price * i.quantity)}</strong>
                </div>
              ))}

              <div className="cart-row mt-16">
                <span>{t('cart.subtotal')}</span><span>{money(subtotal)}</span>
              </div>
              <div className="cart-row">
                <span>{t('cart.delivery')}</span>
                <span>{delivery === 0 ? t('cart.freeDelivery') : money(delivery)}</span>
              </div>
              <div className="cart-row total">
                <span>{t('cart.total')}</span><span>{money(total)}</span>
              </div>

              <button className="btn btn-gold btn-block mt-16" disabled={status.busy}>
                {status.busy ? t('checkout.placing') : `${t('checkout.placeOrder')} →`}
              </button>
              <p className="hint text-center mt-8">{t('checkout.dhakaNote')}</p>
            </aside>
          </form>
        </div>
      </section>
    </div>
  );
}
