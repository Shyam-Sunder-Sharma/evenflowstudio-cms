# Evenflowstudio Headless CMS

An editorial-grade, bilingual Headless Content Management System built for **Evenflowstudio**. Decoupled from rendering layers, this system provides a modern administration dashboard, a modular Plugins & Integrations system, an embedded Sanity Studio v3, and clean public REST APIs for seamless consumption by external web frontends (including PHP/WordPress, Next.js, or mobile apps).

---

## 🌟 Key Features

- **Decoupled Architecture**: Next.js App Router (TypeScript + Tailwind CSS) management interface backed by Sanity Content Lake.
- **Bilingual Content Modeling**:
  - **Blog Posts**: English & Polish slugs (`slugEn`, `slugPl`), draft/published workflow, categories, tags, author, date, excerpt, rich text, and asset upload.
  - **Portfolio Projects**: Polish & English slugs (`slugPl`, `slugEn`), multi-image gallery uploader, client, live URL, case study descriptions, and categories (`Book`, `T-shirt`, `Exhibition`, `Logo`, etc.).
  - **Taxonomies**: Independent section categories (`blog` vs `portfolio`).
- **Modular Plugins & Integrations**:
  - `/dashboard/plugins` management center to enable, configure, and inspect plugins without touching core blog/portfolio code.
  - **SEO & Meta Manager**: Meta title suffixes, OpenGraph fallbacks, and automatic `/api/public/sitemap.xml` XML sitemap generator.
  - **Sanity Media Library**: Direct connection to `/studio` centralized asset browser (`sanity-plugin-media`).
  - **Google Analytics**: GA4 Measurement ID management exposed via `/api/public/settings` for PHP header injection.
  - **Webhook & Auto-Sync**: Automated dispatch target for revalidating external staging or PHP frontends.
  - **GROQ Playground**: Embedded query playground (`@sanity/vision`) available at `/studio/vision`.
- **Editorial Dashboard**:
  - Live search and filtering across blogs, portfolio projects, and categories.
  - One-click publish / unpublish status toggling.
  - Safe deletion with modal confirmations.
  - Automatic slug generation with manual override.
  - Integrated image file upload directly to Sanity CDN.
- **Embedded Sanity Studio**: Full-featured studio available at `/studio`.
- **Public REST API**:
  - `GET /api/public/blogs` & `GET /api/public/blogs/[slug]`
  - `GET /api/public/portfolio` & `GET /api/public/portfolio/[slug]`
  - `GET /api/public/settings` (active plugin configs & keys)
  - `GET /api/public/sitemap.xml` (dynamic SEO XML sitemap)
- **Authentication**: JWT-based session management (`jose`) with HTTP-only cookies and Next.js middleware protection.

---

## 🔑 Default Admin Credentials

- **Login URL**: `http://localhost:3000/login`
- **Email**: `admin@evenflowstudio.com`
- **Password**: `Admin@12345`

---

## 🚀 Quick Start Guide

### 1. Environment Configuration

Create `.env.local` inside the project root:

```env
# Sanity Project Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID="1qgi0ztq"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_WRITE_TOKEN="your_sanity_write_token"

# Admin Authentication
ADMIN_EMAIL="admin@evenflowstudio.com"
ADMIN_PASSWORD="Admin@12345"
AUTH_SECRET="475cd4c8200e80bf924b94406c8b4251302e308bb36fc9e2e6e2a71422dc2daa"
```

A template is provided in `.env.example`.

### 2. Populate Sample Data (Seed)

Run the automated seeder to populate sample bilingual categories, articles, and portfolio case studies:

```bash
npm run seed
# or: npx tsx scripts/seed.ts
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- `/dashboard` — Editorial CMS Dashboard
- `/dashboard/plugins` — Modular Plugins & Integrations Center
- `/studio` — Embedded Sanity Studio (with Media & Vision)
- `/api/public/blogs` — Public JSON API for blog posts
- `/api/public/portfolio` — Public JSON API for portfolio projects
- `/api/public/settings` — Public Settings & Plugin Configs
- `/api/public/sitemap.xml` — Dynamic XML Sitemap

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## 📡 Public API Endpoints for External Consumers

| Endpoint | Method | Description |
|---|---|---|
| `/api/public/blogs` | `GET` | All published blog articles (supports `?category=`, `?tag=`, `?page=`, `?limit=`) |
| `/api/public/blogs/:slug` | `GET` | Single blog article matching either English or Polish slug |
| `/api/public/portfolio` | `GET` | All published portfolio projects (supports `?category=`, `?page=`, `?limit=`) |
| `/api/public/portfolio/:slug` | `GET` | Single portfolio project matching either Polish or English slug |
| `/api/public/settings` | `GET` | Dynamic plugin configs (SEO suffix, GA4 Measurement ID, Canonical URLs) |
| `/api/public/sitemap.xml` | `GET` | Dynamic XML sitemap of all published bilingual blog & portfolio pages |

For detailed integration snippets (including PHP `curl` examples and Sanity GROQ queries), see [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md).

---

## 📁 Project Architecture

```
evenflowstudio-cms/
├── docs/
│   └── INTEGRATION_GUIDE.md          # Architecture & PHP integration specs
├── scripts/
│   └── seed.ts                       # Database seeder for Sanity
├── src/
│   ├── actions/                      # Next.js Server Actions
│   │   ├── authActions.ts            # Admin login & session cookie handler
│   │   ├── blogActions.ts            # Blog CRUD, status toggle, asset upload
│   │   ├── portfolioActions.ts       # Portfolio CRUD, gallery upload
│   │   ├── categoryActions.ts        # Category taxonomy actions
│   │   └── pluginActions.ts          # Plugin toggle & configuration actions
│   ├── app/
│   │   ├── (auth)/login/             # Clean login page
│   │   ├── api/public/               # Read-only cached REST API
│   │   │   ├── blogs/                # Blog list & [slug] routes
│   │   │   ├── portfolio/            # Portfolio list & [slug] routes
│   │   │   ├── settings/             # Public plugin configs (GA, SEO)
│   │   │   └── sitemap.xml/          # Dynamic XML sitemap
│   │   ├── dashboard/                # Editorial admin UI
│   │   │   ├── blogs/                # Blog table, create & edit views
│   │   │   ├── portfolio/            # Portfolio table, create & edit views
│   │   │   ├── categories/           # Category manager
│   │   │   ├── plugins/              # Plugins & Integrations hub
│   │   │   └── page.tsx              # Overview stats dashboard
│   │   ├── studio/[[...tool]]/       # Embedded Sanity Studio (Media & Vision)
│   │   ├── layout.tsx                # Global root layout
│   │   └── page.tsx                  # Root redirect
│   ├── components/                   # Reusable UI & Dashboard components
│   │   ├── dashboard/                # Sidebar, tables, forms, managers
│   │   └── ui/                       # Confirmation modals & interactive UI
│   ├── lib/                          # Session JWT, slugify, Portable Text, Plugin registry
│   │   └── plugins/
│   │       └── registry.ts           # Typed registry of available plugins
│   ├── middleware.ts                 # Route protection for /dashboard/*
│   └── sanity/
│       ├── env.ts                    # Sanity environment variable loader
│       ├── lib/                      # Read client, write client, image builder
│       └── schemas/                  # Sanity content models (blog, portfolio, category, pluginConfig)
├── sanity.config.ts                  # Sanity Studio configuration (with Media & Vision)
├── package.json
└── tsconfig.json
```
