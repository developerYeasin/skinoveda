import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { serviceApi } from '../api/endpoints';
import { useLang } from '../i18n';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Blossom } from '../components/Art';

export default function Services() {
  const { t, pickField } = useLang();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const [active, setActive] = useState('');

  useEffect(() => {
    serviceApi.catalog().then(setCatalog).catch(() => setCatalog([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      let current = '';
      document.querySelectorAll('.cat-block').forEach((b) => {
        if (b.getBoundingClientRect().top <= 170) current = b.id;
      });
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [catalog]);

  const filtered = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog
      .map((c) => ({
        ...c,
        groups: c.groups
          .map((g) => ({ ...g, services: g.services.filter((s) => s.name.toLowerCase().includes(q)) }))
          .filter((g) => g.services.length || g.name.toLowerCase().includes(q)),
      }))
      .filter((c) => c.groups.length || c.name.toLowerCase().includes(q));
  }, [catalog, search]);

  const total = catalog.reduce((n, c) => n + c.total_services, 0);

  return (
    <div className="site-canvas">
      <PageBanner title={t('services.pageTitle')} subtitle={t('services.pageSub')} crumbs={[{ label: t('nav.services') }]} />

      <div className="cat-nav is-glass">
        <div className="container">
          <div className="cat-nav-inner">
            {catalog.map((c) => (
              <a key={c.id} href={`#cat-${c.slug}`} className={active === `cat-${c.slug}` ? 'active' : ''}>
                {c.icon} {pickField(c, 'name')}
              </a>
            ))}
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 34, position: 'relative' }}>
        <Blossom className="ambient-blossom tr" size={250} opacity={0.16} />
        <div className="container">
          <div className="glass flex items-center justify-between wrap gap-16 mb-24" style={{ padding: '16px 22px' }}>
            <p className="muted mb-0">
              {loading
                ? t('services.loading')
                : `${total} ${t('services.treatments')} · ${catalog.length} ${t('services.across')}`}
            </p>
            <input
              type="search" placeholder={t('services.search')} defaultValue={search}
              onChange={(e) => setParams(e.target.value ? { search: e.target.value } : {}, { replace: true })}
              style={{
                padding: '11px 20px', minWidth: 260, borderRadius: 999,
                border: '1px solid rgba(255,255,255,.8)', background: 'rgba(255,255,255,.6)',
                backdropFilter: 'blur(10px)', outline: 'none',
              }}
            />
          </div>

          {loading && <div className="grid grid-3"><Skeleton h={180} count={6} /></div>}

          {!loading && filtered.length === 0 && (
            <EmptyState icon="🔍" title={t('services.noMatch')} text={t('services.noMatchText')} />
          )}

          {filtered.map((cat) => (
            <div className="cat-block" id={`cat-${cat.slug}`} key={cat.id}>
              <div className="cat-head">
                <span className="num">{cat.code}</span>
                <div>
                  <h2>{cat.icon} {pickField(cat, 'name')}</h2>
                  <p className="muted mb-0">{pickField(cat, 'description') || pickField(cat, 'tagline')}</p>
                  <Link to={`/services/category/${cat.slug}`} className="btn btn-purple btn-sm mt-16">
                    {t('services.viewCategory')} →
                  </Link>
                </div>
              </div>

              {cat.groups.map((g) => (
                <div className="group-block" key={g.id}>
                  <h4>{pickField(g, 'name')}</h4>
                  <div className="treat-grid">
                    {g.services.map((s) => (
                      <Link key={s.id} to={`/services/${s.slug}`} className="treat-pill is-glass">
                        {pickField(s, 'name')}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band glass-sheen">
            <h2>{t('services.notSure')}</h2>
            <p>{t('services.notSureText')}</p>
            <Link to="/book-appointment" className="btn btn-gold mt-16">{t('services.bookConsult')} →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
