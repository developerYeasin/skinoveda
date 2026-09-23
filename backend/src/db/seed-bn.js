/**
 * Seeds the Bangla translations for the categories, service groups and team.
 * Only fills empty fields, so anything edited in the admin panel is preserved.
 */
require('dotenv').config();
const { pool, query } = require('../config/db');

const CATEGORIES = {
  'aesthetic-and-laser': {
    name: 'অ্যাসথেটিক ও লেজার',
    tagline: 'ত্বক, চুল ও শরীরের জন্য আধুনিক প্রযুক্তি',
    description: 'লেজার, স্কিন রিজুভিনেশন, পিগমেন্টেশন কেয়ার, লোম অপসারণ, বয়সের ছাপ প্রতিরোধ ও বডি কনট্যুরিং — আধুনিক অ্যাসথেটিক প্রযুক্তি ও ব্যক্তিগত কেয়ার প্ল্যানে।',
  },
  ayurveda: {
    name: 'আয়ুর্বেদ',
    tagline: 'ঐতিহ্যবাহী আয়ুর্বেদ ও পঞ্চকর্ম',
    description: 'আয়ুর্বেদিক কনসালটেশন, প্রকৃতি নির্ণয়, পঞ্চকর্ম, অভ্যঙ্গ, শিরোধারা, ডিটক্স ও পুনরুজ্জীবন প্রোগ্রাম — প্রাচীন আরোগ্যের প্রজ্ঞায় গড়া।',
  },
  'naturopathy-and-natural-therapy': {
    name: 'প্রাকৃতিক চিকিৎসা ও থেরাপি',
    tagline: 'প্রকৃতি ও সুস্থ জীবনযাত্রায় আরোগ্য',
    description: 'প্রাকৃতিক থেরাপি, হাইড্রোথেরাপি, সিটজ বাথ, মাড ও স্টিম থেরাপি, জীবনযাত্রার সংশোধন, পুষ্টি পরামর্শ ও সম্পূর্ণ ডিটক্স প্রোগ্রাম।',
  },
  therapy: {
    name: 'থেরাপি',
    tagline: 'হিজামা, কাপিং, আকুপাংচার ও রিল্যাক্সেশন থেরাপি',
    description: 'হিজামা, ওয়েট ও ড্রাই কাপিং, আকুপাংচার, আকুপ্রেশার, রিফ্লেক্সোলজি, থেরাপিউটিক ম্যাসাজ এবং মন ও শরীরের প্রশান্তি থেরাপি।',
  },
  'health-and-wellness': {
    name: 'স্বাস্থ্য ও সুস্থতা',
    tagline: 'আপনার স্বাস্থ্যের জন্য চাই সামগ্রিক যত্ন',
    description: 'জীবনযাত্রা ব্যবস্থাপনা, মেটাবলিক ওয়েলনেস, অভ্যন্তরীণ সুস্থতা, হাড়-পেশির যত্ন ও দীর্ঘমেয়াদি ব্যক্তিগত স্বাস্থ্য প্রোগ্রাম।',
  },
  'skin-health-and-dermatology': {
    name: 'ত্বকের স্বাস্থ্য ও চর্মরোগ',
    tagline: 'সুস্থ ত্বক, ফিরে পাওয়া আত্মবিশ্বাস',
    description: 'ব্রণ, পিগমেন্টেশন, দাগ, সংবেদনশীলতা ও বয়সজনিত সমস্যার ক্লিনিক্যাল চিকিৎসা — সাথে রিজুভিনেশন ও ত্বকের প্রতিরক্ষা মেরামত প্রোগ্রাম।',
  },
  'womens-and-intimate-wellness': {
    name: 'নারী ও ইনটিমেট ওয়েলনেস',
    tagline: 'ব্যক্তিগত। সম্মানজনক। আপনার মতো করে।',
    description: 'হরমোন, মাসিক, প্রজনন, মেনোপজ ও ইনটিমেট ওয়েলনেস নিয়ে সম্পূর্ণ গোপনীয় ও নারী-কেন্দ্রিক একটি সেবা কর্মসূচি।',
  },
};

const GROUPS = {
  laser: 'লেজার',
  'pigmentation-care': 'পিগমেন্টেশন কেয়ার',
  'face-aesthetics': 'ফেস অ্যাসথেটিক্স',
  'body-aesthetics': 'বডি অ্যাসথেটিক্স',
  hair: 'চুল',
  'ayurvedic-care': 'আয়ুর্বেদিক কেয়ার',
  panchakarma: 'পঞ্চকর্ম',
  'ayurvedic-health-and-wellness': 'আয়ুর্বেদিক স্বাস্থ্য ও সুস্থতা',
  naturopathy: 'ন্যাচারোপ্যাথি',
  'hydro-and-natural-therapy': 'হাইড্রো ও প্রাকৃতিক থেরাপি',
  'lifestyle-wellness': 'জীবনযাত্রা ও সুস্থতা',
  'hijama-and-cupping': 'হিজামা ও কাপিং',
  acupuncture: 'আকুপাংচার',
  'wellness-therapy': 'ওয়েলনেস থেরাপি',
  'metabolic-and-lifestyle-wellness': 'মেটাবলিক ও লাইফস্টাইল ওয়েলনেস',
  'womens-health': 'নারী স্বাস্থ্য',
  'mens-health': 'পুরুষ স্বাস্থ্য',
  'internal-wellness': 'অভ্যন্তরীণ সুস্থতা',
  'musculoskeletal-wellness': 'হাড় ও পেশির সুস্থতা',
  'skin-concerns': 'ত্বকের সমস্যা',
  'womens-wellness': 'নারী সুস্থতা',
  'intimate-wellness': 'ইনটিমেট ওয়েলনেস',
};

const TEAM = {
  'dr-laila-mitu': {
    name: 'ডা. লায়লা মিতু',
    designation: 'অ্যাসথেটিক ডার্মাটোলজিস্ট ও ওয়েলনেস বিশেষজ্ঞ',
    bio: 'ডা. লায়লা মিতু স্কিনোভেদার অ্যাসথেটিক ও লেজার বিভাগের প্রধান। তিনি প্রমাণভিত্তিক চর্মচিকিৎসার সঙ্গে সামগ্রিক ওয়েলনেস পরিকল্পনাকে একসাথে করেন।',
  },
  'dr-ayesha-rahman': {
    name: 'ডা. আয়েশা রহমান',
    designation: 'আয়ুর্বেদ ও পঞ্চকর্ম কনসালট্যান্ট',
    bio: 'ডা. আয়েশা প্রকৃতি নির্ণয়ের ভিত্তিতে ব্যক্তিগত পঞ্চকর্ম ও আয়ুর্বেদিক ওয়েলনেস প্রোগ্রাম তৈরি করেন।',
  },
  'dr-tanvir-hasan': {
    name: 'ডা. তানভীর হাসান',
    designation: 'ন্যাচারোপ্যাথি ও লাইফস্টাইল ফিজিশিয়ান',
    bio: 'ডা. তানভীর ন্যাচারোপ্যাথিক কনসালটেশন, থেরাপিউটিক ডায়েট পরিকল্পনা ও মেটাবলিক লাইফস্টাইল প্রোগ্রাম দেখাশোনা করেন।',
  },
  'nusrat-jahan': {
    name: 'নুসরাত জাহান',
    designation: 'সিনিয়র থেরাপি বিশেষজ্ঞ',
    bio: 'নুসরাত আমাদের হিজামা, কাপিং, আকুপ্রেশার ও রিল্যাক্সেশন থেরাপি সেশনের প্রধান থেরাপিস্ট।',
  },
};

/** Common treatment-name translations, applied to every matching service. */
const SERVICES = {
  'Laser Hair Removal': 'লেজার হেয়ার রিমুভাল',
  'Laser Skin Rejuvenation': 'লেজার স্কিন রিজুভিনেশন',
  'Laser Toning': 'লেজার টোনিং',
  'Carbon Laser Peel': 'কার্বন লেজার পিল',
  'Melasma Care': 'মেলাজমা কেয়ার',
  'Dark Spot Reduction': 'কালো দাগ হ্রাস',
  'Acne Treatment': 'ব্রণের চিকিৎসা',
  'Acne Scar Treatment': 'ব্রণের দাগের চিকিৎসা',
  'Open Pore Treatment': 'ওপেন পোর চিকিৎসা',
  'Skin Texture Improvement': 'ত্বকের মসৃণতা বৃদ্ধি',
  'Scar Reduction': 'দাগ হ্রাস',
  'Stretch Mark Care': 'স্ট্রেচ মার্ক কেয়ার',
  'Skin Brightening': 'ত্বক উজ্জ্বলকরণ',
  'Anti-Aging': 'বয়সের ছাপ প্রতিরোধ',
  'Fine Lines & Wrinkles': 'সূক্ষ্ম রেখা ও বলিরেখা',
  'Skin Tightening': 'স্কিন টাইটেনিং',
  'RF Skin Tightening': 'আরএফ স্কিন টাইটেনিং',
  HIFU: 'হাইফু',
  'Face Contouring': 'ফেস কনট্যুরিং',
  'Jawline Contouring': 'জ-লাইন কনট্যুরিং',
  'Double Chin Reduction': 'ডাবল চিন হ্রাস',
  'Body Contouring': 'বডি কনট্যুরিং',
  'Non-Surgical Fat Reduction': 'সার্জারিবিহীন মেদ হ্রাস',
  'Cellulite Care': 'সেলুলাইট কেয়ার',
  'Hair Fall Management': 'চুল পড়া নিয়ন্ত্রণ',
  'Hair Growth Support': 'চুল গজানোর সহায়তা',
  'PRP Hair Therapy': 'পিআরপি হেয়ার থেরাপি',
  'Scalp Rejuvenation': 'স্ক্যাল্প রিজুভিনেশন',
  'Dandruff & Scalp Care': 'খুশকি ও স্ক্যাল্প কেয়ার',
  'Ayurvedic Consultation': 'আয়ুর্বেদিক কনসালটেশন',
  'Prakriti Assessment': 'প্রকৃতি নির্ণয়',
  'Ayurvedic Nutrition': 'আয়ুর্বেদিক পুষ্টি',
  Abhyanga: 'অভ্যঙ্গ',
  Shirodhara: 'শিরোধারা',
  Swedana: 'স্বেদন',
  Nasya: 'নস্য',
  Basti: 'বস্তি',
  Virechana: 'বিরেচন',
  Pizhichil: 'পিঝিচিল',
  'Herbal Steam': 'হারবাল স্টিম',
  'Ayurvedic Detox': 'আয়ুর্বেদিক ডিটক্স',
  'Rejuvenation Programs': 'পুনরুজ্জীবন প্রোগ্রাম',
  'Naturopathy Consultation': 'ন্যাচারোপ্যাথি কনসালটেশন',
  'Natural Detox Programs': 'প্রাকৃতিক ডিটক্স প্রোগ্রাম',
  'Nutrition Guidance': 'পুষ্টি পরামর্শ',
  'Lifestyle Correction': 'জীবনযাত্রার সংশোধন',
  'Weight Management': 'ওজন নিয়ন্ত্রণ',
  Hydrotherapy: 'হাইড্রোথেরাপি',
  'Sitz Bath Therapy': 'সিটজ বাথ থেরাপি',
  'Contrast Water Therapy': 'কনট্রাস্ট ওয়াটার থেরাপি',
  'Mud Therapy': 'মাড থেরাপি',
  'Steam Therapy': 'স্টিম থেরাপি',
  'Herbal Therapy': 'হারবাল থেরাপি',
  'Therapeutic Bath': 'থেরাপিউটিক বাথ',
  'Hijama Therapy': 'হিজামা থেরাপি',
  'Wet Cupping': 'ওয়েট কাপিং',
  'Dry Cupping': 'ড্রাই কাপিং',
  'Cupping Therapy': 'কাপিং থেরাপি',
  'Acupuncture Therapy': 'আকুপাংচার থেরাপি',
  Acupressure: 'আকুপ্রেশার',
  Reflexology: 'রিফ্লেক্সোলজি',
  'Therapeutic Massage': 'থেরাপিউটিক ম্যাসাজ',
  'Ayurvedic Massage': 'আয়ুর্বেদিক ম্যাসাজ',
  'Head & Scalp Therapy': 'হেড ও স্ক্যাল্প থেরাপি',
  'Relaxation Therapy': 'রিল্যাক্সেশন থেরাপি',
  'Stress Relief Therapy': 'স্ট্রেস রিলিফ থেরাপি',
  'Diabetes Management Support': 'ডায়াবেটিস ব্যবস্থাপনা সহায়তা',
  'Obesity Management': 'স্থূলতা ব্যবস্থাপনা',
  'Metabolic Wellness': 'মেটাবলিক ওয়েলনেস',
  'PCOS Wellness': 'পিসিওএস ওয়েলনেস',
  'Hormonal Wellness': 'হরমোন ভারসাম্য',
  'Menstrual Wellness': 'মাসিক সংক্রান্ত সুস্থতা',
  'Fertility Wellness': 'প্রজনন সক্ষমতা',
  'Infertility Support': 'বন্ধ্যাত্ব সহায়তা',
  'Pre-Pregnancy Wellness': 'গর্ভধারণ-পূর্ব যত্ন',
  'Post-Pregnancy Wellness': 'প্রসব-পরবর্তী যত্ন',
  'Menopause Wellness': 'মেনোপজ ওয়েলনেস',
  'Digestive Health': 'হজম স্বাস্থ্য',
  'Gut Wellness': 'গাট ওয়েলনেস',
  'Liver Wellness': 'লিভার ওয়েলনেস',
  'Joint Wellness': 'জয়েন্ট ওয়েলনেস',
  'Back & Neck Wellness': 'কোমর ও ঘাড়ের সুস্থতা',
  'Muscle Wellness': 'পেশির সুস্থতা',
  Acne: 'ব্রণ',
  'Acne Scars': 'ব্রণের দাগ',
  Melasma: 'মেলাজমা',
  Hyperpigmentation: 'হাইপারপিগমেন্টেশন',
  'Dark Spots': 'কালো দাগ',
  'Uneven Skin Tone': 'অসম ত্বকের রং',
  'Sensitive Skin': 'সংবেদনশীল ত্বক',
  'Dry Skin': 'শুষ্ক ত্বক',
  'Oily Skin': 'তৈলাক্ত ত্বক',
  'Enlarged Pores': 'বড় লোমকূপ',
  'Sun Damage': 'রোদে পোড়া ক্ষতি',
  'Premature Aging': 'অকাল বার্ধক্য',
  Scars: 'দাগ',
  'Stretch Marks': 'স্ট্রেচ মার্ক',
  'Under-Eye Concerns': 'চোখের নিচের সমস্যা',
  'Intimate Wellness': 'ইনটিমেট ওয়েলনেস',
  'Vaginal Rejuvenation': 'ভ্যাজাইনাল রিজুভিনেশন',
  'Pelvic Floor Wellness': 'পেলভিক ফ্লোর ওয়েলনেস',
  'Sexual Health & Wellness': 'যৌন স্বাস্থ্য ও সুস্থতা',
  'Reproductive Wellness': 'প্রজনন স্বাস্থ্য',
  "Women's Wellness": 'নারী সুস্থতা',
  "Men's Wellness": 'পুরুষ সুস্থতা',
  'Healthy Aging': 'সুস্থ বার্ধক্য',
  Rejuvenation: 'পুনরুজ্জীবন',
  'Skin Rejuvenation': 'স্কিন রিজুভিনেশন',
  'Stress Management': 'স্ট্রেস ব্যবস্থাপনা',
  'Sleep Wellness': 'ঘুমের সুস্থতা',
};

async function run() {
  let n = 0;

  for (const [slug, v] of Object.entries(CATEGORIES)) {
    const r = await query(
      `UPDATE categories SET
         name_bn = COALESCE(NULLIF(name_bn, ''), ?),
         tagline_bn = COALESCE(NULLIF(tagline_bn, ''), ?),
         description_bn = COALESCE(NULLIF(description_bn, ''), ?)
       WHERE slug = ?`,
      [v.name, v.tagline, v.description, slug]
    );
    if (r.affectedRows) n++;
  }
  console.log(`  categories: ${n}`);

  let g = 0;
  for (const [slug, name] of Object.entries(GROUPS)) {
    const r = await query(
      "UPDATE service_groups SET name_bn = COALESCE(NULLIF(name_bn, ''), ?) WHERE slug = ?",
      [name, slug]
    );
    g += r.affectedRows;
  }
  console.log(`  service groups: ${g}`);

  let tm = 0;
  for (const [slug, v] of Object.entries(TEAM)) {
    const r = await query(
      `UPDATE team_members SET
         name_bn = COALESCE(NULLIF(name_bn, ''), ?),
         designation_bn = COALESCE(NULLIF(designation_bn, ''), ?),
         bio_bn = COALESCE(NULLIF(bio_bn, ''), ?)
       WHERE slug = ?`,
      [v.name, v.designation, v.bio, slug]
    );
    tm += r.affectedRows;
  }
  console.log(`  team members: ${tm}`);

  let sv = 0;
  for (const [en, bn] of Object.entries(SERVICES)) {
    const r = await query(
      `UPDATE services SET
         name_bn = COALESCE(NULLIF(name_bn, ''), ?),
         short_description_bn = COALESCE(NULLIF(short_description_bn, ''), ?)
       WHERE name = ?`,
      [bn, `স্কিনোভেদায় ${bn} — আপনার জন্য ব্যক্তিগত যত্ন।`, en]
    );
    sv += r.affectedRows;
  }
  console.log(`  services: ${sv}`);

  const [{ c }] = await query("SELECT COUNT(*) c FROM services WHERE name_bn IS NOT NULL AND name_bn <> ''");
  console.log(`\nBangla content seeded. ${c} of the services now have a Bangla name.`);
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
