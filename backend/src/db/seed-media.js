/**
 * Assigns the bundled stock photography to the hero, categories, team,
 * gallery and featured treatments.
 *
 * Only fills empty image fields, so anything uploaded through the admin
 * panel is never overwritten. Pass --force to reassign everything.
 */
require('dotenv').config();
const { pool, query, one } = require('../config/db');

const FORCE = process.argv.includes('--force');
const P = (name) => `/uploads/stock/${name}.jpg`;

const CATEGORY_IMAGES = {
  'aesthetic-and-laser': 'cat-aesthetic',
  ayurveda: 'cat-ayurveda',
  'naturopathy-and-natural-therapy': 'cat-naturopathy',
  therapy: 'cat-therapy',
  'health-and-wellness': 'cat-health',
  'skin-health-and-dermatology': 'cat-skin',
  'womens-and-intimate-wellness': 'cat-women',
};

const GALLERY = [
  ['clinic-reception', 'Reception', 'রিসেপশন — আমাদের শান্ত অভ্যর্থনা', 'clinic'],
  ['clinic-consult', 'Consultation Room', 'কনসালটেশন রুম', 'clinic'],
  ['clinic-laser', 'Laser & Aesthetic Room', 'লেজার ও অ্যাসথেটিক রুম', 'clinic'],
  ['clinic-ayurveda', 'Ayurveda & Panchakarma Room', 'আয়ুর্বেদ ও পঞ্চকর্ম রুম', 'clinic'],
  ['clinic-therapy', 'Therapy Room', 'থেরাপি রুম', 'clinic'],
  ['treat-1', 'Facial Serum Therapy', 'ফেসিয়াল সিরাম থেরাপি', 'treatment'],
  ['treat-2', 'Kati Basti Therapy', 'কটি বস্তি থেরাপি', 'treatment'],
  ['treat-3', 'Herbal Preparations', 'ভেষজ প্রস্তুতি', 'treatment'],
  ['treat-4', 'Ayurvedic Herb Grinding', 'আয়ুর্বেদিক ভেষজ প্রস্তুতি', 'treatment'],
  ['cat-aesthetic', 'Aesthetic Treatment', 'অ্যাসথেটিক ট্রিটমেন্ট', 'treatment'],
  ['cat-ayurveda', 'Herbal Massage', 'হারবাল ম্যাসাজ', 'treatment'],
  ['collection', 'Premium Wellness Collection', 'প্রিমিয়াম ওয়েলনেস কালেকশন', 'treatment'],
];

/** Featured treatments get a photo so the signature cards look right. */
const FEATURED_IMAGES = [
  ['laser-hair-removal', 'cat-aesthetic'],
  ['laser-skin-rejuvenation', 'treat-1'],
  ['melasma-care', 'cat-skin'],
  ['hifu', 'cat-women'],
  ['skin-tightening', 'cat-aesthetic'],
  ['prp-hair-therapy', 'treat-1'],
  ['shirodhara', 'cat-ayurveda'],
  ['abhyanga', 'cat-therapy'],
  ['ayurvedic-detox', 'treat-4'],
  ['hydrotherapy', 'cat-naturopathy'],
  ['hijama-therapy', 'treat-2'],
  ['acupuncture-therapy', 'cat-therapy'],
  ['pcos-wellness', 'cat-health'],
  ['weight-management', 'cat-health'],
  ['acne', 'cat-skin'],
  ['vaginal-rejuvenation', 'cat-women'],
];

const blank = (col) => (FORCE ? '1=1' : `(${col} IS NULL OR ${col} = '')`);

async function run() {
  /* ---- hero + section imagery (settings) ---- */
  const SETTINGS = [
    ['hero_image', P('hero-alt'), 'media'],
    ['about_image', P('clinic-reception'), 'media'],
    ['collection_image', P('collection'), 'media'],
  ];
  for (const [key, value, group] of SETTINGS) {
    await query(
      `INSERT INTO settings (setting_key, setting_value, setting_group) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE setting_value = IF(${FORCE ? 'TRUE' : "setting_value IS NULL OR setting_value = ''"}, VALUES(setting_value), setting_value)`,
      [key, value, group]
    );
  }
  console.log(`  settings: ${SETTINGS.length} media keys`);

  /* ---- categories ---- */
  let cats = 0;
  for (const [slug, img] of Object.entries(CATEGORY_IMAGES)) {
    const r = await query(
      `UPDATE categories SET image = ? WHERE slug = ? AND ${blank('image')}`,
      [P(img), slug]
    );
    cats += r.affectedRows;
  }
  console.log(`  categories: ${cats}`);

  /* ---- team ---- */
  const team = await query(
    `UPDATE team_members SET photo = ? WHERE slug = 'dr-laila-mitu' AND ${blank('photo')}`,
    [P('doctor')]
  );
  console.log(`  team: ${team.affectedRows}`);

  /* ---- gallery ---- */
  let gal = 0;
  for (let i = 0; i < GALLERY.length; i++) {
    const [img, title, caption, album] = GALLERY[i];
    const dup = await one('SELECT id FROM gallery WHERE image = ?', [P(img)]);
    if (dup) continue;
    await query(
      'INSERT INTO gallery (title, caption, image, album, sort_order) VALUES (?,?,?,?,?)',
      [title, caption, P(img), album, i + 1]
    );
    gal++;
  }
  console.log(`  gallery: ${gal}`);

  /* ---- featured services ---- */
  let svc = 0;
  for (const [needle, img] of FEATURED_IMAGES) {
    const r = await query(
      `UPDATE services SET image = ? WHERE slug LIKE ? AND ${blank('image')}`,
      [P(img), `${needle}-%`]
    );
    svc += r.affectedRows;
  }
  console.log(`  services: ${svc}`);

  console.log('\nMedia assigned. Re-run with --force to overwrite existing images.');
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
