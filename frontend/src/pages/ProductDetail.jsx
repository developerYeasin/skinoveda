import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { shopApi } from '../api/endpoints';
import { assetUrl } from '../api/client';
import { useLang } from '../i18n';
import { useCart, useWishlist } from '../context/CartContext';
import { trackEvent } from '../api/tracking';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Blossom } from '../components/Art';
import { Icon } from '../components/Icons';
import ProductCard, { money } from '../components/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, pickField } = useLang();
  const { add } = useCart();
  const wishlist = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQty(1);
    shopApi.product(slug)
      .then((p) => {
        setProduct(p);
        document.title = `${p.name} | Skinoveda`;
        trackEvent('product_view', { label: p.name, value: Number(p.effective_price) });
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    return () => { document.title = 'Skinoveda'; };
  }, [slug]);

  if (loading) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('common.loading')} />
        <section className="section"><div className="container"><Skeleton h={340} /></div></section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="site-canvas">
        <PageBanner title={t('shop.notFound')} crumbs={[{ label: t('shop.nav'), to: '/shop' }]} />
        <section className="section">
          <div className="container">
            <EmptyState icon="🧴" title={t('shop.notFound')} />
            <div className="text-center mt-24">
              <Link to="/shop" className="btn btn-purple">{t('shop.backToShop')} →</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const name = pickField(product, 'name');
  const price = Number(product.effective_price);
  const out = product.stock <= 0;

  const onAdd = () => {
    if (out) return;
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const TABS = [
    ['description', t('shop.description'), pickField(product, 'description')],
    ['ingredients', t('shop.ingredients'), product.ingredients],
    ['how', t('shop.howToUse'), product.how_to_use],
  ].filter(([, , body]) => body);

  return (
    <div className="site-canvas">
      <PageBanner
        title={name}
        subtitle={pickField(product, 'subtitle')}
        crumbs={[
          { label: t('shop.nav'), to: '/shop' },
          ...(product.category_name ? [{ label: pickField(product, 'category_name'), to: `/shop?category=${product.category_slug}` }] : []),
          { label: name },
        ]}
      />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tr" size={230} opacity={0.14} />
        <div className="container">
          <div className="product-detail">
            <div className="product-gallery glass">
              {product.discount_percent > 0 && (
                <span className="product-discount" style={{ top: 16, right: 16 }}>-{product.discount_percent}%</span>
              )}
              {product.image
                ? <img src={assetUrl(product.image)} alt={name} />
                : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--purple-400)' }}>
                    <Icon name="sparkle" size={64} />
                  </div>}
            </div>

            <div className="product-info">
              {product.brand_name && <span className="badge badge-gold mb-8">{product.brand_name}</span>}
              <h1>{name}</h1>
              {pickField(product, 'subtitle') && <p className="sub">{pickField(product, 'subtitle')}</p>}

              {product.review_count > 0 && (
                <div className="rating-row">
                  <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
                  <span className="count">{product.rating} · {product.review_count} {t('shop.reviews')}</span>
                </div>
              )}

              <div className="detail-price">
                <span className="now">{money(price)}</span>
                {product.discount_percent > 0 && <span className="was">{money(product.price)}</span>}
              </div>

              <ul className="detail-meta">
                {product.size_label && (
                  <li><span className="muted">{t('shop.size')}</span><strong>{product.size_label}</strong></li>
                )}
                {product.skin_type && (
                  <li>
                    <span className="muted">{t('shop.skinType')}</span>
                    <strong>{t(`shop.skin${product.skin_type.charAt(0).toUpperCase()}${product.skin_type.slice(1)}`, product.skin_type)}</strong>
                  </li>
                )}
                {product.sku && <li><span className="muted">{t('shop.sku')}</span><strong>{product.sku}</strong></li>}
                <li>
                  <span className="muted">{t('shop.inStock')}</span>
                  <strong style={{ color: out ? '#C0392B' : '#2E7D4F' }}>
                    {out ? t('shop.outOfStock') : `${product.stock}`}
                  </strong>
                </li>
              </ul>

              <div className="detail-actions">
                <div className="qty-box">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} aria-label="Increase">+</button>
                </div>
                <button className={`add-btn ${added ? 'done' : ''}`} onClick={onAdd} disabled={out}>
                  {added ? <>✓ {t('shop.added')}</> : <><Icon name="gift" size={17} /> {t('shop.addToBag')}</>}
                </button>
                <button
                  className={`wish-btn ${wishlist.has(product.id) ? 'on' : ''}`}
                  style={{ position: 'static', width: 44, height: 44 }}
                  onClick={() => wishlist.toggle(product.id)}
                  aria-label="Wishlist"
                >
                  <Icon name="heart" size={19} />
                </button>
              </div>

              {TABS.length > 0 && (
                <div className="detail-tabs">
                  <div className="tabs">
                    {TABS.map(([key, label]) => (
                      <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="muted" style={{ lineHeight: 1.8 }}>
                    {(TABS.find(([k]) => k === tab) || TABS[0])[2]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {product.related?.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <h2 className="text-center mb-24">{t('shop.relatedProducts')}</h2>
            <div className="product-grid">
              {product.related.map((p) => <ProductCard key={p.id} product={p} wishlist={wishlist} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
