/**
 * Creates the shop tables and seeds the product catalogue.
 * Safe to re-run — existing rows are left alone.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, query, one } = require('../config/db');
const { makeSlug } = require('../utils/helpers');

const CATEGORIES = [
  ['Cleanser', 'ক্লিনজার', 'cleanser', 'Gentle daily cleansing for every skin type'],
  ['Toner', 'টোনার', 'toner', 'Balance and prep the skin after cleansing'],
  ['Serum', 'সিরাম', 'serum', 'Concentrated actives for targeted concerns'],
  ['Moisturizer', 'ময়েশ্চারাইজার', 'moisturizer', 'Lock in hydration and repair the barrier'],
  ['Sunscreen', 'সানস্ক্রিন', 'sunscreen', 'Daily broad-spectrum protection'],
  ['Mask', 'মাস্ক', 'mask', 'Weekly treatments for glow and detox'],
  ['Eye Care', 'আই কেয়ার', 'eye-care', 'Care for the delicate under-eye area'],
  ['Body Care', 'বডি কেয়ার', 'body-care', 'Nourishment from the neck down'],
];

const BRANDS = ['Skinoveda', 'The Ordinary', 'La Roche-Posay', 'CeraVe', 'Simple', 'Vaseline'];

/* name, bn, subtitle, bn, category, brand, price, sale, skin, badge, rating, reviews, stock, image */
const PRODUCTS = [
  ['Hydrating Face Cleanser', 'হাইড্রেটিং ফেস ক্লিনজার', 'Gentle & Refreshing', 'কোমল ও সতেজ',
    'cleanser', 'Skinoveda', 1850, null, 'all', 'bestseller', 4.8, 124, 40, 'collection'],
  ['Foaming Gel Cleanser', 'ফোমিং জেল ক্লিনজার', 'For Oily Skin', 'তৈলাক্ত ত্বকের জন্য',
    'cleanser', 'CeraVe', 1650, 1450, 'oily', 'sale', 4.6, 88, 32, 'treat-cream'],
  ['Micellar Cleansing Water', 'মাইসেলার ক্লিনজিং ওয়াটার', 'Makeup Removal', 'মেকআপ রিমুভাল',
    'cleanser', 'Simple', 1200, null, 'sensitive', 'none', 4.5, 61, 55, 'treat-3'],

  ['Rose Glow Toner', 'রোজ গ্লো টোনার', 'Balancing & Soothing', 'ভারসাম্য ও প্রশান্তি',
    'toner', 'Skinoveda', 2200, null, 'all', 'none', 4.7, 73, 28, 'treat-4'],
  ['Niacinamide Toner', 'নায়াসিনামাইড টোনার', 'Pore Refining', 'লোমকূপ সংকোচন',
    'toner', 'The Ordinary', 1750, null, 'combination', 'none', 4.4, 52, 36, 'cat-naturopathy'],

  ['Vitamin C Serum', 'ভিটামিন সি সিরাম', 'Brightening & Glow', 'উজ্জ্বলতা ও দীপ্তি',
    'serum', 'The Ordinary', 2400, 2040, 'all', 'sale', 4.9, 98, 25, 'treat-cream'],
  ['Night Repair Serum', 'নাইট রিপেয়ার সিরাম', 'Overnight Renewal', 'রাতভর পুনর্গঠন',
    'serum', 'Skinoveda', 3500, null, 'all', 'bestseller', 4.8, 142, 18, 'collection'],
  ['Hyaluronic Acid Serum', 'হায়ালুরনিক অ্যাসিড সিরাম', 'Deep Hydration', 'গভীর আর্দ্রতা',
    'serum', 'The Ordinary', 1950, null, 'dry', 'new', 4.7, 66, 44, 'treat-cream'],
  ['Melasma Correcting Serum', 'মেলাজমা কারেক্টিং সিরাম', 'Pigmentation Care', 'পিগমেন্টেশন কেয়ার',
    'serum', 'Skinoveda', 3200, null, 'all', 'none', 4.6, 47, 20, 'cat-skin'],

  ['Moisturizing Face Cream', 'ময়েশ্চারাইজিং ফেস ক্রিম', 'Deep Hydration', 'গভীর আর্দ্রতা',
    'moisturizer', 'CeraVe', 2450, null, 'dry', 'bestseller', 4.8, 76, 30, 'treat-cream'],
  ['Oil-Free Gel Moisturizer', 'অয়েল-ফ্রি জেল ময়েশ্চারাইজার', 'Lightweight Finish', 'হালকা ফিনিশ',
    'moisturizer', 'Simple', 1800, 1620, 'oily', 'sale', 4.5, 58, 38, 'treat-3'],
  ['Barrier Repair Cream', 'ব্যারিয়ার রিপেয়ার ক্রিম', 'For Sensitive Skin', 'সংবেদনশীল ত্বকের জন্য',
    'moisturizer', 'La Roche-Posay', 2900, null, 'sensitive', 'none', 4.7, 64, 22, 'collection'],

  ['Sunscreen SPF 50+', 'সানস্ক্রিন এসপিএফ ৫০+', 'Broad Spectrum', 'ব্রড স্পেকট্রাম',
    'sunscreen', 'La Roche-Posay', 2800, 2520, 'all', 'sale', 4.7, 112, 48, 'treat-facemask'],
  ['Daily Mineral Sunscreen', 'ডেইলি মিনারেল সানস্ক্রিন', 'Physical Filter', 'ফিজিক্যাল ফিল্টার',
    'sunscreen', 'Skinoveda', 2200, null, 'sensitive', 'new', 4.6, 39, 41, 'cat-aesthetic'],

  ['Detox Clay Mask', 'ডিটক্স ক্লে মাস্ক', 'Deep Cleansing', 'গভীর পরিচ্ছন্নতা',
    'mask', 'Skinoveda', 1650, null, 'oily', 'none', 4.5, 65, 34, 'treat-facemask'],
  ['Hydrating Sheet Mask', 'হাইড্রেটিং শিট মাস্ক', 'Instant Glow', 'তাৎক্ষণিক দীপ্তি',
    'mask', 'Simple', 350, null, 'all', 'none', 4.3, 91, 120, 'cat-women'],
  ['Ayurvedic Herbal Mask', 'আয়ুর্বেদিক হারবাল মাস্ক', 'Natural Brightening', 'প্রাকৃতিক উজ্জ্বলতা',
    'mask', 'Skinoveda', 1350, null, 'all', 'bestseller', 4.8, 83, 26, 'treat-4'],

  ['Under Eye Cream', 'আন্ডার আই ক্রিম', 'Anti-Aging', 'বয়সের ছাপ প্রতিরোধ',
    'eye-care', 'Skinoveda', 1990, null, 'all', 'none', 4.8, 89, 24, 'treat-cream'],
  ['Caffeine Eye Solution', 'ক্যাফেইন আই সলিউশন', 'De-puffing', 'ফোলাভাব হ্রাস',
    'eye-care', 'The Ordinary', 1450, null, 'all', 'new', 4.4, 54, 37, 'treat-1'],

  ['Nourishing Body Lotion', 'নারিশিং বডি লোশন', 'All-Day Softness', 'সারাদিন কোমলতা',
    'body-care', 'Vaseline', 1700, 1530, 'dry', 'sale', 4.6, 103, 60, 'collection'],
  ['Herbal Body Oil', 'হারবাল বডি অয়েল', 'Ayurvedic Blend', 'আয়ুর্বেদিক মিশ্রণ',
    'body-care', 'Skinoveda', 2100, null, 'all', 'bestseller', 4.9, 71, 29, 'cat-ayurveda'],
  ['Gentle Body Wash', 'জেন্টল বডি ওয়াশ', 'Soap-Free Formula', 'সাবানমুক্ত ফর্মুলা',
    'body-care', 'Simple', 980, null, 'sensitive', 'none', 4.3, 47, 72, 'treat-3'],
];

const P = (n) => `/uploads/stock/${n}.jpg`;

async function run() {
  /* ---- tables ---- */
  const sql = fs.readFileSync(path.join(__dirname, 'shop-schema.sql'), 'utf8');
  for (const stmt of sql.split(/;\s*[\r\n]/).map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean)) {
    try {
      await query(stmt);
      const t = (stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i) || [])[1];
      if (t) console.log(`  ok  table: ${t}`);
    } catch (e) {
      console.error(`  !!  ${e.message}`);
    }
  }

  /* ---- categories ---- */
  for (let i = 0; i < CATEGORIES.length; i++) {
    const [name, nameBn, slug, desc] = CATEGORIES[i];
    await query(
      `INSERT INTO product_categories (name, name_bn, slug, description, sort_order)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), name_bn=VALUES(name_bn)`,
      [name, nameBn, slug, desc, i + 1]
    );
  }
  console.log(`  categories: ${CATEGORIES.length}`);

  /* ---- brands ---- */
  for (let i = 0; i < BRANDS.length; i++) {
    await query(
      'INSERT INTO brands (name, slug, sort_order) VALUES (?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [BRANDS[i], makeSlug(BRANDS[i]), i + 1]
    );
  }
  console.log(`  brands: ${BRANDS.length}`);

  /* ---- products ---- */
  let added = 0;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const [name, nameBn, sub, subBn, catSlug, brandName, price, sale, skin, badge, rating, reviews, stock, img] = PRODUCTS[i];
    const slug = makeSlug(name);
    if (await one('SELECT id FROM products WHERE slug = ?', [slug])) continue;

    const cat = await one('SELECT id FROM product_categories WHERE slug = ?', [catSlug]);
    const brand = await one('SELECT id FROM brands WHERE name = ?', [brandName]);

    await query(
      `INSERT INTO products
        (category_id, brand_id, name, name_bn, slug, subtitle, subtitle_bn, description, description_bn,
         image, price, sale_price, sku, stock, size_label, skin_type, badge, rating, review_count,
         sort_order, is_featured, meta_title, meta_description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cat?.id || null, brand?.id || null, name, nameBn, slug, sub, subBn,
        `${name} from ${brandName}. ${sub} — formulated for ${skin === 'all' ? 'all skin types' : skin + ' skin'} and recommended by the Skinoveda team.`,
        `${brandName} ব্র্যান্ডের ${nameBn}। ${subBn} — স্কিনোভেদা বিশেষজ্ঞদের বাছাই করা।`,
        P(img), price, sale, `SKV-${String(i + 1).padStart(4, '0')}`, stock,
        '50 ml', skin, badge, rating, reviews,
        i + 1, i < 8 ? 1 : 0,
        `${name} | Skinoveda Shop`, `Buy ${name} at Skinoveda — ${sub}.`,
      ]
    );
    added++;
  }
  console.log(`  products: ${added} added (${PRODUCTS.length} total defined)`);

  /* ---- shop settings ---- */
  const settings = [
    ['shop_enabled', '1', 'shop'],
    ['delivery_charge_inside', '70', 'shop'],
    ['delivery_charge_outside', '130', 'shop'],
    ['free_delivery_over', '3000', 'shop'],
    ['shop_banner_title', 'Healthy Skin, Happy You', 'shop'],
    ['shop_banner_text', 'Premium skincare for a natural, radiant glow', 'shop'],
    ['shop_banner_image', '/uploads/stock/treat-facemask.jpg', 'shop'],
  ];
  for (const [k, v, g] of settings) {
    await query(
      `INSERT INTO settings (setting_key, setting_value, setting_group) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE setting_group = VALUES(setting_group)`,
      [k, v, g]
    );
  }
  console.log(`  shop settings: ${settings.length}`);

  const [{ c }] = await query('SELECT COUNT(*) c FROM products');
  console.log(`\nShop ready. ${c} products in the catalogue.`);
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
