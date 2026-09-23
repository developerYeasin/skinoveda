require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/db');
const { makeSlug } = require('../utils/helpers');
const catalog = require('./catalog');
const migrate = require('./migrate');

const FEATURED = new Set([
  'laser-hair-removal',
  'laser-skin-rejuvenation',
  'melasma-care',
  'hifu',
  'prp-hair-therapy',
  'shirodhara',
  'abhyanga',
  'ayurvedic-detox',
  'hydrotherapy',
  'hijama-therapy',
  'acupuncture-therapy',
  'pcos-wellness',
  'weight-management',
  'acne',
  'vaginal-rejuvenation',
  'skin-tightening',
]);

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@skinoveda.com';
  const exists = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) return console.log('  admin already exists');
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  await query(
    'INSERT INTO users (name, email, phone, password, role) VALUES (?,?,?,?,?)',
    ['Skinoveda Admin', email, '+8801700000000', hash, 'superadmin']
  );
  console.log(`  admin created: ${email}`);
}

async function seedCatalog() {
  for (let ci = 0; ci < catalog.length; ci++) {
    const cat = catalog[ci];
    const catSlug = makeSlug(cat.name);
    await query(
      `INSERT INTO categories (name, slug, icon, code, tagline, description, color, sort_order, meta_title, meta_description)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), code=VALUES(code),
         tagline=VALUES(tagline), description=VALUES(description), color=VALUES(color), sort_order=VALUES(sort_order)`,
      [
        cat.name, catSlug, cat.icon, cat.code, cat.tagline, cat.description, cat.color, ci + 1,
        `${cat.name} | Skinoveda`, cat.tagline,
      ]
    );
    const [{ id: categoryId }] = await query('SELECT id FROM categories WHERE slug = ?', [catSlug]);

    for (let gi = 0; gi < cat.groups.length; gi++) {
      const grp = cat.groups[gi];
      const grpSlug = makeSlug(grp.name);
      await query(
        `INSERT INTO service_groups (category_id, name, slug, sort_order)
         VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), sort_order=VALUES(sort_order)`,
        [categoryId, grp.name, grpSlug, gi + 1]
      );
      const [{ id: groupId }] = await query(
        'SELECT id FROM service_groups WHERE category_id = ? AND slug = ?',
        [categoryId, grpSlug]
      );

      for (let si = 0; si < grp.services.length; si++) {
        const name = grp.services[si];
        const slug = makeSlug(`${name}-${cat.code}`);
        const shortSlug = makeSlug(name);
        await query(
          `INSERT INTO services (category_id, group_id, name, slug, short_description, description, duration, sort_order, is_featured, meta_title, meta_description)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE category_id=VALUES(category_id), group_id=VALUES(group_id),
             name=VALUES(name), sort_order=VALUES(sort_order)`,
          [
            categoryId,
            groupId,
            name,
            slug,
            `${name} at Skinoveda — personalized ${cat.name.toLowerCase()} care.`,
            `${name} is offered as part of our ${grp.name} program under ${cat.name}. Every plan at Skinoveda begins with a one-to-one consultation so the treatment is matched to your skin, body type and lifestyle.`,
            '30 - 60 min',
            si + 1,
            FEATURED.has(shortSlug) ? 1 : 0,
            `${name} in Dhaka | Skinoveda`,
            `${name} at Skinoveda Laser, Aesthetic & Ayurveda Wellness Centre, Dhanmondi, Dhaka.`,
          ]
        );
      }
    }
    console.log(`  category: ${cat.name}`);
  }
}

async function seedTeam() {
  const members = [
    {
      name: 'Dr. Laila Mitu',
      designation: 'Aesthetic Dermatologist & Wellness Specialist',
      specialization: 'Skin, Laser & Anti-Aging',
      qualifications: 'MBBS, MD (Dermatology)',
      experience: '10+ Years',
      quote: 'Healthy skin is not just about beauty, it is about confidence.',
      bio: 'Dr. Laila Mitu leads the aesthetic and laser division at Skinoveda, combining evidence-based dermatology with holistic wellness planning.',
    },
    {
      name: 'Dr. Ayesha Rahman',
      designation: 'Ayurveda & Panchakarma Consultant',
      specialization: 'Panchakarma, Detox & Rejuvenation',
      qualifications: 'BAMS, MD (Ayurveda)',
      experience: '8+ Years',
      quote: 'Balance the body and the skin will follow.',
      bio: 'Dr. Ayesha designs personalized Panchakarma and Ayurvedic wellness programs based on Prakriti assessment.',
    },
    {
      name: 'Dr. Tanvir Hasan',
      designation: 'Naturopathy & Lifestyle Physician',
      specialization: 'Naturopathy, Nutrition & Detox',
      qualifications: 'BNYS, Certified Nutritionist',
      experience: '7+ Years',
      quote: 'Nature heals when we simply stop getting in the way.',
      bio: 'Dr. Tanvir handles naturopathic consultation, therapeutic diet planning and metabolic lifestyle programs.',
    },
    {
      name: 'Nusrat Jahan',
      designation: 'Senior Therapy Specialist',
      specialization: 'Hijama, Cupping & Acupuncture',
      qualifications: 'Certified Hijama & Acupuncture Therapist',
      experience: '6+ Years',
      quote: 'Every therapy session should feel like a reset.',
      bio: 'Nusrat is our lead therapist for Hijama, cupping, acupressure and relaxation therapy sessions.',
    },
  ];
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    await query(
      `INSERT INTO team_members (name, slug, designation, specialization, qualifications, experience, bio, quote, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE designation=VALUES(designation)`,
      [m.name, makeSlug(m.name), m.designation, m.specialization, m.qualifications, m.experience, m.bio, m.quote, i + 1]
    );
  }
  console.log(`  team members: ${members.length}`);
}

async function seedTestimonials() {
  const list = [
    ['Tasnim Rahman', 5, 'Skinoveda changed my skin completely! The treatments are amazing and the staff is so professional and kind.', 'Laser Skin Rejuvenation'],
    ['Farhana Akter', 5, 'The Panchakarma program helped my sleep and digestion more than anything I have tried before.', 'Panchakarma'],
    ['Sumaiya Islam', 5, 'I came for melasma care and the difference after four sessions is honestly beyond what I expected.', 'Melasma Care'],
    ['Rafiul Karim', 5, 'Hijama therapy here is done very hygienically. Felt lighter and much less back pain afterwards.', 'Hijama Therapy'],
    ['Nadia Hossain', 5, 'Their PCOS wellness plan was practical and personal. First time a clinic actually listened to me.', 'PCOS Wellness'],
  ];
  for (let i = 0; i < list.length; i++) {
    const [name, rating, message, service] = list[i];
    const dup = await query('SELECT id FROM testimonials WHERE client_name = ? AND service_name = ?', [name, service]);
    if (dup.length) continue;
    await query(
      'INSERT INTO testimonials (client_name, rating, message, service_name, sort_order) VALUES (?,?,?,?,?)',
      [name, rating, message, service, i + 1]
    );
  }
  console.log('  testimonials seeded');
}

async function seedBlogs() {
  const posts = [
    {
      title: 'Melasma in Bangladesh: Why It Comes Back and How to Actually Manage It',
      excerpt: 'Sun, heat and hormones make melasma stubborn. Here is a realistic, layered approach that works long term.',
      tags: 'skin,melasma,pigmentation',
    },
    {
      title: 'Panchakarma Explained: What Really Happens in a Detox Program',
      excerpt: 'A plain-language walk through Abhyanga, Swedana, Virechana and what to expect day by day.',
      tags: 'ayurveda,panchakarma,detox',
    },
    {
      title: 'Laser Hair Removal: Sessions, Safety and Skin Types',
      excerpt: 'How many sessions you actually need, what to avoid before a session, and who is not a good candidate.',
      tags: 'laser,aesthetic,hair',
    },
    {
      title: 'PCOS Wellness: Food, Sleep and Movement That Move the Needle',
      excerpt: 'Beyond medication — the lifestyle levers that consistently improve PCOS symptoms.',
      tags: 'pcos,womens-wellness,lifestyle',
    },
  ];
  for (const p of posts) {
    const slug = makeSlug(p.title);
    const dup = await query('SELECT id FROM blogs WHERE slug = ?', [slug]);
    if (dup.length) continue;
    await query(
      `INSERT INTO blogs (title, slug, excerpt, content, tags, author, status, published_at, meta_title, meta_description)
       VALUES (?,?,?,?,?,?,'published', NOW(), ?, ?)`,
      [
        p.title,
        slug,
        p.excerpt,
        `<p>${p.excerpt}</p><p>At Skinoveda we always begin with a consultation, because the same concern can have very different causes in two people. This article walks through the assessment we use, the treatment options available at the centre, and the home-care routine that keeps results stable.</p><h3>What we assess</h3><ul><li>Skin type, lifestyle and medical history</li><li>Duration and triggers of the concern</li><li>Previous treatments and their outcome</li></ul><h3>Our approach</h3><p>We combine modern aesthetic science with Ayurveda and naturopathy so that the treatment supports the body rather than fighting it.</p>`,
        p.tags,
        'Skinoveda',
        p.title,
        p.excerpt,
      ]
    );
  }
  console.log('  blog posts seeded');
}

async function seedSettings() {
  const defaults = [
    ['site_name', 'Skinoveda', 'general'],
    ['site_tagline', 'Laser & Aesthetic Wellness Centre', 'general'],
    ['site_description', 'Where Modern Aesthetic Science Meets Ancient Healing Wisdom', 'general'],
    ['contact_phone', '+880 1700-000000', 'contact'],
    ['contact_phone_2', '+880 1800-000000', 'contact'],
    ['contact_email', 'info@skinoveda.com', 'contact'],
    ['contact_address', 'Dhanmondi, Dhaka, Bangladesh', 'contact'],
    ['contact_map', 'https://maps.google.com/?q=Dhanmondi,Dhaka', 'contact'],
    ['opening_hours', 'Saturday - Thursday: 10:00 AM - 8:00 PM | Friday: Closed', 'contact'],
    ['whatsapp', '+8801700000000', 'contact'],
    ['facebook', 'https://facebook.com/skinoveda', 'social'],
    ['instagram', 'https://instagram.com/skinoveda', 'social'],
    ['youtube', '', 'social'],
    ['tiktok', '', 'social'],
    ['linkedin', '', 'social'],
    // Tracking / marketing
    ['gtm_id', '', 'tracking'],
    ['ga4_id', '', 'tracking'],
    ['facebook_pixel_id', '', 'tracking'],
    ['tiktok_pixel_id', '', 'tracking'],
    ['google_ads_id', '', 'tracking'],
    ['google_ads_conversion_label', '', 'tracking'],
    ['snapchat_pixel_id', '', 'tracking'],
    ['linkedin_partner_id', '', 'tracking'],
    ['hotjar_id', '', 'tracking'],
    ['clarity_id', '', 'tracking'],
    ['internal_analytics_enabled', '1', 'tracking'],
    ['head_scripts', '', 'tracking'],
    ['body_scripts', '', 'tracking'],
    // SEO
    ['meta_title', 'Skinoveda | Laser, Aesthetic & Ayurveda Wellness Centre in Dhaka', 'seo'],
    ['meta_description', 'Advanced aesthetic technology, Ayurveda, Panchakarma, naturopathy and holistic wellness therapies under one premium care experience in Dhanmondi, Dhaka.', 'seo'],
    ['meta_keywords', 'laser treatment dhaka, ayurveda dhaka, panchakarma, naturopathy, hijama, skin care clinic bangladesh', 'seo'],
  ];
  for (const [key, value, group] of defaults) {
    await query(
      `INSERT INTO settings (setting_key, setting_value, setting_group) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE setting_group = VALUES(setting_group)`,
      [key, value, group]
    );
  }
  console.log(`  settings: ${defaults.length} keys`);
}

async function run() {
  console.log('Running migration...');
  await migrate();
  console.log('\nSeeding data...');
  await seedAdmin();
  await seedCatalog();
  await seedTeam();
  await seedTestimonials();
  await seedBlogs();
  await seedSettings();

  const [{ c: services }] = await query('SELECT COUNT(*) c FROM services');
  const [{ c: cats }] = await query('SELECT COUNT(*) c FROM categories');
  console.log(`\nDone. ${cats} categories, ${services} services.`);
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
