import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useLang } from '../i18n';
import { serviceApi, testimonialApi, teamApi, galleryApi } from '../api/endpoints';
import { trackEvent } from '../api/tracking';
import { Photo, Blossom, Lotus } from '../components/Art';
import { SectionHead, Testimonial } from '../components/ui';
import { Icon } from '../components/Icons';

/* The six quick-access cards that sit over the hero, as in the reference. */
const QUICK = [
  ['laser', 'quick.aesthetic', 'quick.aestheticSub', '/services/category/aesthetic-and-laser'],
  ['lotus', 'quick.ayurveda', 'quick.ayurvedaSub', '/services/category/ayurveda'],
  ['leaf', 'quick.naturopathy', 'quick.naturopathySub', '/services/category/naturopathy-and-natural-therapy'],
  ['stethoscope', 'quick.consultation', 'quick.consultationSub', '/book-appointment'],
  ['skinScan', 'quick.skinAnalysis', 'quick.skinAnalysisSub', '/contact'],
  ['gift', 'quick.packages', 'quick.packagesSub', '/services'],
];

/* maps a speciality slug to an icon in the line-art set */
const CATEGORY_ICONS = {
  'aesthetic-and-laser': 'laser',
  ayurveda: 'lotus',
  'naturopathy-and-natural-therapy': 'leaf',
  therapy: 'balance',
  'health-and-wellness': 'stethoscope',
  'skin-health-and-dermatology': 'sparkle',
  'womens-and-intimate-wellness': 'heart',
};

const WHY = [
  ['sprout', 'why.natural', 'why.naturalText'],
  ['sparkle', 'why.advanced', 'why.advancedText'],
  ['lotus', 'why.ayurvedic', 'why.ayurvedicText'],
  ['heart', 'why.personal', 'why.personalText'],
  ['balance', 'why.holistic', 'why.holisticText'],
];

const TRUST = [
  ['shield', 'trust.authentic', 'trust.authenticSub'],
  ['card', 'trust.secure', 'trust.secureSub'],
  ['clock', 'trust.fast', 'trust.fastSub'],
  ['support', 'trust.support', 'trust.supportSub'],
];

const AESTHETIC_LIST = {
  en: ['Laser Hair Removal', 'Skin Rejuvenation', 'Pigmentation & Melasma Care', 'Acne & Acne Scar Care',
    'Anti-Aging', 'Skin Tightening', 'HIFU & RF', 'Face & Body Contouring',
    'Fat Reduction', 'Hair & Scalp Care', 'PRP Hair Therapy', 'Intimate Wellness'],
  bn: ['লেজার হেয়ার রিমুভাল', 'স্কিন রিজুভিনেশন', 'পিগমেন্টেশন ও মেলাজমা কেয়ার', 'ব্রণ ও ব্রণের দাগ',
    'বয়সের ছাপ প্রতিরোধ', 'স্কিন টাইটেনিং', 'হাইফু ও আরএফ', 'ফেস ও বডি কনট্যুরিং',
    'মেদ হ্রাস', 'চুল ও স্ক্যাল্প কেয়ার', 'পিআরপি হেয়ার থেরাপি', 'ইনটিমেট ওয়েলনেস'],
};
const AYURVEDA_LIST = {
  en: ['Ayurvedic Consultation', 'Prakriti Assessment', 'Panchakarma', 'Abhyanga', 'Shirodhara', 'Swedana',
    'Nasya', 'Basti', 'Virechana', 'Pizhichil', 'Ayurvedic Detox', 'Rejuvenation Programs'],
  bn: ['আয়ুর্বেদিক কনসালটেশন', 'প্রকৃতি নির্ণয়', 'পঞ্চকর্ম', 'অভ্যঙ্গ', 'শিরোধারা', 'স্বেদন',
    'নস্য', 'বস্তি', 'বিরেচন', 'পিঝিচিল', 'আয়ুর্বেদিক ডিটক্স', 'পুনরুজ্জীবন প্রোগ্রাম'],
};
const NATUROPATHY_LIST = {
  en: ['Naturopathy Consultation', 'Natural Detox', 'Hydrotherapy', 'Sitz Bath Therapy',
    'Contrast Water Therapy', 'Mud Therapy', 'Steam Therapy', 'Herbal Therapy',
    'Therapeutic Bath', 'Nutrition & Diet Guidance', 'Lifestyle Correction', 'Sleep & Stress Wellness'],
  bn: ['ন্যাচারোপ্যাথি কনসালটেশন', 'প্রাকৃতিক ডিটক্স', 'হাইড্রোথেরাপি', 'সিটজ বাথ থেরাপি',
    'কনট্রাস্ট ওয়াটার থেরাপি', 'মাড থেরাপি', 'স্টিম থেরাপি', 'হারবাল থেরাপি',
    'থেরাপিউটিক বাথ', 'পুষ্টি ও খাদ্য পরামর্শ', 'জীবনযাত্রার সংশোধন', 'ঘুম ও স্ট্রেস ওয়েলনেস'],
};
const WOMEN_LIST = {
  en: ["Women's Wellness", 'PCOS Wellness', 'Hormonal Wellness', 'Menstrual Wellness',
    'Fertility Wellness', 'Infertility Support', 'Pre-Pregnancy Wellness', 'Post-Pregnancy Wellness',
    'Menopause Wellness', 'Intimate Wellness', 'Vaginal Rejuvenation', 'Pelvic Floor Wellness'],
  bn: ['নারী সুস্থতা', 'পিসিওএস ওয়েলনেস', 'হরমোন ভারসাম্য', 'মাসিক সংক্রান্ত সেবা',
    'প্রজনন সক্ষমতা', 'বন্ধ্যাত্ব সহায়তা', 'গর্ভধারণ-পূর্ব যত্ন', 'প্রসব-পরবর্তী যত্ন',
    'মেনোপজ ওয়েলনেস', 'ইনটিমেট ওয়েলনেস', 'ভ্যাজাইনাল রিজুভিনেশন', 'পেলভিক ফ্লোর ওয়েলনেস'],
};
const HEALTH_LIST = {
  en: ['Diabetes Management Support', 'Weight & Obesity Management', 'Thyroid Wellness Support', 'PCOS Wellness',
    'Digestive & Gut Wellness', 'Liver Wellness', 'Joint & Muscle Wellness', 'Stress & Sleep Wellness',
    'Fertility Wellness', "Women's Hormonal Wellness", "Men's Wellness", 'Sexual Health & Wellness'],
  bn: ['ডায়াবেটিস ব্যবস্থাপনা', 'ওজন ও স্থূলতা নিয়ন্ত্রণ', 'থাইরয়েড ওয়েলনেস', 'পিসিওএস ওয়েলনেস',
    'হজম ও গাট ওয়েলনেস', 'লিভার ওয়েলনেস', 'জয়েন্ট ও পেশি ওয়েলনেস', 'স্ট্রেস ও ঘুম',
    'প্রজনন সক্ষমতা', 'নারীর হরমোন ওয়েলনেস', 'পুরুষ সুস্থতা', 'যৌন স্বাস্থ্য ও সুস্থতা'],
};

const CLINIC_SPACES = [
  ['clinic.reception', '🏛'], ['clinic.consultRoom', '🩺'], ['clinic.laserRoom', '✨'],
  ['clinic.ayurvedaRoom', '🌿'], ['clinic.therapyRoom', '🪷'],
];

/* ---------- reusable highlight band ---------- */
function Highlight({ id, dark, reverse, eyebrow, title, text, list, cta, to, icon, image }) {
  return (
    <section id={id} className={`section ${dark ? 'section--dark' : ''}`} style={{ position: 'relative' }}>
      {!dark && <Blossom className="ambient-blossom" style={{ top: 20, right: -70 }} size={220} opacity={0.18} />}
      <div className="container">
        <div className={`split ${reverse ? 'reverse' : ''}`}>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p className={dark ? '' : 'lead'} style={dark ? { color: 'rgba(255,255,255,.82)' } : undefined}>{text}</p>
            <ul className="treatment-list">
              {list.map((i) => <li key={i}>{i}</li>)}
            </ul>
            <Link to={to} className={dark ? 'btn btn-gold' : 'btn btn-purple'}>{cta} →</Link>
          </div>
          <div className="split-visual">
            <Photo src={image} icon={icon} alt={title} tone={dark ? 'dark' : 'purple'} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { settings, categories } = useSite();
  const { t, lang, pickField } = useLang();
  const [featured, setFeatured] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [clinic, setClinic] = useState([]);
  const [beforeAfter, setBeforeAfter] = useState([]);

  useEffect(() => {
    serviceApi.featured(8).then(setFeatured).catch(() => {});
    testimonialApi.list({ limit: 3 }).then((r) => setTestimonials(r.data || [])).catch(() => {});
    teamApi.list({ limit: 1 }).then((r) => setDoctor((r.data || [])[0] || null)).catch(() => {});
    galleryApi.list({ album: 'clinic', limit: 5 }).then((r) => setClinic(r.data || [])).catch(() => {});
    galleryApi.list({ album: 'before_after', limit: 4 }).then((r) => setBeforeAfter(r.data || [])).catch(() => {});
  }, []);

  const L = (obj) => obj[lang] || obj.en;
  const catImage = (slug) => categories.find((c) => c.slug === slug)?.image;

  return (
    <div className="site-canvas">
      {/* ============ HERO (full-bleed) ============ */}
      <section className="hero">
        {/* photo plate bleeding off the right edge */}
        <div className="hero-bleed">
          <Photo src={settings.hero_image} icon="🌸" alt={t('hero.brand')} tone="purple" />
        </div>

        <Blossom style={{ top: -30, left: -60, zIndex: 2 }} size={280} opacity={0.55} />
        <Blossom style={{ bottom: -70, left: 40, zIndex: 2 }} size={200} opacity={0.4} />
        <Blossom style={{ top: 90, right: -50, zIndex: 2 }} size={230} opacity={0.34} />
        <Blossom style={{ bottom: 20, right: 180, zIndex: 2 }} size={150} opacity={0.28} />

        <div className="container hero-inner">
          <div className="hero-copy fade-up">
            <span className="eyebrow">{t('hero.eyebrow')}</span>

            <div className="hero-wordmark">
              <span className="lotus-mark"><Lotus size={40} /></span>
              <h1>{t('hero.brand')}</h1>
              <span className="line2">{t('hero.brandSub')}</span>
            </div>

            <p className="sub">{t('hero.tagline')}</p>
            <p className="desc">{t('hero.desc')}</p>

            <div className="hero-cta">
              <Link to="/services" className="btn btn-gold">{t('hero.ctaPrimary')} →</Link>
              <Link
                to="/book-appointment" className="btn btn-outline-light"
                onClick={() => trackEvent('book_appointment_click', { label: 'hero' })}
              >
                <Icon name="calendar" size={17} /> {t('hero.ctaSecondary')}
              </Link>
            </div>

            <div className="speciality-tags">
              {categories.slice(0, 7).map((c) => (
                <span key={c.id}>
                  <Icon name={CATEGORY_ICONS[c.slug] || 'sparkle'} size={14} />
                  {pickField(c, 'name')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* script quote pinned to the far right, as in the reference */}
        <div className="hero-quote">
          <p className="q">{t('hero.quote')}</p>
          <span className="heart">♡</span>
        </div>
      </section>

      {/* ============ QUICK ACCESS STRIP ============ */}
      <div className="quick-strip">
        <div className="container">
          <div className="quick-grid">
            {QUICK.map(([icon, key, subKey, to]) => (
              <Link key={key} to={to} className="quick-card glass-sheen">
                <div className="ico"><Icon name={icon} size={26} /></div>
                <strong>{t(key)}</strong>
                <small>{t(subKey)}</small>
                <span className="arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ============ EXPERT + SIGNATURE TREATMENTS ============ */}
      <section className="section expert-band" style={{ position: 'relative', overflow: 'hidden' }}>
        <Blossom className="ambient-blossom tl" size={220} opacity={0.2} />
        <Blossom className="ambient-blossom br" size={240} opacity={0.18} />

        <div className="container">
          <div className="expert-layout">
            {/* expert */}
            {doctor && (
              <div className="expert-card glass glass-sheen" style={{ padding: 22 }}>
                <div className="expert-photo">
                  <Photo src={doctor.photo} icon="👩‍⚕️" alt={pickField(doctor, 'name')} tone="purple" />
                </div>
                <div>
                  <span className="eyebrow">{t('expert.eyebrow')}</span>
                  <h3 style={{ fontSize: 'clamp(1.4rem, 2vw, 1.85rem)', marginBottom: 2 }}>
                    {pickField(doctor, 'name')}
                  </h3>
                  <p style={{ color: 'var(--purple-600)', fontWeight: 500, fontSize: '.92rem' }}>
                    {pickField(doctor, 'designation')}
                  </p>
                  <ul className="expert-meta">
                    {doctor.qualifications && (
                      <li><span className="dot"><Icon name="cap" size={13} /></span>{doctor.qualifications}</li>
                    )}
                    {doctor.experience && (
                      <li><span className="dot"><Icon name="clock" size={13} /></span>{doctor.experience} {t('expert.experience')}</li>
                    )}
                    {doctor.specialization && (
                      <li><span className="dot"><Icon name="star" size={13} /></span>{doctor.specialization}</li>
                    )}
                  </ul>
                  <Link to="/our-team" className="btn btn-purple btn-sm">{t('expert.viewProfile')} →</Link>
                </div>
              </div>
            )}

            {/* signature treatments */}
            <div>
              <div className="sig-head">
                <div className="flex items-center gap-12">
                  <Lotus size={30} color="#8A3BA3" />
                  <div>
                    <h2>{t('sig.title')}</h2>
                    <p>{t('sig.sub')}</p>
                  </div>
                </div>
                <Link to="/services" className="btn btn-purple btn-sm">{t('sig.viewAll')}</Link>
              </div>

              <div className="sig-grid">
                {featured.slice(0, 4).map((s) => (
                  <Link key={s.id} to={`/services/${s.slug}`} className="sig-card glass glass-hover">
                    <div className="pic">
                      <Photo src={s.image || s.category_image} icon={s.category_icon || '✦'} alt={pickField(s, 'name')} tone="soft" />
                    </div>
                    <div className="txt">
                      <h4>{pickField(s, 'name')}</h4>
                      <small>{pickField(s, 'category_name')}</small>
                      <span className="learn">{t('sig.learnMore')} →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* quote strip under the expert, as in the reference */}
          {doctor?.quote && (
            <div className="expert-quote" style={{ marginTop: 36, textAlign: 'center', borderLeft: 0 }}>
              “{doctor.quote}”
              <div className="flex" style={{ justifyContent: 'center', marginTop: 14 }}><Lotus size={26} /></div>
            </div>
          )}
        </div>
      </section>

      {/* ============ COLLECTION + BEFORE/AFTER + TESTIMONIAL ============ */}
      <section className="section" style={{ paddingTop: 54 }}>
        <div className="container">
          <div className="proof-row">
            {/* premium collection banner */}
            <div className="collection-banner glass-sheen">
              <h2>{t('collection.title')}</h2>
              <p className="dots">{t('collection.dots')}</p>
              <Link to="/services" className="btn btn-gold btn-sm" style={{ alignSelf: 'flex-start' }}>
                {t('collection.cta')} →
              </Link>
              <div className="collection-trust">
                <span><Icon name="shield" size={15} /> {t('collection.authentic')}</span>
                <span><Icon name="sparkle" size={15} /> {t('collection.tested')}</span>
                <span><Icon name="star" size={15} /> {t('collection.quality')}</span>
              </div>
            </div>

            {/* before & after */}
            <div className="proof-card glass">
              <h3>{t('ba.title')}</h3>
              <p>{t('ba.sub')}</p>
              <Link to="/gallery" className="btn btn-purple btn-sm mb-24" style={{ alignSelf: 'flex-start' }}>
                {t('ba.cta')} →
              </Link>
              <div className="ba-grid">
                {(beforeAfter.length
                  ? beforeAfter.map((g, i) => ({
                      key: g.id,
                      image: g.image,
                      label: i % 2 ? t('ba.after') : t('ba.before'),
                    }))
                  : [0, 1, 2, 3].map((i) => ({
                      key: i,
                      image: null,
                      label: i % 2 ? t('ba.after') : t('ba.before'),
                    }))
                ).map((cell, i) => (
                  <div className="ba-cell" key={cell.key}>
                    <Photo src={cell.image} icon="🙂" tone={i % 2 ? 'purple' : 'soft'} alt={cell.label} />
                    <span className="tag">{cell.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* single testimonial */}
            <div className="proof-card glass">
              <h3>{t('testimonials.title')}</h3>
              {testimonials[0] ? (
                <>
                  <div className="stars">{'★'.repeat(testimonials[0].rating || 5)}</div>
                  <p style={{ fontSize: '.94rem', flex: 1 }}>“{testimonials[0].message}”</p>
                  <div className="flex items-center gap-12">
                    <div className="avatar" style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden' }}>
                      <Photo src={testimonials[0].photo} icon="🙂" tone="purple" />
                    </div>
                    <div>
                      <strong style={{ fontSize: '.9rem' }}>{testimonials[0].client_name}</strong>
                      <div className="muted" style={{ fontSize: '.78rem' }}>
                        {testimonials[0].service_name || t('testimonials.client')}
                      </div>
                    </div>
                  </div>
                </>
              ) : <p className="muted">—</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY SKINOVEDA ============ */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow={t('why.eyebrow')} title={t('why.title')} text={t('why.text')} />
          <div className="grid grid-5">
            {WHY.map(([icon, titleKey, textKey]) => (
              <div className="why-card is-glass" key={titleKey}>
                <div className="ico"><Icon name={icon} size={30} /></div>
                <h3>{t(titleKey)}</h3>
                <p>{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SIGNATURE SERVICES (categories) ============ */}
      <section className="section section--soft">
        <div className="container">
          <SectionHead eyebrow={t('services.eyebrow')} title={t('services.title')} text={t('services.text')} />
          <div className="grid grid-3">
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/services/category/${c.slug}`} className="service-card is-glass">
                <div className="thumb">
                  <Photo src={c.image} icon={c.icon} alt={pickField(c, 'name')} tone="purple" />
                  <span className="badge badge-gold service-count">
                    {c.service_count} {t('services.treatments')}
                  </span>
                </div>
                <div className="body">
                  <h3 className="flex items-center gap-8">
                    <Icon name={CATEGORY_ICONS[c.slug] || 'sparkle'} size={20} />
                    {pickField(c, 'name')}
                  </h3>
                  <p>{pickField(c, 'description') || pickField(c, 'tagline')}</p>
                  <span className="go">{t('services.explore')} →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-40">
            <Link to="/services" className="btn btn-purple">{t('services.viewAll')} →</Link>
          </div>
        </div>
      </section>

      {/* ============ HIGHLIGHT BANDS ============ */}
      <Highlight
        id="aesthetic" icon="✨"
        eyebrow={t('highlight.aestheticEyebrow')} title={t('highlight.aestheticTitle')}
        text={t('highlight.aestheticText')} list={L(AESTHETIC_LIST)}
        cta={t('highlight.aestheticCta')} to="/services/category/aesthetic-and-laser" image={catImage('aesthetic-and-laser')}
      />
      <Highlight
        id="ayurveda" dark reverse icon="🌿"
        eyebrow={t('highlight.ayurvedaEyebrow')} title={t('highlight.ayurvedaTitle')}
        text={t('highlight.ayurvedaText')} list={L(AYURVEDA_LIST)}
        cta={t('highlight.ayurvedaCta')} to="/services/category/ayurveda" image={catImage('ayurveda')}
      />
      <Highlight
        id="naturopathy" icon="🍃"
        eyebrow={t('highlight.naturoEyebrow')} title={t('highlight.naturoTitle')}
        text={t('highlight.naturoText')} list={L(NATUROPATHY_LIST)}
        cta={t('highlight.naturoCta')} to="/services/category/naturopathy-and-natural-therapy" image={catImage('naturopathy-and-natural-therapy')}
      />
      <Highlight
        id="womens" dark reverse icon="💜"
        eyebrow={t('highlight.womenEyebrow')} title={t('highlight.womenTitle')}
        text={t('highlight.womenText')} list={L(WOMEN_LIST)}
        cta={t('highlight.womenCta')} to="/services/category/womens-and-intimate-wellness" image={catImage('womens-and-intimate-wellness')}
      />
      <Highlight
        id="health" icon="🩺"
        eyebrow={t('highlight.healthEyebrow')} title={t('highlight.healthTitle')}
        text={t('highlight.healthText')} list={L(HEALTH_LIST)}
        cta={t('highlight.healthCta')} to="/services/category/health-and-wellness" image={catImage('health-and-wellness')}
      />

      {/* ============ FEATURED TREATMENTS ============ */}
      {featured.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <SectionHead eyebrow={t('featured.eyebrow')} title={t('featured.title')} text={t('featured.text')} />
            <div className="grid grid-4">
              {featured.slice(0, 8).map((s) => (
                <Link key={s.id} to={`/services/${s.slug}`} className="glass glass-hover glass-sheen"
                      style={{ padding: 26, textAlign: 'center', display: 'block' }}>
                  <div style={{ marginBottom: 10, color: 'var(--purple-600)' }}>
                    <Icon name={CATEGORY_ICONS[s.category_slug] || 'sparkle'} size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem' }}>{pickField(s, 'name')}</h3>
                  <p className="muted" style={{ fontSize: '.82rem', margin: 0 }}>{pickField(s, 'category_name')}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CLINIC EXPERIENCE ============ */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow={t('clinic.eyebrow')} title={t('clinic.title')} text={t('clinic.text')} />
          <div className="gallery-grid">
            {(clinic.length
              ? clinic.map((g) => ({ id: g.id, title: g.title, image: g.image, icon: '🏛' }))
              : CLINIC_SPACES.map(([key, icon]) => ({ id: key, title: t(key), icon }))
            ).map((g) => (
              <div className="gallery-item is-glass" key={g.id}>
                <Photo src={g.image} icon={g.icon} alt={g.title} tone="purple" />
                <div className="cap">{g.title}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-40">
            <Link to="/gallery" className="btn btn-outline">{t('clinic.viewGallery')} →</Link>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      {testimonials.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <SectionHead eyebrow={t('testimonials.eyebrow')} title={t('testimonials.title')} text={t('testimonials.sub')} />
            <div className="grid grid-3">
              {testimonials.map((tm) => <Testimonial key={tm.id} item={tm} glass />)}
            </div>
          </div>
        </section>
      )}

      {/* ============ FINAL CTA ============ */}
      <section className="section">
        <div className="container">
          <div className="cta-band glass-sheen">
            <span className="eyebrow" style={{ color: 'var(--gold-400)' }}>{t('cta.eyebrow')}</span>
            <h2>{t('cta.title')}</h2>
            <p>{t('cta.text')}</p>
            <div className="flex gap-12 wrap mt-24" style={{ justifyContent: 'center' }}>
              <Link to="/book-appointment" className="btn btn-gold"
                    onClick={() => trackEvent('book_appointment_click', { label: 'home_cta' })}>
                {t('cta.book')} →
              </Link>
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone}`} className="btn btn-outline-light"
                   onClick={() => trackEvent('call_click', { label: 'home_cta' })}>
                  {t('cta.call')} {settings.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="trust-bar">
        <div className="container">
          <div className="trust-grid">
            {TRUST.map(([icon, titleKey, subKey]) => (
              <div className="trust-item" key={titleKey}>
                <div className="ico"><Icon name={icon} size={22} /></div>
                <div>
                  <strong>{t(titleKey)}</strong>
                  <small>{t(subKey)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
