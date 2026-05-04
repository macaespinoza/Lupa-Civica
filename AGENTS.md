# AGENTS.md — Lupa Cívica (Prototipo v1)

## Project Identity

**Lupa Cívica** is a citizen transparency platform that audits the Chilean National Congress. It provides open data on legislators' attendance, probity (financial integrity under Ley 20.880 and Ley 20.730), and voting records. Features include a legislator directory with efficiency scores, a "Match Legislativo" quiz to find ideological affinity, and an accessibility system.

**Tagline:** "Fiscalización Ciudadana CL — Datos que Auditan"

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Runtime | React 19 |
| Styling | Tailwind CSS v4 (no tailwind.config.ts — uses `@theme` in globals.css) |
| Animations | `motion` (Framer Motion fork) — import from `motion/react` |
| Database | Google Cloud Firestore (native mode) |
| Auth | Firebase Auth (email/password + Google OAuth popup) |
| Icons | `lucide-react` |
| State | React Context API (`AuthProvider`, `AccessibilityProvider`) |
| HTTP client | `axios` |
| Scraping | `cheerio` + `axios` (server-side / CLI scripts) |
| Deployment | Docker → Google Cloud Run + Firebase Hosting (static export) |
| Validation | `zod` (installed but not yet used) |

---

## How to Run

```bash
# Development
npm run dev              # Next.js dev server (port 3000)

# Build & Export
npm run build            # Static export to /out

# Linting
npm run lint             # ESLint (flat config)

# Scraping (CLI, requires GOOGLE_APPLICATION_CREDENTIALS)
npm run scrape           # Full BCN + Senado.cl scrape (205 legislators)
npm run scrape:test      # Scrape only first 5 (dry run)
npm run upload:firestore # Upload scraped_data.json to Firestore

# Data utilities (npx tsx)
npx tsx scripts/seed-data.ts           # Seed hardcoded sample legislators
npx tsx scripts/check-data.ts          # Check Firestore legislator count
npx tsx scripts/check-firestore.ts     # Verify Firebase connection
npx tsx scripts/clean-and-verify.ts    # Deduplicate + validate scraped data
```

---

## Directory Map

```
Prototipo_v1/
├── app/                          # Next.js App Router (ALL PAGES)
│   ├── globals.css               # Tailwind v4 imports, @theme tokens, a11y overrides
│   ├── layout.tsx                # Root layout: fonts, metadata, AuthProvider + AccessibilityProvider
│   ├── page.tsx                  # Landing page (hero, stats, features, top legislators)
│   ├── legislators/
│   │   ├── page.tsx              # Legislator directory (search, filters, top3/bottom3)
│   │   └── [id]/
│   │       └── page.tsx          # Individual legislator detail (PLACEHOLDER — only 3 hardcoded IDs)
│   ├── match/
│   │   └── page.tsx              # "Match Legislativo" quiz (USES MOCK DATA)
│   └── metodologia/
│       └── page.tsx              # Scoring algorithm explanation
│
├── components/                   # Reusable UI components
│   ├── accessibility-toggle.tsx  # High-contrast + font-size toggle popup
│   ├── legislator-card.tsx       # Card: photo, score badge, party, region, email
│   └── login-modal.tsx           # Auth modal (email/password + Google)
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.tsx              # AuthContext + useAuth() hook
│   ├── use-legislators.ts        # useLegislators() — fetch from Firestore
│   └── use-mobile.ts             # useMobile() — responsive breakpoint (768px)
│
├── lib/                          # Core business logic
│   ├── accessibility-context.tsx # AccessibilityContext (high contrast, font size, persisted to localStorage)
│   ├── evaluator.ts              # calculateEfficiencyScore() — scoring algorithm
│   ├── firebase.ts               # Lazy Firebase init with Proxy pattern
│   ├── firestore-client.ts       # fetchLegislatorsFromFirestore() — client-side query
│   ├── mockData.ts               # Mock legislators & projects (demo/testing)
│   ├── sync-service.ts           # Server-side scrape+sync service (uses @google-cloud/firestore)
│   ├── types.ts                  # TypeScript interfaces (Legislator, Project, ScoreDetails)
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   └── scripts/
│       └── data-guide.ts         # Documentation of data sources and architecture
│
├── scripts/                      # Data pipeline (CLI scripts)
│   ├── scrape-legislators.ts     # MAIN SCRAPER v2.1 — BCN + Senado.cl (~560 lines)
│   ├── scrapeBCN.ts              # Legacy scraper (do NOT use for new work)
│   ├── upload-to-firestore.ts    # Batch upload JSON → Firestore
│   ├── seed-data.ts              # Seed hardcoded sample data
│   ├── check-data.ts             # Firestore count checker
│   ├── check-firestore.ts        # Firestore connection test
│   ├── clean-and-verify.ts       # Data quality: dedup + validate
│   ├── scraped_data.json         # Scraper output (gitignored)
│   ├── scraped_data_clean.json   # Deduplicated output (gitignored)
│   └── debug_bio.html            # Debug HTML for bio scraping
│
├── Dockerfile                    # Node 20, port 8080, Google Cloud Run
├── next.config.ts                # output: 'export', ignoreBuildErrors, transpilePackages
├── tsconfig.json                 # Path alias @/* → root, ES2017 target
├── postcss.config.mjs            # PostCSS + Tailwind CSS v4 plugin
├── eslint.config.mjs             # ESLint flat config (Next.js + Firebase rules)
├── firebase.json                 # Firebase Hosting + Firestore config
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # 7 composite indexes for Firestore
├── .env.example                  # Environment variables template
├── .env                          # Copy of .env.example
├── .env.local                    # *** ACTUAL SECRETS *** (gitignored)
├── lupa-civica-service-account.json  # GCP service account key (gitignored)
└── out/                          # Static export output (for Firebase Hosting)
```

---

## Architecture & Data Flow

### 1. Data Pipeline

```
BCN.cl + Senado.cl
       │
       ▼
scripts/scrape-legislators.ts (cheerio + axios)
       │  → paginates BCN listings (senators + deputies)
       │  → scrapes individual bio pages for party, region, image, bio
       │  → scrapes senado.cl for real email addresses (mailto: links)
       │  → gender detection via Spanish titles in biography
       │  → incremental saves to scraped_data.json (resumable)
       │
       ▼
scripts/scraped_data.json (gitignored, ~205 legislators)
       │
       ▼
scripts/upload-to-firestore.ts (batch write)
       │  → reads scraped_data.json
       │  → writes to Firestore "legislators" collection
       │
       ▼
Firestore (project: lupa-bdd)
       │
       ▼ (client-side)
hooks/use-legislators.ts → lib/firestore-client.ts
       │  → fetchLegislatorsFromFirestore()
       │  → ordered by "name" field
       │  → returns Legislator[] to React components
```

### 2. Scoring Algorithm (`lib/evaluator.ts`)

`calculateEfficiencyScore(legislator)` computes a 0–100 score:

| Factor | Weight |
|---|---|
| Attendance rate | Base 100, penalty: `(100 - rate) * 0.5` |
| Unjustified absences | -2 points each |
| Voting participation ≥ 95% | +5 bonus |
| Probity fines (UTM) under Ley 20.880 | -1 point per UTM, max -50 |
| Missed lobby registrations under Ley 20.730 | -5 points each |

Grade bands: ≥ 70 "Alto", ≥ 40 "Medio", < 40 "Bajo"

**Current state:** Real attendance/voting data is NOT scraped yet. Scores use `70 + Math.random() * 25` placeholder values in mock data. The algorithm is implemented and correct, but it operates on random inputs.

### 3. State Management

```
layout.tsx (server component — DO NOT add 'use client' here)
  └─ AuthProvider (hooks/use-auth.tsx)
       └─ AccessibilityProvider (lib/accessibility-context.tsx)
            └─ All pages (children)
```

- **AuthProvider:** Exposes `user`, `signInWithEmail()`, `signUpWithEmail()`, `signInWithGoogle()`, `signOut()`
- **AccessibilityProvider:** Exposes `highContrast`, `largeFontSize`, `toggleHighContrast()`, `toggleLargeFontSize()`. Persisted to `localStorage`. Applies `.accessibility-hc` and `.accessibility-fs-large` classes to `<html>`.

### 4. Firebase Lazy Initialization (`lib/firebase.ts`)

Uses ES6 Proxies to defer Firebase initialization — prevents errors during SSG/prerendering when `window` doesn't exist:

```typescript
// Import with: import { db, auth } from '@/lib/firebase'
// These are Proxy objects that auto-initialize on first access
export const db = new Proxy({}, { get: (_, prop) => getDb()[prop] })
export const auth = new Proxy({}, { get: (_, prop) => getAuthInstance()[prop] })
```

---

## Route Inventory

| Route | File | Type | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | Client | Complete |
| `/legislators` | `app/legislators/page.tsx` | Client | Complete |
| `/legislators/[id]` | `app/legislators/[id]/page.tsx` | SSG | **Placeholder** (3 hardcoded IDs, shows generic message) |
| `/match` | `app/match/page.tsx` | Client | **Mock data** (fake matching algorithm) |
| `/metodologia` | `app/metodologia/page.tsx` | Client | Complete |
| `/admin` | DOES NOT EXIST | — | **Missing** — linked from nav, 404 |
| `/projects` | DOES NOT EXIST | — | **Missing** — linked from nav, 404 |
| `/datos-abiertos` | DOES NOT EXIST | — | **Missing** — linked from footer, 404 |
| `/privacidad` | DOES NOT EXIST | — | **Missing** — linked from footer, 404 |

---

## Conventions & Code Style

### General Principles
- **All UI text is in Spanish** — including error messages, labels, alt text, aria labels.
- **All interactive pages are client components** (`'use client'` directive). Only `layout.tsx` and the legislator detail placeholder are server components.
- **Path alias:** `@/*` maps to project root. Always use `@/lib/...`, `@/components/...`, `@/hooks/...` for imports.
- **Use the `cn()` utility** from `@/lib/utils` for combining classes — it merges Tailwind conflicts via `tailwind-merge`.

### TypeScript
- Build type-checking is **disabled** (`ignoreBuildErrors: true` in next.config.ts). Eventually this should be re-enabled.
- Interfaces live in `lib/types.ts`. When adding new Firestore fields, update both `Legislator`/`Project` interfaces AND the Firestore rules.
- Run `npm run lint` before committing. ESLint errors are also ignored during build, but should be fixed.

### Styling (Tailwind v4)
- **No tailwind.config.ts.** All theme tokens are defined in `globals.css` via `@theme { --color-*: ... }`.
- Custom semantic color tokens:
  - `civic-teal`, `deep-civic` — primary palette
  - `forum-periwinkle`, `living-sage`, `warm-sand` — secondary
  - `action-amber`, `civic-coral` — accent
  - `score-high`, `score-mid`, `score-low` — performance colors
  - `forum-white`, `pale-stone`, `mist-grey`, `slate-shadow` — neutrals
- Typography conventions: very small labels (8–10px) with `uppercase` + `tracking-widest`, large serif headings (4xl–8xl) with `tracking-tighter`.
- Font families: Inter (`font-sans`), Space Grotesk (`font-display`), Playfair Display (`font-serif`).

### Accessibility
- `.accessibility-hc` — high contrast mode (true blacks/whites)
- `.accessibility-fs-large` — 115% font size
- Both classes are toggled by `AccessibilityToggle` component and applied to `<html>`.
- Semantic HTML is used: `<nav>`, `<section>`, `<main>`, `<article>`, `aria-label`, `role="navigation"`, `aria-expanded`.
- Skip link "Saltar al contenido principal" exists on the landing page.

### Components
- All reusable components in `components/` use `'use client'`.
- Animate with `motion/react` (NOT `framer-motion` directly — import from `motion/react`).
- Use `lucide-react` for all icons.
- Follow existing patterns for event handlers, state hooks, and motion variants.

### Firestore Document IDs
- Legislator IDs are URL-safe slugs derived from BCN wiki page names: `pedro-araya-guerrero`, `jorge-alessandri-vergara`, etc.
- This ID is used directly in the route `/legislators/[id]`.

### Scripts
- Data scripts use `npx tsx` as the runner (shebang-less `.ts` files).
- The main scraper (`scrape-legislators.ts`) supports `--dry-run`, `--limit N`, `--start-at N`.
- Scraper saves incrementally — if it crashes, resume with `--start-at <last_saved_index>`.

---

## Environment Variables

All required env vars are in `.env.example`. The `.env` file is a template copy. `.env.local` contains actual secrets and is gitignored.

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client: Firebase Auth/Firestore init |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client: Firebase init (`lupa-bdd`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client: Firebase init |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client: Firebase Auth |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client: Firebase Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client: Firebase Messaging |
| `NEXT_PUBLIC_FIREBASE_FIRESTORE_DB_ID` | Client: Firestore DB name |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server/scripts: Path to service account JSON |
| `GEMINI_API_KEY` | Not currently used (in .env but no source code references) |
| `APP_URL` | Cloud Run deployment URL |

**Security notes:**
- `lupa-civica-service-account.json` is gitignored but stores production GCP credentials.
- `.env.local` with live API keys is gitignored. Never commit it.
- The Firestore admin email in `firestore.rules` is `maca.creates@gmail.com` — change this for production.

---

## Current State & Known Gaps

### What Works
- Landing page, legislator directory, methodology page — fully functional.
- Firebase Auth (email + Google popup) — implemented, modal UI complete.
- Accessibility controls — implemented, persisted to localStorage.
- Web scraper — scrapes all 205 legislators from BCN + Senado.cl with pagination and incremental saves.
- Firestore upload pipeline — data flows from scraper → JSON → Firestore → client.
- Firestore security rules and indexes — configured.
- Docker / Cloud Run deployment — configured.
- Tailwind v4 theme system — fully built out with semantic tokens and animations.

### What's Incomplete / Missing
- **Legislator detail page (`/legislators/[id]`):** Only 3 hardcoded IDs in `generateStaticParams()`. Shows a generic placeholder message. Needs real content: bio, photo, stats, voting history, attendance chart, probity fines.
- **Legislative Match (`/match`):** Uses mock projects and a fake matching algorithm (ID parity). Needs real voting data and a proper ideological matching algorithm.
- **Admin dashboard (`/admin`):** Route doesn't exist. Needs a page for authenticated admin users to manage data, run syncs, view analytics.
- **Projects page (`/projects`):** Route doesn't exist. Linked from nav.
- **Datos Abiertos, Privacidad:** Routes don't exist. Linked from footer.
- **Real attendance/voting data:** The scraper gets bio info, party, region, email, and photo — but NOT attendance records, voting records, or probity fines. These are needed for the efficiency score to be meaningful.
- **Lobby/patrimony data:** Documented in `data-guide.ts` but not scraped.
- **Tests:** Zero test files in the project. No Jest, Vitest, or Playwright config.
- **Error boundaries:** No `error.tsx` files for the App Router. No React Error Boundaries.
- **Loading states:** Only basic CSS spinners. No `loading.tsx` skeletons.
- **Dual motion libraries:** Both `motion` and `framer-motion` are installed. Import from `motion/react` only.
- **`@hookform/resolvers` and `class-variance-authority`:** Installed but unused. Either use them or remove them.
- **TypeScript and ESLint ignored during build:** Eventually re-enable when stable.
- **Static export + Firebase Auth mismatch:** `output: 'export'` produces static HTML. Firebase Auth requires client-side JS — it works because it's client-side, but auth-protected routes won't have server-side protection.

### Scraper Versions — USE THE RIGHT ONE
- **Use `scripts/scrape-legislators.ts`** — this is the supported v2.1 scraper.
- `scripts/scrapeBCN.ts` is a **legacy** version — do not modify or use for new work.
- `lib/sync-service.ts` is a separate implementation — only use if you understand the architectural differences.

---

## Common Pitfalls

1. **Don't add `'use client'` to `layout.tsx`.** It wraps all pages with Context Providers using `'use client'` wrapper components — the layout itself stays a server component.

2. **Don't import `framer-motion` directly.** Use `import { motion, AnimatePresence } from 'motion/react'`.

3. **Don't access Firestore directly in components.** Use the `useLegislators()` hook or add new functions to `lib/firestore-client.ts`.

4. **Don't hardcode new routes in nav without creating the page.** There are already 5 dead links (admin, proyectos, datos-abiertos, privacidad). If you add a new nav link, also create the page or remove the link.

5. **Don't modify `firestore.rules` without understanding the implications.** The rules allow public read on `legislators`, `regions`, `parties`, `projects`, and individual votes. Write is restricted to one email.

6. **When adding new Fields to the Legislator interface,** update both `lib/types.ts` AND the scraper output AND the Firestore upload script AND the Firestore rules if relevant.

7. **The `generateStaticParams()` in `[id]/page.tsx`** only works with 3 hardcoded IDs. When the detail page is properly implemented, this needs to fetch all IDs from Firestore at build time, OR the page should become a client component with runtime fetching.

8. **Don't run the full scraper unnecessarily** — it hits BCN.cl ~200+ times. Use `--limit 5` for testing.

---

## Git Workflow

- **Single branch (`main`).** No branching strategy yet.
- **Commit messages are in Spanish**, mostly informal ("feat:", "fix:", "config:").
- **Never commit** `.env.local`, `lupa-civica-service-account.json`, `scraped_data.json`, or anything in `out/` or `.next/`.
- Run `npm run lint` before committing (even though build ignores ESLint, follow best practices).

---

## Development Priorities (Suggested Order)

1. **Build real legislator detail pages** (`/legislators/[id]`) — highest user value, currently placeholder.
2. **Scrape real attendance/voting/probity data** — makes the efficiency score meaningful.
3. **Replace mock Match data** — connect the quiz to real voting records.
4. **Build `/admin` dashboard** — for data management, sync triggers, and analytics.
5. **Create missing pages:** `/projects`, `/datos-abiertos`, `/privacidad`.
6. **Add tests** — at minimum, unit tests for `evaluator.ts` and data transformation utilities.
7. **Add error boundaries** — `error.tsx` files per route segment.
8. **Re-enable TypeScript and ESLint during build** once the codebase stabilizes.
9. **Implement proper loading skeletons** — `loading.tsx` files for each route.
10. **Clean up dependencies** — remove unused packages or integrate them.
