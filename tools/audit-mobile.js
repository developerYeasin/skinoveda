/**
 * Mobile layout audit.
 *
 * Loads every public route at phone width and reports anything that breaks the
 * layout: horizontal page overflow, elements past the right edge, text clipped
 * inside its own box, and form fields squeezed too narrow to use.
 *
 *   node tools/audit-mobile.js                 # default http://localhost:5175
 *   node tools/audit-mobile.js https://skinoveda.bizscal.com
 */
const BASE = process.argv[2] || 'http://localhost:5175';
const WIDTH = Number(process.env.WIDTH || 360);

const ROUTES = [
  '/', '/services', '/about', '/our-team', '/gallery',
  '/blog', '/contact', '/book-appointment',
  '/services/category/ayurveda',
];

const AUDIT = () => {
  const vw = document.documentElement.clientWidth;
  const out = {
    overflow: document.documentElement.scrollWidth - vw,
    offenders: [],
    clipped: [],
    narrowFields: [],
  };

  const ignored = (el) =>
    el.closest('.mobile-drawer, .lightbox, .modal-backdrop, .cat-nav-inner') ||
    ['svg', 'path', 'g', 'circle', 'ellipse', 'defs', 'stop', 'lineargradient', 'radialgradient', 'filter', 'fegaussianblur']
      .includes(el.tagName.toLowerCase());

  document.querySelectorAll('body *').forEach((el) => {
    if (ignored(el)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    const cls = (typeof el.className === 'string' ? el.className : '').trim().slice(0, 40);

    if (b.right > vw + 2) {
      out.offenders.push({ tag: el.tagName.toLowerCase(), cls, right: Math.round(b.right) });
    }

    const txt = (el.textContent || '').trim();
    if (txt && el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 30) {
      out.clipped.push({ cls, text: txt.slice(0, 38) });
    }
  });

  document.querySelectorAll('input, select, textarea').forEach((el) => {
    const w = el.getBoundingClientRect().width;
    if (w > 0 && w < 150) out.narrowFields.push({ type: el.type || el.tagName.toLowerCase(), width: Math.round(w) });
  });

  const uniq = (a, k) => { const m = new Map(); a.forEach((x) => m.set(k(x), x)); return [...m.values()]; };
  out.offenders = uniq(out.offenders, (x) => x.tag + x.cls).slice(0, 5);
  out.clipped = uniq(out.clipped, (x) => x.cls + x.text).slice(0, 5);
  return out;
};

(async () => {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('playwright is not installed here — run this audit from a machine that has it,');
    console.error('or check the routes manually at a 360px viewport.');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 780 } });

  let problems = 0;
  console.log(`Auditing ${BASE} at ${WIDTH}px\n`);

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(400);
    const r = await page.evaluate(AUDIT);

    const bad = r.overflow > 0 || r.offenders.length || r.clipped.length || r.narrowFields.length;
    if (bad) problems++;

    console.log(`${bad ? 'FAIL' : ' ok '}  ${route}`);
    if (r.overflow > 0) console.log(`        page overflows by ${r.overflow}px`);
    r.offenders.forEach((o) => console.log(`        past right edge: <${o.tag}> .${o.cls} (right ${o.right})`));
    r.clipped.forEach((c) => console.log(`        clipped text: "${c.text}" .${c.cls}`));
    r.narrowFields.forEach((f) => console.log(`        field too narrow: ${f.type} ${f.width}px`));
  }

  console.log(`\n${problems === 0 ? 'All routes clean.' : problems + ' route(s) need attention.'}`);
  await browser.close();
  process.exit(problems === 0 ? 0 : 1);
})();
