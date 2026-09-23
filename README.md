# 🌿 Skinoveda

**Laser • Aesthetic • Ayurveda • Naturopathy • Wellness Centre**

Full-stack website and admin dashboard. Node.js + Express + MySQL API, React + Vite front end,
Bangla-first bilingual UI, glassmorphism design, and a complete analytics/pixel dashboard.

```
skinoveda/
├── backend/     Node.js + Express + MySQL API
└── frontend/    React + Vite (public site + admin panel)
```

---

## Quick start

```bash
# 1. API
cd backend
npm install
npm run setup          # migrate + seed catalogue, Bangla copy and photos
npm run dev            # http://localhost:5000

# 2. Front end (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

**Admin:** `/admin/login` — `admin@skinoveda.com` / `Admin@123` (change it in Settings → My Account)

---

## Database

Configured in `backend/.env`:

```
DB_HOST=88.222.241.192
DB_PORT=3306
DB_USER=mini_social_user
DB_PASSWORD=mini_social123456
DB_NAME=skinoveda
```

| Script | What it does |
|---|---|
| `npm run migrate` | Creates all tables (idempotent) |
| `npm run migrate:bn` | Adds the `*_bn` Bangla content columns |
| `npm run seed` | Seeds the 7 specialities, 172 treatments, team, blog, settings |
| `npm run seed:bn` | Seeds Bangla translations |
| `npm run seed:media` | Assigns the bundled photography (`--force` to overwrite) |
| `npm run setup` | Runs all of the above in order |

### Tables

`users` · `categories` · `service_groups` · `services` · `team_members` · `appointments` ·
`gallery` · `blogs` · `testimonials` · `contact_messages` · `subscribers` · `settings` ·
`page_views` · `analytics_events` · `activity_logs`

---

## Service catalogue

Seeded from the content brief — **7 specialities, 22 groups, 172 treatments**:

| # | Speciality | Treatments |
|---|---|---|
| 01 | ✨ Aesthetic & Laser | 32 |
| 02 | 🌿 Ayurveda | 32 |
| 03 | 🍃 Naturopathy & Natural Therapy | 28 |
| 04 | 🪷 Therapy (Hijama, Cupping, Acupuncture) | 15 |
| 05 | 🩺 Health & Wellness | 29 |
| 06 | 🌸 Skin Health & Dermatology | 21 |
| 07 | 💜 Women's & Intimate Wellness | 15 |

Everything is editable in the admin panel — add, edit, reorder, hide, or delete.

---

## Bangla / English

**Bangla is the default language.** A BN/EN switch sits in the header and the choice is remembered.

- **Interface copy** lives in `frontend/src/i18n/translations.js`
- **Content** (services, categories, team, blog) has `*_bn` columns; the admin forms have a
  Bangla section on each edit screen
- Anything without a Bangla translation falls back to English automatically, so the site is never
  half-empty

---

## Pages

**Public** — Home · Services (full catalogue) · Category · Treatment detail · About · Team ·
Gallery · Blog · Blog post · Contact · Book Appointment · 404

**Admin** — Dashboard · Analytics · Realtime · Appointments · Messages · Subscribers ·
Categories · Services · Team · Gallery · Media Library · Blog · Testimonials ·
Pixel & Tracking · Settings

---

## Analytics & marketing

### Built-in (first-party)
Every public page view is recorded into your own database — no third party required.

- Visitors, sessions, page views, new vs returning, bounce rate, avg. time on page
- Traffic sources, UTM campaign performance, devices, browsers, operating systems
- Hour-of-day heat pattern, top pages, conversion events
- **Realtime** — active visitors in the last 5 minutes with a live visitor feed

### Third-party tags
Paste an ID in **Admin → Pixel & Tracking** and the tag loads on the next page view — no redeploy:

Google Tag Manager · Google Analytics 4 · Meta (Facebook) Pixel · TikTok Pixel ·
Google Ads (with conversion label) · Snapchat Pixel · LinkedIn Insight · Hotjar · Microsoft Clarity

### Events fired automatically

| Event | Fires when | Meta | TikTok |
|---|---|---|---|
| `page_view` | every page view | PageView | page |
| `appointment_booked` | booking submitted | **Lead** | SubmitForm |
| `book_appointment_click` | any booking button | InitiateCheckout | ClickButton |
| `service_view` | treatment page opened | ViewContent | ViewContent |
| `contact_submitted` | contact form sent | Contact | Contact |
| `newsletter_subscribe` | newsletter signup | Subscribe | Subscribe |
| `whatsapp_click` / `call_click` | contact button | Contact | — |

---

## Photography

The site ships with a curated royalty-free photo set in `backend/uploads/stock/`
(sourced from [Pexels](https://www.pexels.com), free for commercial use).

**To use your own photos** — Admin → Media Library → Upload, then paste the path into any
image field. Or replace the files in `backend/uploads/stock/` keeping the same names.

**To pull more from Pexels inside the panel** — add a free API key from
[pexels.com/api](https://www.pexels.com/api/) in Settings → Media, then use
Media Library → Find Stock Photos.

Image slots: hero, about, collection banner (Settings → Media) · category covers ·
team photos · treatment images · gallery albums.

---

## API

Base: `http://localhost:5000/api` — protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
|---|---|:--:|---|
| POST | `/auth/login` | — | Admin login |
| GET | `/auth/me` | ✓ | Current user |
| PUT | `/auth/change-password` | ✓ | Change password |
| GET | `/categories` | — | All specialities |
| GET | `/categories/:slug` | — | One speciality + its treatments |
| GET | `/services/catalog` | — | Full nested catalogue |
| GET | `/services/featured` | — | Homepage treatments |
| GET | `/services?category=&search=` | — | Search / filter |
| GET | `/services/:slug` | — | Treatment + related |
| POST | `/appointments` | — | Public booking |
| GET | `/appointments` | ✓ | Booking list |
| PUT | `/appointments/:id` | ✓ | Update status / assign |
| GET | `/appointments/track/:code` | — | Public booking lookup |
| POST | `/contact` · `/subscribers` | — | Contact form · newsletter |
| GET | `/team` · `/gallery` · `/blogs` · `/testimonials` | — | Public content |
| POST | `/analytics/track` · `/analytics/event` | — | Record a view / event |
| GET | `/analytics/overview?days=30` | ✓ | Full analytics report |
| GET | `/analytics/realtime` | ✓ | Live visitors |
| GET | `/dashboard/stats` | ✓ | Dashboard summary |
| GET | `/settings/public` · `/settings/tracking` | — | Site config · tag IDs |
| PUT | `/settings` | ✓ | Save settings |
| GET | `/media/stock/search?q=` | ✓ | Pexels search |
| POST | `/media/stock/import` | ✓ | Save a stock photo |
| GET | `/media/library` | ✓ | Uploaded files |
| POST | `/upload` | ✓ | Upload an image |

CRUD (`POST` / `PUT` / `DELETE`) is available on `/categories`, `/services`, `/team`,
`/gallery`, `/blogs`, `/testimonials` for admins.

---

## Design

- **Palette** — deep purple `#3A0F47 → #8A3BA3` with gold `#C79A4B → #E0BC72`
- **Type** — Cormorant Garamond (display), Jost (Latin body), Hind Siliguri (Bangla)
- **Glassmorphism** across every public page: `.glass`, `.glass-dark`, `.glass-gold`,
  `.glass-hover`, `.glass-sheen`, on an ambient purple canvas with floating blossom motifs
- Full-bleed hero, fully responsive down to phone width

Stylesheets: `global.css` (tokens, buttons, forms) · `site.css` (public + glass system) ·
`admin.css` (dashboard)

---

## Production

```bash
cd frontend && npm run build        # outputs dist/
cd backend  && npm start
```

Before going live:

1. Change `JWT_SECRET` in `backend/.env`
2. Change the admin password
3. Set `NODE_ENV=production` and `CLIENT_URL=https://yourdomain.com`
4. Serve `frontend/dist` from nginx and proxy `/api` and `/uploads` to the Node process
5. Add your GTM / Pixel / GA4 IDs in Admin → Pixel & Tracking

> In development the API accepts any `localhost` origin. In production it only accepts the
> origins listed in `CLIENT_URL`.

---

## Security notes

- Passwords hashed with bcrypt; JWT auth with a 7-day expiry
- Rate limiting on login (20 / 10 min), bookings (15 / hr) and contact (20 / hr)
- Helmet security headers, CORS allow-list, parameterised SQL everywhere
- Uploads restricted to images, 5 MB max; stock import accepts only `images.pexels.com`
- `pexels_api_key` is never exposed through the public settings endpoint
