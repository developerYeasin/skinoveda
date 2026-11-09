import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shopApi } from '../api/endpoints';
import { useLang } from '../i18n';
import { useSite } from '../context/SiteContext';
import { useWishlist } from '../context/CartContext';
import { Skeleton, EmptyState } from '../components/ui';
import { Blossom, Photo } from '../components/Art';
import { Icon } from '../components/Icons';
import ProductCard from '../components/ProductCard';

/* a line icon per product category slug */
const CAT_ICONS = {
  cleanser: 'sparkle',
  toner: 'leaf',
  serum: 'laser',
  moisturizer: 'heart',
  sunscreen: 'shield',
  mask: 'skinScan',
  'eye-care': 'star',
  'body-care': 'lotus',
};

export default function Shop() {
  const { t, pickField } = useLang();
  const { settings } = useSite();
  const wishlist = useWishlist();
  const [params, setParams] = useSearchParams();

  const [filters, setFilters] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || '';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'featured';
  const brands = (params.get('brand') || '').split(',').filter(Boolean);
  const skinTypes = (params.get('skin_type') || '').split(',').filter(Boolean);
  const minPrice = params.get('min_price') || '';
  const maxPrice = params.get('max_price') || '';

  const [searchDraft, setSearchDraft] = useState(search);
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => { shopApi.filters().then(setFilters).catch(() => {}); }, []);
  useEffect(() => { setSearchDraft(search); }, [search]);

  /** Writes one filter into the querystring, dropping empty values. */
  const setParam = useCallback((key, value) => {
    const next = new URLSearchParams(params);
    if (!value || (Array.isArray(value) && !value.length)) next.delete(key);
    else next.set(key, Array.isArray(value) ? value.join(',') : value);
    setParams(next, { replace: true });
  }, [params, setParams]);

  const toggleIn = (list, value, key) =>
    setParam(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const query = useMemo(() => {
    const q = { limit: 48, sort };
    if (category) q.category = category;
    if (search) q.search = search;
    if (brands.length) q.brand = brands.join(',');
    if (skinTypes.length) q.skin_type = skinTypes.join(',');
    if (minPrice) q.min_price = minPrice;
    if (maxPrice) q.max_price = maxPrice;
    return q;
  }, [category, search, sort, brands.join(','), skinTypes.join(','), minPrice, maxPrice]);

  useEffect(() => {
    setLoading(true);
    shopApi.products(query)
      .then((r) => { setProducts(r.data || []); setTotal(r.total || 0); })
      .catch(() => { setProducts([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [query]);

  const skinLabel = (v) => t(`shop.skin${v.charAt(0).toUpperCase()}${v.slice(1)}`, v);
  const hasFilters = category || search || brands.length || skinTypes.length || minPrice || maxPrice;

  return (
    <div className="site-canvas">
      {/* ---------- banner ---------- */}
      <section className="shop-hero">
        <Blossom style={{ top: -40, left: -50 }} size={230} opacity={0.4} />
        <Blossom style={{ bottom: -50, right: -30 }} size={200} opacity={0.32} />
        <div className="container">
          <h1>{t('shop.title')}</h1>
          <p>{t('shop.sub')}</p>
          <form
            className="shop-search"
            onSubmit={(e) => { e.preventDefault(); setParam('search', searchDraft.trim()); }}
          >
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={t('shop.search')}
              aria-label={t('shop.search')}
            />
            <button type="submit" aria-label={t('shop.search')}><Icon name="search" size={18} /></button>
          </form>
        </div>
      </section>

      {/* ---------- category strip ---------- */}
      {filters && (
        <div className="cat-strip">
          <div className="container">
            <div className="cat-strip-inner">
              <button
                className={`cat-chip ${!category ? 'active' : ''}`}
                onClick={() => setParam('category', '')}
              >
                <Icon name="sparkle" size={22} />
                <span>{t('shop.allProducts')}</span>
              </button>
              {filters.categories.map((c) => (
                <button
                  key={c.id}
                  className={`cat-chip ${category === c.slug ? 'active' : ''}`}
                  onClick={() => setParam('category', category === c.slug ? '' : c.slug)}
                >
                  <Icon name={CAT_ICONS[c.slug] || 'sparkle'} size={22} />
                  <span>{pickField(c, 'name')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- layout ---------- */}
      <section className="section" style={{ paddingTop: 30 }}>
        <div className="container">
          <div className="shop-layout">
            {/* sidebar */}
            <aside className="shop-side">
              <div className="filter-card">
                <h4>{t('shop.categories')}</h4>
                <div className="filter-body">
                  <ul className="filter-list">
                    <li>
                      <button className={!category ? 'active' : ''} onClick={() => setParam('category', '')}>
                        <span className="dot-ico"><Icon name="sparkle" size={13} /></span>
                        {t('shop.allProducts')}
                        <span className="count">({filters?.total ?? 0})</span>
                      </button>
                    </li>
                    {filters?.categories.map((c) => (
                      <li key={c.id}>
                        <button
                          className={category === c.slug ? 'active' : ''}
                          onClick={() => setParam('category', category === c.slug ? '' : c.slug)}
                        >
                          <span className="dot-ico"><Icon name={CAT_ICONS[c.slug] || 'sparkle'} size={13} /></span>
                          {pickField(c, 'name')}
                          <span className="count">({c.product_count})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="filter-card">
                <h4>{t('shop.filter')}</h4>
                <div className="filter-body">
                  <p style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--purple-700)', margin: '0 0 8px' }}>
                    {t('shop.priceRange')}
                  </p>
                  <div className="price-inputs">
                    <input
                      type="number" min="0" placeholder="0" value={priceDraft.min}
                      onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
                      onBlur={() => setParam('min_price', priceDraft.min)}
                    />
                    <span className="muted">–</span>
                    <input
                      type="number" min="0" placeholder={String(Math.round(filters?.priceRange?.max || 5000))}
                      value={priceDraft.max}
                      onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
                      onBlur={() => setParam('max_price', priceDraft.max)}
                    />
                  </div>

                  <p style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--purple-700)', margin: '16px 0 4px' }}>
                    {t('shop.brand')}
                  </p>
                  {filters?.brands.map((b) => (
                    <label className="check-row" key={b.id}>
                      <input
                        type="checkbox"
                        checked={brands.includes(b.slug)}
                        onChange={() => toggleIn(brands, b.slug, 'brand')}
                      />
                      {b.name}
                      <span className="count">({b.product_count})</span>
                    </label>
                  ))}

                  <p style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--purple-700)', margin: '16px 0 4px' }}>
                    {t('shop.skinType')}
                  </p>
                  {filters?.skinTypes.map((s) => (
                    <label className="check-row" key={s.value}>
                      <input
                        type="checkbox"
                        checked={skinTypes.includes(s.value)}
                        onChange={() => toggleIn(skinTypes, s.value, 'skin_type')}
                      />
                      {skinLabel(s.value)}
                      <span className="count">({s.product_count})</span>
                    </label>
                  ))}

                  {hasFilters && (
                    <button
                      className="btn btn-outline btn-sm btn-block mt-16"
                      onClick={() => { setParams({}, { replace: true }); setPriceDraft({ min: '', max: '' }); }}
                    >
                      {t('shop.clearFilters')}
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* products */}
            <div>
              {/* promo banner, as in the reference */}
              <div
                className="collection-banner glass-sheen mb-24"
                style={{ minHeight: 190, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', inset: '0 0 0 46%', opacity: .5 }}>
                  <Photo src={settings.shop_banner_image} icon="🌸" alt="" tone="purple" />
                </div>
                <h2 style={{ position: 'relative' }}>{settings.shop_banner_title || t('shop.title')}</h2>
                <p className="dots" style={{ position: 'relative' }}>
                  {settings.shop_banner_text || t('shop.sub')}
                </p>
              </div>

              <div className="shop-toolbar">
                <span className="muted" style={{ fontSize: '.88rem' }}>
                  {loading ? t('common.loading') : `${total} ${t('shop.products')}`}
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.84rem' }}>
                  {t('shop.sortBy')}
                  <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                    <option value="featured">{t('shop.sortFeatured')}</option>
                    <option value="newest">{t('shop.sortNewest')}</option>
                    <option value="price_low">{t('shop.sortPriceLow')}</option>
                    <option value="price_high">{t('shop.sortPriceHigh')}</option>
                    <option value="rating">{t('shop.sortRating')}</option>
                  </select>
                </label>
              </div>

              {loading && <div className="product-grid"><Skeleton h={330} count={8} /></div>}

              {!loading && products.length === 0 && (
                <EmptyState icon="🧴" title={t('shop.noProducts')} text={t('shop.noProductsText')} />
              )}

              <div className="product-grid">
                {products.map((p) => <ProductCard key={p.id} product={p} wishlist={wishlist} />)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
