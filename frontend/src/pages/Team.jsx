import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamApi } from '../api/endpoints';
import { useLang } from '../i18n';
import { PageBanner, Skeleton, EmptyState } from '../components/ui';
import { Photo, Blossom } from '../components/Art';
import { Icon } from '../components/Icons';

export default function Team() {
  const { t, pickField } = useLang();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamApi.list({ limit: 50 })
      .then((r) => setMembers(r.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="site-canvas">
      <PageBanner title={t('team.title')} subtitle={t('team.sub')} crumbs={[{ label: t('nav.team') }]} />

      <section className="section" style={{ position: 'relative' }}>
        <Blossom className="ambient-blossom tr" size={240} opacity={0.16} />
        <div className="container">
          {loading && <div className="grid grid-3"><Skeleton h={340} count={3} /></div>}

          {!loading && members.length === 0 && <EmptyState icon="👩‍⚕️" title={t('team.empty')} />}

          <div className="grid grid-3">
            {members.map((m) => (
              <div className="glass glass-hover glass-sheen" key={m.id} style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '4/4' }}>
                  <Photo src={m.photo} icon="👩‍⚕️" alt={pickField(m, 'name')} tone="purple" />
                </div>
                <div style={{ padding: 24 }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 2 }}>{pickField(m, 'name')}</h3>
                  <p style={{ color: 'var(--purple-600)', fontWeight: 500, fontSize: '.9rem' }}>
                    {pickField(m, 'designation')}
                  </p>
                  <ul className="expert-meta" style={{ margin: '12px 0' }}>
                    {m.qualifications && (
                      <li><span className="dot"><Icon name="cap" size={13} /></span>{m.qualifications}</li>
                    )}
                    {m.experience && (
                      <li><span className="dot"><Icon name="clock" size={13} /></span>{m.experience}</li>
                    )}
                    {m.specialization && (
                      <li><span className="dot"><Icon name="star" size={13} /></span>{m.specialization}</li>
                    )}
                  </ul>
                  {m.bio && <p className="muted" style={{ fontSize: '.88rem' }}>{pickField(m, 'bio')}</p>}
                  {m.quote && (
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--purple-700)', marginBottom: 0 }}>
                      “{m.quote}”
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-40">
            <Link to="/book-appointment" className="btn btn-gold">{t('services.bookConsult')} →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
