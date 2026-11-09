import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/client';
import { useLang } from '../i18n';
import { useSite } from '../context/SiteContext';
import { useCart } from '../context/CartContext';
import { Icon } from './Icons';
import { money } from './ProductCard';

export default function CartDrawer() {
  const { t, pickField } = useLang();
  const { settings } = useSite();
  const { items, count, subtotal, setQuantity, remove, open, setOpen } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, setOpen]);

  if (!open) return null;

  const freeOver = Number(settings.free_delivery_over || 0);
  const remaining = freeOver - subtotal;

  return (
    <>
      <div className="cart-backdrop" onClick={() => setOpen(false)} />
      <aside className="cart-drawer" role="dialog" aria-label={t('cart.title')}>
        <header className="cart-head">
          <h3>{t('cart.title')} {count > 0 && `(${count})`}</h3>
          <button onClick={() => setOpen(false)} aria-label="Close">×</button>
        </header>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="ico"><Icon name="gift" size={48} /></div>
              <h3>{t('cart.empty')}</h3>
              <p className="muted">{t('cart.emptyText')}</p>
              <Link to="/shop" className="btn btn-purple mt-16" onClick={() => setOpen(false)}>
                {t('cart.startShopping')}
              </Link>
            </div>
          ) : (
            items.map((i) => (
              <div className="cart-line" key={i.product_id}>
                <Link to={`/shop/${i.slug}`} className="thumb" onClick={() => setOpen(false)}>
                  {i.image && <img src={assetUrl(i.image)} alt="" />}
                </Link>

                <div>
                  <h4>{pickField(i, 'name')}</h4>
                  <div className="unit">{money(i.price)}</div>
                  <div className="qty-box">
                    <button onClick={() => setQuantity(i.product_id, i.quantity - 1)} aria-label="Decrease">−</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => setQuantity(i.product_id, i.quantity + 1)} aria-label="Increase">+</button>
                  </div>
                </div>

                <div className="right">
                  <span className="line-total">{money(i.price * i.quantity)}</span>
                  <button className="remove" onClick={() => remove(i.product_id)}>{t('cart.remove')}</button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-foot">
            {freeOver > 0 && remaining > 0 && (
              <p className="free-note">
                {money(remaining)} {t('cart.freeDelivery').toLowerCase()} →
              </p>
            )}
            <div className="cart-row total">
              <span>{t('cart.subtotal')}</span>
              <span>{money(subtotal)}</span>
            </div>
            <p className="hint" style={{ margin: '6px 0 12px' }}>{t('checkout.dhakaNote')}</p>
            <Link to="/checkout" className="btn btn-purple btn-block" onClick={() => setOpen(false)}>
              {t('cart.checkout')} →
            </Link>
            <button className="btn btn-outline btn-block mt-8" onClick={() => setOpen(false)}>
              {t('cart.continue')}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
