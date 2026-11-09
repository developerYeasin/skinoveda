import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/client';
import { useLang } from '../i18n';
import { useCart } from '../context/CartContext';
import { Icon } from './Icons';

export const money = (n) => `৳ ${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

function Stars({ value = 0 }) {
  const full = Math.round(value);
  return <span className="stars" aria-label={`${value} out of 5`}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

export default function ProductCard({ product, wishlist }) {
  const { t, pickField } = useLang();
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const out = product.stock <= 0;
  const price = Number(product.effective_price ?? product.price);
  const hasDiscount = product.discount_percent > 0;

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    add(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const badgeLabel = {
    bestseller: t('shop.badgeBestseller'),
    new: t('shop.badgeNew'),
    sale: t('shop.badgeSale'),
  }[product.badge];

  return (
    <Link to={`/shop/${product.slug}`} className="product-card">
      <div className="pic">
        {product.badge !== 'none' && badgeLabel && (
          <span className={`product-badge ${product.badge}`}>{badgeLabel}</span>
        )}
        {hasDiscount && <span className="product-discount">-{product.discount_percent}%</span>}

        {product.image
          ? <img src={assetUrl(product.image)} alt={pickField(product, 'name')} loading="lazy" />
          : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--purple-400)' }}>
              <Icon name="sparkle" size={38} />
            </div>}

        {wishlist && (
          <button
            type="button"
            className={`wish-btn ${wishlist.has(product.id) ? 'on' : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlist.toggle(product.id); }}
            aria-label="Wishlist"
            aria-pressed={wishlist.has(product.id)}
          >
            <Icon name="heart" size={16} />
          </button>
        )}

        {out && <span className="stock-out">{t('shop.outOfStock')}</span>}
      </div>

      <div className="body">
        {product.brand_name && <div className="brand-line">{product.brand_name}</div>}
        <h3>{pickField(product, 'name')}</h3>
        {pickField(product, 'subtitle') && <div className="sub">{pickField(product, 'subtitle')}</div>}

        {product.review_count > 0 && (
          <div className="rating-row">
            <Stars value={product.rating} />
            <span className="count">{product.rating} ({product.review_count})</span>
          </div>
        )}

        <div className="price-row">
          <span className="price-now">{money(price)}</span>
          {hasDiscount && <span className="price-was">{money(product.price)}</span>}
        </div>

        <button type="button" className={`add-btn ${justAdded ? 'done' : ''}`} onClick={onAdd} disabled={out}>
          {justAdded
            ? <>✓ {t('shop.added')}</>
            : <><Icon name="gift" size={15} /> {out ? t('shop.outOfStock') : t('shop.addToBag')}</>}
        </button>
      </div>
    </Link>
  );
}
