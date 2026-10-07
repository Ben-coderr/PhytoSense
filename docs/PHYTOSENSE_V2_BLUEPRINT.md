# 🌿 PhytoSense v2 — Mobile, Resilient APIs, Agronomy & Smart Recommendations

> **Purpose of this document:** a complete engineering blueprint to evolve PhytoSense from a Next.js web app into a **React Native (Expo) mobile app**, backed by a **fault-tolerant multi-provider API layer** (if one API fails or runs out of quota, the next one takes over automatically), enriched with **agronomy data** and a new **"suggest plants for a need" engine** (e.g. skin care).
>
> **Facts about third-party APIs** (limits, prices, terms) were checked on **2026-10-05**. Free tiers change often — treat every number as a *ceiling to verify*, and let your code read real quota headers (see §6.5). Items marked **(verify)** come from general knowledge and were not re-checked.

---

## Table of Contents

1. [Goals & Scope](#1-goals--scope)
2. [What Changes: Old → New](#2-what-changes-old--new)
3. [Target Architecture](#3-target-architecture)
4. [New Repository Structure](#4-new-repository-structure)
5. [Mobile App (React Native + Expo)](#5-mobile-app-react-native--expo)
6. [Resilient Multi-Provider API Layer (the "never fails" system)](#6-resilient-multi-provider-api-layer)
7. [API Catalog (free sources, by capability)](#7-api-catalog)
8. [Data Layer Upgrade](#8-data-layer-upgrade)
9. [New Feature: "Suggest a Plant for My Need" (Skin Care & more)](#9-new-feature-suggest-a-plant-for-my-need)
10. [New Module: Agronomy / Cultivation](#10-new-module-agronomy--cultivation)
11. [Backend API v2 Contract](#11-backend-api-v2-contract)
12. [Security, Privacy & Licensing](#12-security-privacy--licensing)
13. [Testing, CI/CD & Deployment](#13-testing-cicd--deployment)
14. [Roadmap](#14-roadmap)
15. [PFE / Thesis Angle](#15-pfe--thesis-angle)
16. [Appendix: Code Snippets](#16-appendix-code-snippets)

---

## 1. Goals & Scope

| # | Goal | Success criterion |
|---|------|-------------------|
| G1 | Mobile app with **all** current web features | Camera ID, upload ID, fuzzy search, plant dossier, AI prediction, deep research, EN/FR/AR + RTL |
| G2 | **Never-fail** external dependencies | Any single API outage/quota exhaustion is invisible to the user (automatic failover + graceful degradation) |
| G3 | Offline-first | Search + plant dossier + recommendations work with **no internet** (155+ plants bundled) |
| G4 | Agronomy enrichment | Can this plant grow at my location? When to plant/harvest? How much water? Is my plant sick? |
| G5 | Need-based recommendations | "I have acne / dry skin / want to sleep better" → ranked plants with evidence level, safety warnings, how-to-use |
| G6 | Academic rigor | Every datum has provenance; AI output is labeled; evaluation protocol for the thesis |

**Out of scope (for now):** payments, social network, selling plants, medical diagnosis.

---

## 2. What Changes: Old → New

| Area | Current (web) | New (v2) | Why |
|------|---------------|----------|-----|
| Client | Next.js 16 + React 19 | **Expo (React Native) + Expo Router**, TypeScript | Native camera, offline DB, push notifications, app-store distribution |
| Animations | Framer Motion | **React Native Reanimated** | Framer Motion is DOM-only |
| Styling | Handwritten CSS glassmorphism | **NativeWind** (Tailwind for RN) + `expo-blur` for glass effect | CSS files don't exist in RN |
| i18n | Custom Context | **i18next + react-i18next + expo-localization**, shared JSON | Pluralization, interpolation, RTL helpers |
| Camera | WebRTC `getUserMedia` | **expo-camera** + **expo-image-picker** | Native APIs |
| Search | RapidFuzz on server only | **Server (RapidFuzz) + on-device (SQLite FTS5 / Fuse.js)** | Works offline |
| Plant ID | Pl@ntNet only | **Provider chain**: Pl@ntNet → Kindwise → vision LLM → on-device model → manual search | Resilience |
| LLM | Gemini only | **Provider chain**: Gemini → Groq → Cerebras → OpenRouter → Mistral → rule-based fallback | Resilience |
| Data | 155 plants, SQLite on Vercel | 155+ plants, **provenance per field**, Postgres (Supabase) on server + SQLite **bundle** on device | Updates, sync, scale |
| Backend hosting | Vercel serverless | **Long-running container** (Render / Fly / HF Spaces / Oracle free VM) + Upstash Redis | Circuit-breaker and quota state need memory shared across requests (serverless instances are stateless) |
| New | — | Recommendation engine, agronomy module, safety checker, plant journal, notifications | Project goals |

---

## 3. Target Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Expo / React Native)                    │
│  Screens: Scan • Search • Recommend • Garden(Cultivation) • Journal    │
│  ┌──────────────┐ ┌─────────────────┐ ┌───────────────────────────┐   │
│  │ TanStack     │ │ expo-sqlite      │ │ On-device model (TFLite)  │   │
│  │ Query cache  │ │ plants.sqlite    │ │ (optional offline ID)     │   │
│  └──────┬───────┘ └────────┬────────┘ └─────────────┬─────────────┘   │
└─────────┼──────────────────┼────────────────────────┼─────────────────┘
          │ HTTPS/JSON       │ offline fallback        │
          ▼                  ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND (v1 API)                        │
│  /identify  /plants  /recommend  /research  /cultivation  /diagnose    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PROVIDER ROUTER  (priority • health score • circuit breaker •   │   │
│  │                    quota tracker • timeout • cache • fallback)   │   │
│  └───┬───────────┬───────────┬───────────┬───────────┬─────────────┘   │
│      ▼           ▼           ▼           ▼           ▼                  │
│   Plant ID     LLM       Taxonomy    Chemistry    Agro/Weather          │
│   chain        chain     chain       chain        chain                 │
└──────┬───────────┬──────────┬───────────┬────────────┬─────────────────┘
       ▼           ▼          ▼           ▼            ▼
   Pl@ntNet     Gemini      GBIF       PubChem      Open-Meteo
   Kindwise     Groq        POWO       COCONUT      NASA POWER
   Vision-LLM   Cerebras    Wikidata   LOTUS        SoilGrids
   (on-device)  OpenRouter  iNaturalist ChEMBL      FAOSTAT
                Mistral
       │
       ▼
  Postgres (Supabase)  +  Redis (Upstash: cache, quota, breaker state)
```

**Key design principles**

1. **The phone never holds third-party API keys.** The app talks only to *your* backend. (Keys inside an APK/IPA can be extracted in minutes.)
2. **Capability-based abstraction.** The app asks for "identify this image", never "ask Pl@ntNet". The backend decides *who* answers.
3. **Every response says who answered** (`provider`, `confidence`, `is_ai_generated`) — vital for trust and for your thesis evaluation.
4. **Degrade, never crash.** The last link in every chain is local (DB lookup, rule-based text, "search by name").
5. **Offline-first on the device.** Bundled SQLite = the app is useful in the Sahara with zero signal.

---

## 4. New Repository Structure

A **monorepo** (pnpm workspaces + optional Turborepo) so mobile, backend, shared types, and data pipelines evolve together.

```
phytosense/
├── apps/
│   ├── mobile/                          # ⭐ React Native (Expo)
│   │   ├── app/                         # Expo Router (file-based navigation)
│   │   │   ├── _layout.tsx              # Root: providers (Query, i18n, theme), RTL setup
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx          # Bottom tab bar
│   │   │   │   ├── index.tsx            # Home (quick actions, daily plant, recent)
│   │   │   │   ├── scan.tsx             # Camera + gallery identification
│   │   │   │   ├── search.tsx           # Multilingual fuzzy search
│   │   │   │   ├── recommend.tsx        # "What do you need?" (skin care, sleep, …)
│   │   │   │   └── garden.tsx           # Cultivation: my plants, calendar, weather
│   │   │   ├── plant/[id].tsx           # Plant dossier (compounds, uses, safety, AI prediction)
│   │   │   ├── research/[taxon].tsx     # Deep research result for unknown plants
│   │   │   ├── diagnose.tsx             # Plant disease diagnosis
│   │   │   ├── journal/                 # Saved observations (photo + GPS + notes)
│   │   │   └── settings.tsx             # Language, units, offline DB update, about, disclaimer
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── identify/            # components/, hooks/useIdentify.ts, api.ts
│   │   │   │   ├── search/              # offlineSearch.ts (FTS5), onlineSearch.ts, normalizeArabic.ts
│   │   │   │   ├── plant/               # PlantCard, CompoundChips, SafetyBanner, PredictionPanel
│   │   │   │   ├── recommend/           # NeedPicker, ProfileForm, ResultList, ScoreBreakdown
│   │   │   │   ├── cultivation/         # SuitabilityCard, WaterPlan, PlantingCalendar
│   │   │   │   └── journal/
│   │   │   ├── components/ui/           # Button, Card, GlassCard, Chip, Skeleton, EmptyState
│   │   │   ├── lib/
│   │   │   │   ├── api/                 # client.ts (fetch wrapper, retry, auth), types (generated)
│   │   │   │   ├── db/                  # sqlite.ts, migrations, queries
│   │   │   │   ├── offline/             # queue.ts (pending uploads), netinfo.ts, sync.ts
│   │   │   │   ├── i18n/                # index.ts, rtl.ts (reload on language switch)
│   │   │   │   ├── ml/                  # tflite loader (optional offline ID)
│   │   │   │   └── theme/               # tokens.ts (emerald palette), fonts.ts
│   │   │   └── store/                   # Zustand: settings, userProfile (allergies, pregnancy…)
│   │   ├── assets/
│   │   │   ├── db/plants.sqlite         # prepackaged database (built by data pipeline)
│   │   │   ├── fonts/                   # Cairo / Tajawal (Arabic) + Inter
│   │   │   └── models/                  # *.tflite (optional)
│   │   ├── app.config.ts                # Expo config (permissions, plugins, scheme)
│   │   ├── eas.json                     # Build profiles (dev / preview / production)
│   │   ├── tailwind.config.js           # NativeWind
│   │   └── package.json
│   │
│   └── web/                             # (optional) your existing Next.js app, kept as-is
│
├── services/
│   └── api/                             # ⭐ FastAPI backend (refactored from /api)
│       ├── app/
│       │   ├── main.py                  # FastAPI app, CORS, middleware, lifespan
│       │   ├── core/
│       │   │   ├── config.py            # pydantic-settings (env vars, provider YAML path)
│       │   │   ├── logging.py           # structured JSON logs
│       │   │   ├── security.py          # device token / rate limiting
│       │   │   └── cache.py             # Redis + in-memory fallback
│       │   ├── api/v1/
│       │   │   ├── identify.py
│       │   │   ├── plants.py
│       │   │   ├── recommend.py
│       │   │   ├── research.py
│       │   │   ├── cultivation.py
│       │   │   ├── diagnose.py
│       │   │   ├── safety.py
│       │   │   ├── sync.py              # DB version manifest for mobile
│       │   │   └── health.py            # /health, /health/providers
│       │   ├── providers/               # ⭐ resilience core
│       │   │   ├── base.py              # Provider ABC, error types
│       │   │   ├── router.py            # ProviderRouter (failover logic)
│       │   │   ├── breaker.py           # CircuitBreaker
│       │   │   ├── quota.py             # QuotaTracker (daily/minute budgets)
│       │   │   ├── registry.py          # builds chains from providers.yaml
│       │   │   ├── plant_id/            # plantnet.py, kindwise.py, vision_llm.py
│       │   │   ├── llm/                 # gemini.py, openai_compat.py (Groq/Cerebras/OpenRouter/Mistral), rule_based.py
│       │   │   ├── taxonomy/            # gbif.py, powo.py, wikidata.py, inaturalist.py, local.py
│       │   │   ├── chemistry/           # pubchem.py, coconut.py, lotus.py, local.py
│       │   │   └── agro/                # open_meteo.py, nasa_power.py, soilgrids.py, faostat.py
│       │   ├── services/
│       │   │   ├── identify_service.py  # image → taxon → local/not-local decision
│       │   │   ├── search_service.py    # RapidFuzz + Arabic normalization
│       │   │   ├── prediction_service.py
│       │   │   ├── research_service.py  # deep research (cross-reference)
│       │   │   ├── recommend_service.py # ⭐ need-based recommender
│       │   │   ├── safety_service.py    # contraindications, toxicity, interactions
│       │   │   └── cultivation_service.py
│       │   ├── domain/                  # Pydantic models: Plant, Compound, Use, Evidence…
│       │   └── db/                      # SQLAlchemy models, Alembic migrations
│       ├── config/
│       │   ├── providers.yaml           # ⭐ priorities, timeouts, quotas per provider
│       │   ├── need_ontology.yaml       # ⭐ need → activities mapping (skin care etc.)
│       │   └── crop_params.yaml         # environmental ranges for cultivation scoring
│       ├── tests/                       # unit/, contract/, failover/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── pyproject.toml
│
├── packages/
│   ├── shared-types/                    # TS types generated from FastAPI OpenAPI (openapi-typescript)
│   └── i18n/                            # en.json, fr.json, ar.json (used by mobile + web)
│
├── data/                                # ⭐ data engineering pipeline
│   ├── raw/                             # tableau 2...xlsx (original)
│   ├── pipelines/
│   │   ├── 01_clean.py                  # your current data_cleaner.py
│   │   ├── 02_normalize_taxa.py         # GBIF/POWO accepted names + synonyms
│   │   ├── 03_enrich_compounds.py       # LOTUS/COCONUT/PubChem
│   │   ├── 04_enrich_cultivation.py     # temp/rain/pH ranges (flagged AI-assisted if from LLM)
│   │   ├── 05_build_activity_map.py     # compounds → activities → needs
│   │   ├── 06_embed.py                  # optional: embeddings
│   │   └── 07_build_sqlite.py           # → apps/mobile/assets/db/plants.sqlite
│   ├── curated/plants.json
│   └── review/                          # human validation sheets (for the thesis)
│
├── docs/                                # architecture.md, api.md, evaluation.md, data-provenance.md
├── infra/
│   ├── docker-compose.yml               # api + postgres + redis for local dev
│   └── github/workflows/                # ci-api.yml, ci-mobile.yml, eas-build.yml
├── .env.example
├── pnpm-workspace.yaml
└── README.md
```

### 4.1 Old file → new location

| Old file | New location | Notes |
|----------|--------------|-------|
| `api/main.py` | `services/api/app/main.py` | Add lifespan, middleware, versioned router |
| `api/routers/plants.py` | `services/api/app/api/v1/{plants,identify,recommend,research}.py` | Split by responsibility |
| `api/services/ai_service.py` | `providers/llm/*` + `services/{prediction,research}_service.py` | Provider logic separated from business logic |
| `api/services/plantnet_service.py` | `providers/plant_id/plantnet.py` | Becomes one provider among several |
| `api/models.py`, `schemas.py`, `db.py` | `app/db/`, `app/domain/` | Normalized schema (§8) |
| `data_cleaner.py` | `data/pipelines/01_clean.py` | Becomes step 1 of a pipeline |
| `plants.db` / `plants.json` | built by `07_build_sqlite.py` | Don't hand-edit |
| `src/i18n/translations.ts` | `packages/i18n/{en,fr,ar}.json` | Shared |
| `src/app/dashboard/page.tsx` | `apps/mobile/app/(tabs)/*` | Split into screens |
| `src/components/NavBar.tsx` | Tab bar in `(tabs)/_layout.tsx` | Burger menu → bottom tabs |
| `next.config.ts` proxy | `EXPO_PUBLIC_API_URL` env | App calls backend directly |
| `vercel.json`, `api/index.py` | `infra/` + `Dockerfile` | See §13 for why |

---

## 5. Mobile App (React Native + Expo)

### 5.1 Why Expo?

Expo (managed workflow + development builds + EAS) gives you camera, SQLite, notifications, file system, location, and OTA updates with no native code. You can still add native modules later through **development builds** (needed for TFLite). Create with `npx create-expo-app@latest` and use the **latest stable SDK** at that time.

### 5.2 Libraries

| Concern | Library | Notes |
|---------|---------|-------|
| Navigation | `expo-router` | File-based; mirrors the structure in §4 |
| Camera | `expo-camera` (`CameraView`) | Live capture; request permission at first use |
| Gallery | `expo-image-picker` | Upload from gallery |
| Image resize | `expo-image-manipulator` | Resize to ~1024px long edge, JPEG quality ~0.8 before upload (saves data, speeds ID) |
| Server state | `@tanstack/react-query` | Caching, retries, `networkMode: 'offlineFirst'` |
| Client state | `zustand` + `react-native-mmkv` | Settings, user safety profile (fast persistent storage) |
| Local DB | `expo-sqlite` | Prepackaged DB, FTS5 for offline search |
| Network status | `@react-native-community/netinfo` | Switch online/offline strategies |
| Styling | `nativewind` | Tailwind classes in RN |
| Glass effect | `expo-blur` (`BlurView`) | Replaces CSS `backdrop-filter` |
| Animation | `react-native-reanimated` | Replaces Framer Motion |
| Gestures/sheets | `react-native-gesture-handler`, `@gorhom/bottom-sheet` | Plant detail sheets |
| i18n | `i18next`, `react-i18next`, `expo-localization` | EN/FR/AR |
| Icons | `lucide-react-native` | You already use Lucide on web |
| Maps (journal) | `react-native-maps` or `expo-maps` | Observation map |
| Location | `expo-location` | Cultivation module + journal |
| Notifications | `expo-notifications` | Watering/harvest reminders |
| Secure storage | `expo-secure-store` | Device token |
| Offline ML (optional) | `react-native-fast-tflite` | Needs dev build, not Expo Go |
| Sharing/PDF | `expo-sharing`, `expo-print` | Export plant dossier |

### 5.3 Screen-by-screen specification

**Home** — greeting, 3 quick actions (Scan / Search / "What do you need?"), recently viewed, "plant of the day" (deterministic from local DB), offline badge.

**Scan** — live camera, shutter, gallery button, organ selector (leaf / flower / fruit / bark; Pl@ntNet accepts an organ hint and uses it to improve results). Flow:
1. Capture → resize → show preview.
2. `POST /v1/identify` (multipart). Show skeleton + "Identifying…".
3. Response: top 3 candidates with confidence bars, **provider badge** ("Pl@ntNet", "AI vision (lower reliability)").
4. If `found_local` → open dossier. Else → "Not in our Algerian catalog — run Deep Research?" button → `POST /v1/research`.
5. Offline → try on-device model (if installed) else save to the **pending queue** and notify when back online.

**Search** — one field, accent/diacritics tolerant, Arabic/Latin/French. Online: server RapidFuzz. Offline: local SQLite (§5.5). Filters: family, organ, use, region.

**Recommend** — see §9. A need picker (grid of icons: skin, hair, digestion, sleep/stress, respiratory, pain, immunity, culinary…) → sub-concern chips (acne, dry skin, eczema, wounds, anti-aging, sun-spots) → optional profile (pregnant? child? allergies? route: topical/oral) → ranked list with evidence badges and safety banners.

**Plant dossier** — header (photo, Latin/FR/AR names), sections: *Identity*, *Compounds* (chips by class), *Traditional uses* (with route and source), *AI prediction* (clearly labeled), *Safety*, *Cultivation* (suitability at your location), *Sources*. Actions: save to journal, share PDF, "similar plants".

**Garden** — location (GPS or manual), current weather, 7-day irrigation advice, planting window, plants you track.

**Diagnose** — photo of a sick leaf → disease candidates + advice (§10.6).

**Settings** — language (triggers RTL reload), units, "Update offline database", "Download offline model", legal disclaimer, data sources & licenses (attribution screen — required by several providers).

### 5.4 Internationalization & RTL (React Native specifics)

RTL is the most common stumbling block when porting a web app to RN.

```ts
// src/lib/i18n/rtl.ts
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

export async function applyDirection(lang: 'en' | 'fr' | 'ar') {
  const wantRTL = lang === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
    await Updates.reloadAsync();      // direction only changes after a JS reload
  }
}
```

Rules to follow:
- Use **logical style props** (`marginStart`, `paddingEnd`, `start`/`end`, `textAlign: 'auto'`) — never `marginLeft/Right` for layout that should mirror.
- Mirror directional icons (back arrows, chevrons) when `I18nManager.isRTL`.
- Use an Arabic-capable font (Cairo, Tajawal via `@expo-google-fonts/*`).
- Numbers: decide between Western (0-9) and Arabic-Indic digits; Algerian usage is typically Western digits.
- Test every screen in Arabic *early*; retrofitting is painful.
- Keep Latin names in `LTR` isolation inside Arabic text (wrap in `<Text style={{writingDirection:'ltr'}}>`).
- Enable RTL support in the app config per Expo's localization docs and rebuild the dev client once.

### 5.5 Offline-first search & data

1. **Prepackaged DB:** `assets/db/plants.sqlite` generated by the data pipeline. On first launch copy it to the app's SQLite directory (expo-sqlite provides an asset-import helper — check current docs for the exact function name).
2. **FTS5 virtual table** over normalized names (Latin, French, Arabic, synonyms):
   ```sql
   CREATE VIRTUAL TABLE plant_fts USING fts5(
     latin, fr, ar, synonyms, notes, content='plant_names', tokenize='unicode61 remove_diacritics 2'
   );
   ```
3. **Normalization before indexing *and* before querying** (critical for Arabic):
   - strip tashkeel (diacritics) and tatweel (ـ)
   - unify alef variants (أ إ آ → ا), ya/alef-maqsura (ى → ي), ta-marbuta (ة → ه) for matching
   - lowercase + strip accents for French/Latin
4. **Typo tolerance:** FTS5 prefix queries (`term*`) for most cases + a small JS fuzzy fallback (Fuse.js or a Levenshtein on the top 200 candidates) when FTS returns < 3 rows.
5. **DB updates:** `GET /v1/sync/manifest` returns `{db_version, sha256, url, size}`. If newer than local, download in the background over Wi-Fi, verify the hash, swap atomically.
6. **User data stays separate:** journal and favorites live in a *second* SQLite file so a DB update never erases them.

### 5.6 API client with offline fallback (concept)

```ts
// src/lib/api/client.ts
const BASE = process.env.EXPO_PUBLIC_API_URL!;

export async function api<T>(path: string, init: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// Search: server first, local second — same return type
export async function searchPlants(q: string, online: boolean): Promise<PlantHit[]> {
  if (online) {
    try { return await api(`/v1/plants/search?q=${encodeURIComponent(q)}`); }
    catch { /* fall through to local */ }
  }
  return localSearch(q);   // SQLite FTS5
}
```

### 5.7 Offline plant identification (optional, advanced)

- **Why:** the only way to identify with *zero* connectivity, and a last-resort tier in the provider chain.
- **How:** train/fine-tune a lightweight CNN (MobileNetV3 / EfficientNet-Lite) and export to **TFLite**. A public dataset to start from is **PlantNet-300K** (published at NeurIPS 2021, released by the Pl@ntNet team on GitHub) — check its licence before use. Better: fine-tune on photos of **your 155 species** (collect from GBIF/iNaturalist research-grade observations in Algeria + your own photos).
- **Run:** `react-native-fast-tflite` in a development build; ship a ~5–20 MB model as optional download.
- **Be honest in the UI:** label offline results "approximate".
- Treat this as a **phase 5** item; it does not block the rest.

### 5.8 Performance & UX checklist

- Compress images before upload; send one image per organ.
- `FlashList` (Shopify) for long lists.
- Skeleton loaders instead of spinners; optimistic UI for favorites.
- Cache plant dossiers (React Query `staleTime` large; the data rarely changes).
- Haptics on capture; permission rationale screens in all three languages.
- Accessibility: min touch target 44pt, dynamic font scaling, screen-reader labels (Arabic too).

---

## 6. Resilient Multi-Provider API Layer

This is the heart of "make sure it always works".

### 6.1 Concept

For each **capability** (plant ID, LLM, taxonomy, chemistry, weather, soil…) you declare an **ordered chain** of providers. A **router** tries them in order, skipping any that are currently broken or out of quota, and returns the first acceptable result. If the whole chain fails, a **local fallback** answers.

```
request ─► Router(capability="llm")
              │
              ├─ Gemini ........ breaker CLOSED, quota ok ──► try ──✗ 429 ──► open breaker (cooldown from Retry-After)
              ├─ Groq .......... ok ──► try ──✗ timeout ──► record failure
              ├─ Cerebras ...... ok ──► try ──✓ result ──► return (provider="cerebras")
              ├─ OpenRouter .... (not reached)
              └─ rule_based .... (local, never fails)
```

### 6.2 Building blocks

| Block | Responsibility |
|-------|----------------|
| **Provider** | One adapter per external service. Converts the *common request* into the vendor call and the vendor response into the *common response schema*. |
| **CircuitBreaker** | After N consecutive failures (or a 429 with `Retry-After`) the provider is skipped until a cooldown elapses; then one "half-open" probe is allowed. Prevents wasting time on a dead service. |
| **QuotaTracker** | Counts calls per window (per-minute, per-day) against configured budgets; also *learns* from rate-limit headers when present. Skips a provider **before** it returns 429. |
| **Health score** | EWMA of success rate and latency → used to reorder providers of equal priority. |
| **Timeouts** | Per-provider hard timeout (e.g. 8 s for ID, 20 s for LLM). A slow provider is a failed provider. |
| **Validator ("accept" function)** | A provider may *succeed technically* but return junk (low-confidence ID, invalid JSON). The router treats that as failure and moves on. |
| **Cache** | Keyed by (capability, normalized input hash). Plant facts: 30 days; weather: 1–3 h; image ID: hash of the resized image (perceptual hash for near-duplicates). |
| **Local fallback** | Final link: DB lookup, template text, or "please search by name". |
| **Telemetry** | Every call logs `provider, latency, outcome, fallback_depth`. Powers `/health/providers` and your thesis charts. |

### 6.3 Provider configuration (`providers.yaml`)

```yaml
# services/api/config/providers.yaml
plant_id:
  accept: { min_top_score: 0.15 }       # below this → treat as failure, try next
  chain:
    - name: plantnet
      priority: 1
      timeout_s: 10
      quota: { per_day: 450 }            # keep a safety margin under the 500/day free limit
      env_key: PLANTNET_API_KEY
    - name: kindwise
      priority: 2
      timeout_s: 10
      quota: { per_day: 3 }              # only ~100 trial credits in total → emergency use
      env_key: KINDWISE_API_KEY
    - name: vision_llm                    # multimodal LLM as a low-confidence tier
      priority: 3
      timeout_s: 20
      flag_low_reliability: true
    - name: on_device                     # handled client-side; backend returns hint
      priority: 9

llm:
  accept: { valid_json: true }
  chain:
    - { name: gemini,     priority: 1, timeout_s: 25, env_key: GEMINI_API_KEY,     model: "${GEMINI_MODEL}" }
    - { name: groq,       priority: 2, timeout_s: 15, env_key: GROQ_API_KEY,       model: "${GROQ_MODEL}",
        base_url: "https://api.groq.com/openai/v1", quota: { per_minute: 25, per_day: 900 } }
    - { name: cerebras,   priority: 3, timeout_s: 15, env_key: CEREBRAS_API_KEY,   model: "${CEREBRAS_MODEL}",
        base_url: "https://api.cerebras.ai/v1" }
    - { name: openrouter, priority: 4, timeout_s: 30, env_key: OPENROUTER_API_KEY, model: "openrouter/free",
        base_url: "https://openrouter.ai/api/v1", quota: { per_minute: 18, per_day: 45 } }
    - { name: mistral,    priority: 5, timeout_s: 20, env_key: MISTRAL_API_KEY,    model: "${MISTRAL_MODEL}",
        base_url: "https://api.mistral.ai/v1" }
    - { name: rule_based, priority: 99 }   # no network: builds text from DB activity tags

taxonomy:
  chain: [gbif, powo, wikidata, inaturalist, local]
chemistry:
  chain: [local, lotus, coconut, pubchem]
weather:
  chain: [open_meteo, nasa_power]
soil:
  chain: [soilgrids, local_defaults]
```

> **Model names go in env vars, not code.** Free-tier model rosters change every few months (the README's `gemini-2.5-flash` is already one of those). Never hardcode them.

### 6.4 Reference implementation (core of `providers/`)

See the full code in [Appendix A](#a-provider-router-python). It implements: `Provider` ABC, `CircuitBreaker`, `QuotaTracker`, `ProviderRouter.run()` with timeout, validation, and telemetry.

### 6.5 Rules that keep you out of trouble

1. **Do not rotate multiple free accounts to dodge a quota where the terms forbid it.** Pl@ntNet explicitly allows **one free account per person/entity** and forbids several free accounts from the same IP. OpenRouter governs capacity globally, and Gemini limits apply **per project**, not per key — so "key pooling" doesn't multiply capacity there either. **Resilience comes from *different providers*, not duplicate accounts.**
2. **Treat published limits as ceilings.** Real behavior shifts. Sources even disagree on current Groq/Gemini numbers. Your quota tracker should (a) start from the YAML number, (b) read `x-ratelimit-*` / `Retry-After` headers and adjust, (c) react to the first 429 by opening the breaker.
3. **Keep a safety margin** (e.g. 90 % of the daily limit) so a burst doesn't tip you over.
4. **Never send personal data to free LLM tiers.** Some free tiers use prompts to improve their products (Gemini free tier; Mistral's free "Experiment" tier requires opting into training). Send plant names and compound lists, never user identity, photos of people, or health history. For the recommender, send only anonymous flags ("pregnant: true"), never free-text diaries.
5. **Normalize outputs.** All LLM providers must return the *same Pydantic schema*; validate and, if invalid, retry once with a "return only valid JSON" repair prompt before failing over.
6. **Consensus mode (optional, for ID):** if the top score is < 0.5, query a second provider and compare. Agreement → boost confidence; disagreement → show both and say so.
7. **Serverless caveat:** breaker/quota state must survive between requests → store in **Redis (Upstash free tier)** or run a single long-lived container. On Vercel serverless, in-memory state resets, so counters would be wrong.
8. **Alternative to hand-rolling:** the open-source **LiteLLM** library has router/fallback/cooldown features for LLM chains, and there are community gateways that pool free tiers. Writing your own (Appendix A) is better for the thesis and for non-LLM capabilities (plant ID, weather), and you can still wrap LiteLLM *inside* one provider.

### 6.6 Health endpoint

`GET /v1/health/providers` →

```json
{
  "llm": [
    {"name":"gemini","state":"open","opens_until":"2026-10-05T14:03:11Z","success_rate_1h":0.41,"p50_ms":2100},
    {"name":"groq","state":"closed","quota_used_today":212,"quota_limit":900,"success_rate_1h":0.99,"p50_ms":640}
  ],
  "plant_id": [ ... ]
}
```
Use it in an admin screen, UptimeRobot-style monitoring, and your failover tests.

### 6.7 Failover test plan (add to CI)

| Test | How | Expected |
|------|-----|----------|
| Provider 429 | mock returns 429 + `Retry-After: 30` | breaker opens ≥30 s, next provider answers, user sees result |
| Timeout | mock sleeps > timeout | failover, latency logged |
| Garbage JSON | mock returns text | repair retry → else failover |
| Low-confidence ID | mock top_score=0.05 | next provider tried |
| All providers down | all mocks fail | local fallback response with `degraded: true` |
| Quota exhausted | set counter at limit | provider skipped *without* a network call |
| Recovery | after cooldown, mock OK | provider returns to rotation |
| Chaos switch | env `CHAOS_FAIL=plantnet,gemini` | end-to-end app still works |

---

## 7. API Catalog

Legend — **Key:** needs signup/API key. **Fit:** ⭐ strongly recommended, ○ optional.

### 7.1 Plant identification (image → species)

| Provider | Free allowance (verified 2026-10-05) | Key | Role | Notes |
|----------|-------------------------------------|-----|------|-------|
| ⭐ **Pl@ntNet API** (`my-api.plantnet.org`) | **500 identifications/day**, 50,000+ species, 50+ languages; max 20 simultaneous requests; commercial use beyond 500/day is paid; non-profit educational/scientific projects can request more | Yes | **Primary** | One free account per person/entity. Non-profit plan requires a "powered by Pl@ntNet" logo. Has quota endpoints (`/v2/quota`, `/v2/quota/daily`) you can poll. Also exposes disease/variety identification routes. |
| ⭐ **Kindwise Plant.id** | **100 free credits** on signup (1 credit/ID); public demos limited to 10 IDs/month; afterwards ~€0.01–0.05 per credit | Yes | **Emergency tier** | Not a sustainable free source — use as a 3-ID-per-day safety net or for **health assessment** (disease). The Search endpoint is free; Detail endpoint is 0.5 credit. |
| ⭐ **Vision-capable LLM** (Gemini Flash; OpenRouter `:free` vision models; others) | Within each LLM's free quota | Yes | **Low-confidence tier** | Ask for strict JSON `{species, confidence, reasoning}`. Always label "AI estimate — verify". Prone to confident mistakes. |
| ○ **iNaturalist** | Public read API for taxa/observations (no key for reads **(verify)**); its computer-vision model is *not* a general-purpose open API **(verify)** | — | Taxonomy, observations, Algerian occurrences | Great for **names, ranges, photos**, not for vision. |
| ○ **On-device TFLite model** | Unlimited, offline | — | **Final offline fallback** | See §5.7. |
| ○ **Trefle** (`trefle.io`) | 60 req/min; one third-party listing says 1,000/day; project is "beta" and has had downtime | Yes | Plant facts (not ID) | Repo still active in 2026; **don't rely on it as a single source**. |

### 7.2 LLM / reasoning (text, JSON, vision)

| Provider | Free tier snapshot (sources conflict → verify in console) | OpenAI-compatible | Role / catch |
|----------|-----------------------------------------------------------|-------------------|--------------|
| ⭐ **Google Gemini** (AI Studio) | Free Flash-class models; limits are **per project** and depend on tier; Google cut free limits in late 2025; free tier prompts may be used to improve Google products | Has its own SDK + an OpenAI-compat endpoint **(verify)** | **Primary** (1M context, vision, structured output). |
| ⭐ **Groq** | ~30 requests/min, ~1,000/day on larger open models; token caps (e.g. ~8–12K TPM, ~100–200K TPD depending on model) | Yes (`https://api.groq.com/openai/v1`) | Fastest; great fallback #1. Token cap often binds before request cap. |
| ⭐ **Cerebras** | ~1M tokens/day on trial/free tier; ~30K TPM; low RPM | Yes (`https://api.cerebras.ai/v1`) | High daily token volume → good for batch enrichment scripts. Model list changes (some models deprecated in 2026). |
| ⭐ **OpenRouter** (`openrouter/free` and `:free` models) | ~20 req/min, **50/day** (1,000/day once you've ever bought $10 credit); roster of free models changes constantly | Yes | Broad model choice; tiny daily cap without top-up. |
| ○ **Mistral (La Plateforme)** | Free "Experiment" tier, large monthly token allowance; numeric limits only visible in console; **requires opting into data training** | Yes | OK as late fallback; avoid for anything sensitive. |
| ○ **Cloudflare Workers AI** | Daily free neuron allowance **(verify)** | REST | Extra fallback; limited per-request size. |
| ○ **Ollama (self-hosted)** | Unlimited, your hardware | Yes (OpenAI-compat) | Dev/offline server fallback on a VPS or your laptop. |
| ⭐ **Rule-based generator** (yours) | ∞ | — | **Terminal fallback:** build a prediction paragraph from DB activity tags + templates (EN/FR/AR). Zero network. |

### 7.3 Botanical taxonomy, distribution & general plant info

| Provider | Free | Key | Use in PhytoSense |
|----------|------|-----|-------------------|
| ⭐ **GBIF API** (`api.gbif.org/v1`) | Free, open **(verify limits)** | No | Name matching (`/species/match`), accepted name + synonyms, **occurrences in Algeria** (`/occurrence/search?country=DZ&scientificName=…`) → "native/common in your region", maps. |
| ⭐ **POWO / IPNI (Kew)** | Free | No | Accepted names, native range, descriptions (via `pykew` client). |
| ⭐ **Wikidata + Wikipedia REST** | Free, CC licences | No | Multilingual labels (**Arabic & French names**), images, short descriptions (`/api/rest_v1/page/summary/{title}` on `ar.`, `fr.`, `en.` subdomains). Attribution required (CC BY-SA). |
| ○ **World Flora Online** | Free downloads/name-matching **(verify)** | No | Backbone taxonomy cross-check. |
| ○ **Tela Botanica** (Mediterranean/French flora) | Free API **(verify)** | — | Mediterranean-flavored descriptions in French. |
| ○ **African Plant Database (Geneva)** | Free web data **(verify)** | — | North-African distribution cross-check. |
| ○ **Perenual** | **100 requests/day**; free keys cover only species IDs ~1–3000; **free tier non-commercial** | Yes | Garden-oriented care data; limited. |
| ○ **Permapeople** | Free self-service key; data is **share-alike** | Yes | Companion planting links. |
| ○ **Trefle** | see §7.1 | Yes | Growth/specification fields (pH, temp ranges) when present. |

### 7.4 Phytochemistry & bioactivity (the scientific core)

| Provider | What it gives | Access |
|----------|---------------|--------|
| ⭐ **LOTUS** (on Wikidata + `lotus.naturalproducts.net`) | 700,000+ **structure–organism–reference** triples: *which compound is found in which plant, with a citation* | SPARQL on Wikidata + LNPN API/bulk dumps |
| ⭐ **COCONUT 2.0** (`coconut.naturalproducts.net`) | 400,000+ natural products (aggregated from ~50 open sources); **REST API, no login**; bulk SDF/CSV/DB dump | REST + download |
| ⭐ **PubChem PUG-REST / PUG-View** | Compound properties, synonyms, bioassay links. Rate-limited (~5 req/s **(verify)**) | Free, no key |
| ⭐ **ChEMBL REST** | Bioactivity measurements (targets, IC50) for compounds | Free, no key |
| ○ **ChEBI** | Ontology of chemical roles ("antioxidant", "anti-inflammatory agent") — **great for mapping compounds → activities** | Free |
| ○ **IMPPAT 2.0** | 4,010 Indian medicinal plants, 17,967 phytochemicals, 1,095 therapeutic uses — useful for cross-validation | Open web access (check licence) |
| ○ **ANPDB / AfroDB** | African natural products (relevant to North/Saharan flora) | Open datasets |
| ○ **CMAUP, FooDB** | Useful-plant–compound associations; FooDB = food compounds | Bulk downloads |
| ○ **EMA/HMPC herbal monographs**, **WHO monographs** **(verify)** | **Regulatory-grade evidence** (well-established use vs traditional use) → feeds your evidence grade | Public PDFs → curate manually |

**Strategy:** *don't call these live per user request.* Fetch them in the **data pipeline** (`03_enrich_compounds.py`), store results with provenance in your DB, and use the live APIs only for *unknown plants* in Deep Research.

### 7.5 Skin-care / cosmetic ingredient sources (for §9)

| Source | Use |
|--------|-----|
| **EU CosIng database** (open dataset) **(verify)** | Official cosmetic ingredient list with INCI names and **functions** (emollient, antioxidant, skin conditioning…) and restrictions |
| **Open Beauty Facts** (open DB + API) **(verify)** | Real cosmetic products by ingredient (cross-check which plants are used commercially) |
| **EMA/HMPC monographs** | Topical-use evidence for e.g. Calendula, Aloe |
| **Your dataset** | Algerian traditional topical uses (the unique value) |

### 7.6 Agronomy, climate, soil, crops

| Provider | Gives | Free | Key | Notes |
|----------|-------|------|-----|-------|
| ⭐ **Open-Meteo** | Forecast + historical weather (ERA5), **ET₀ (FAO-56)**, soil temperature & moisture by depth, GDD inputs | Free | No | Attribution CC BY 4.0; free API is for **non-commercial** use **(verify)** |
| ⭐ **NASA POWER** (agroclimatology community) | Daily climate since 1981: temperature, rainfall, radiation, humidity | Free | No | Fallback for Open-Meteo; good for climatology normals |
| ⭐ **ISRIC SoilGrids v2** (`rest.isric.org`) | 250 m global soil maps: **pH, clay/sand/silt, organic carbon, nitrogen, CEC** at several depths | Free | No | Can take several seconds; city-centre pixels may be "no data" → retry nearby coordinates; **cache aggressively** (soil doesn't change) |
| ⭐ **FAOSTAT** | Crop production/area/yield, prices, trade by country since 1961; API + **bulk downloads** | Free | No | National-scale context (e.g. Algeria's aromatic/medicinal crops) |
| ○ **FAO ECOCROP** dataset **(verify)** | Environmental requirements (temp, rainfall, pH, altitude) for ~2,000 species | Free download | No | Template for your own `crop_params.yaml` scoring |
| ○ **WorldClim / CHELSA** climate rasters **(verify)** | Bioclimatic variables for suitability modelling | Free download | No | Precompute per-wilaya values offline |
| ○ **Copernicus Data Space / Sentinel Hub** **(verify)** | Sentinel-2 imagery → NDVI | Free tier | Yes | Phase 6+; heavy |
| ○ **Google Earth Engine** **(verify)** | Planetary-scale raster analysis | Free for non-commercial | Yes | Server-side batch only |
| ○ **World Bank API** | Country agri indicators | Free | No | Context charts |
| ○ **PlantVillage / PlantDoc datasets** **(verify)** | Labeled diseased-leaf images | Free | No | Train an **on-device disease model** |
| ○ **Kindwise crop.health / plant.health** | Disease/pest diagnosis | 100 trial credits then paid | Yes | Emergency tier for §10.6 |
| ○ **Open Food Facts** | Food composition (for culinary-use plants) | Free | No | Optional |

**Algeria-specific, offline sources (not APIs):** INRAA/ITAF publications, Quézel & Santa *Nouvelle Flore de l'Algérie*, university theses on medicinal plants (you already used one), ONM climate normals (request data), local herbalist interviews (with consent). These make your dataset unique.

### 7.7 Supporting services (infrastructure)

| Need | Free option |
|------|-------------|
| Postgres + auth + storage | Supabase free tier |
| Redis (cache, quotas, breaker state) | Upstash free tier |
| Hosting API | Render / Fly.io / Railway free or low-cost tiers (check current terms), Hugging Face Spaces (Docker), Oracle Cloud always-free VM |
| Error tracking | Sentry free tier |
| Uptime | UptimeRobot / Better Stack free |
| Mobile builds | Expo EAS free tier (limited builds/month) |
| Push notifications | Expo Push Service |
| Maps tiles | OpenStreetMap (respect tile usage policy) / MapLibre |
| Geocoding | Nominatim (strict usage policy) / Open-Meteo geocoding API |

---

## 8. Data Layer Upgrade

### 8.1 Why change the schema

Currently one flat `Plant` table with text columns (compounds, activities as strings). That cannot answer "which plants have **anti-inflammatory** compounds safe for **topical** use on **sensitive skin**?" You need **normalization + provenance**.

### 8.2 Normalized schema (Postgres / SQLite)

```sql
-- Taxonomy
CREATE TABLE plant (
  id              INTEGER PRIMARY KEY,
  accepted_name   TEXT NOT NULL,             -- e.g. 'Rosmarinus officinalis L.'
  gbif_key        INTEGER, powo_id TEXT, wikidata_qid TEXT,
  family          TEXT, genus TEXT,
  native_dz       BOOLEAN,                   -- from GBIF/POWO
  growth_form     TEXT,                      -- tree / shrub / herb ...
  source_record   TEXT,                      -- original catalog row id / author
  created_at      TIMESTAMP, updated_at TIMESTAMP
);

CREATE TABLE plant_name (
  plant_id   INTEGER REFERENCES plant(id),
  lang       TEXT CHECK (lang IN ('la','fr','ar','en','dz','tmh')),  -- Darja, Tamahaq
  name       TEXT NOT NULL,
  name_norm  TEXT NOT NULL,                  -- normalized for search
  kind       TEXT,                           -- scientific | vernacular | synonym
  PRIMARY KEY (plant_id, lang, name)
);

-- Chemistry
CREATE TABLE compound (
  id INTEGER PRIMARY KEY, name TEXT, chem_class TEXT,   -- flavonoid, alkaloid, terpene...
  pubchem_cid INTEGER, inchikey TEXT, coconut_id TEXT, chebi_id TEXT
);
CREATE TABLE plant_compound (
  plant_id INTEGER, compound_id INTEGER, organ TEXT,    -- leaf, root, seed oil...
  provenance_id INTEGER,
  PRIMARY KEY (plant_id, compound_id, organ)
);

-- Activities & uses
CREATE TABLE activity (            -- controlled vocabulary
  id INTEGER PRIMARY KEY, code TEXT UNIQUE,             -- 'anti_inflammatory'
  label_en TEXT, label_fr TEXT, label_ar TEXT
);
CREATE TABLE compound_activity (
  compound_id INTEGER, activity_id INTEGER, evidence_grade TEXT, provenance_id INTEGER
);
CREATE TABLE plant_use (            -- traditional / documented uses
  id INTEGER PRIMARY KEY,
  plant_id INTEGER, need_code TEXT,                     -- 'skin.acne', 'sleep.insomnia'
  organ TEXT, preparation TEXT,                         -- infusion, poultice, oil macerate
  route TEXT CHECK (route IN ('topical','oral','inhalation','culinary')),
  evidence_grade TEXT CHECK (evidence_grade IN ('A','B','C','D')),
  region TEXT, provenance_id INTEGER
);

-- Safety
CREATE TABLE safety_flag (
  plant_id INTEGER, flag TEXT,                          -- 'phototoxic','pregnancy_avoid','hepatotoxic','allergen_asteraceae','toxic_if_ingested'
  severity TEXT CHECK (severity IN ('info','caution','avoid')),
  applies_to_route TEXT, note TEXT, provenance_id INTEGER
);

-- Cultivation (agronomy)
CREATE TABLE cultivation (
  plant_id INTEGER PRIMARY KEY,
  tmin_abs REAL, tmin_opt REAL, tmax_opt REAL, tmax_abs REAL,    -- °C
  rain_min_mm REAL, rain_opt_min REAL, rain_opt_max REAL, rain_max_mm REAL,
  ph_min REAL, ph_opt_min REAL, ph_opt_max REAL, ph_max REAL,
  soil_texture TEXT, drought_tolerance TEXT, frost_tolerance TEXT, light TEXT,
  gdd_base_c REAL, gdd_to_harvest REAL, sowing_months TEXT, harvest_months TEXT,
  provenance_id INTEGER
);

-- Provenance (the thesis gold)
CREATE TABLE provenance (
  id INTEGER PRIMARY KEY,
  source_type TEXT,         -- 'catalog' | 'literature' | 'api' | 'llm' | 'expert'
  source_ref  TEXT,         -- DOI / URL / author / API name
  retrieved_at TIMESTAMP,
  confidence REAL,          -- 0..1
  verified_by TEXT,         -- reviewer name or NULL
  is_ai_generated BOOLEAN
);
```

### 8.3 Evidence grades (show them in the UI)

| Grade | Meaning | UI badge |
|-------|---------|----------|
| **A** | Regulatory/clinical-level support (e.g. EMA/HMPC "well-established use", RCTs) | 🟢 |
| **B** | Pre-clinical evidence for the compounds/extract (in vitro/animal) | 🟡 |
| **C** | Traditional use documented in literature/your catalog | 🟠 |
| **D** | AI-inferred from compound similarity — hypothesis only | ⚪ + "AI" tag |

### 8.4 Enrichment pipeline (run offline, once per release)

1. **Clean** (existing script).
2. **Normalize taxa:** GBIF `species/match` → accepted name + keys; fix typos/synonyms; detect duplicates.
3. **Names:** Wikidata labels in ar/fr/en to complement your Darja/Tamahaq notes.
4. **Compounds:** LOTUS/COCONUT (organism → compounds with references) → PubChem for properties.
5. **Activities:** map compounds/classes → activity codes via ChEBI roles + curated table; mark LLM-suggested mappings `is_ai_generated=true`.
6. **Cultivation ranges:** from POWO/Trefle/FAO ECOCROP/literature; where an LLM fills a gap, flag it and queue for human review.
7. **Safety flags:** manual from monographs (do **not** rely on an LLM alone for safety).
8. **Build** `plants.sqlite` + checksum + `db_version`.
9. **Review sheet** (`data/review/`): a random sample validated by a pharmacist/botanist — report the error rate in your thesis.

---

## 9. New Feature: "Suggest a Plant for My Need" (Skin Care & more)

### 9.1 User experience

```
What do you need help with?          →  Skin care            →  Acne  ·  Dry skin  ·  Eczema-like irritation
[Skin] [Hair] [Digestion] [Sleep]       [Wounds/scars] [Anti-aging] [Sun spots] [Oily skin]
[Stress] [Respiratory] [Pain] …
                                      Quick profile (optional, stored on device only):
                                      ▢ Pregnant/breastfeeding  ▢ Child  ▢ Allergies: [Asteraceae…]
                                      Route: ● Topical  ○ Oral  ○ Any

                                      ─────────  Results  ─────────
                                      1. Nigella sativa (حبة البركة)     Match 91%  🟡 B
                                         Why: anti-inflammatory + antibacterial (thymoquinone…)
                                         How: oil, patch test first        ⚠ Caution: contact allergy possible
                                      2. …
```

Also supports **free text** ("my skin is dry and flaky in winter") parsed into needs, and **Arabic/French** input.

### 9.2 Need ontology (`need_ontology.yaml`)

A hand-curated map from user needs to **activities** (weights sum to 1). It is the explainable heart of the recommender — easy to defend in a thesis.

```yaml
skin:
  acne:
    route_preference: topical
    activities: { antibacterial: 0.30, anti_inflammatory: 0.30, astringent: 0.15, antioxidant: 0.10, sebum_regulating: 0.15 }
  dry_skin:
    route_preference: topical
    activities: { emollient: 0.40, moisturizing: 0.25, antioxidant: 0.15, anti_inflammatory: 0.20 }
  irritation_eczema_like:
    activities: { anti_inflammatory: 0.40, soothing: 0.30, antipruritic: 0.15, antibacterial: 0.15 }
  wounds_scars:
    activities: { cicatrisant: 0.45, antibacterial: 0.25, anti_inflammatory: 0.20, antioxidant: 0.10 }
  anti_aging:
    activities: { antioxidant: 0.50, collagen_supporting: 0.20, uv_protective: 0.15, emollient: 0.15 }
  hyperpigmentation:
    activities: { tyrosinase_inhibiting: 0.50, antioxidant: 0.30, anti_inflammatory: 0.20 }
  fungal_skin:
    activities: { antifungal: 0.70, anti_inflammatory: 0.30 }
sleep:
  insomnia:    { route_preference: oral, activities: { sedative: 0.50, anxiolytic: 0.30, relaxant: 0.20 } }
digestion:
  bloating:    { activities: { carminative: 0.50, antispasmodic: 0.30, digestive: 0.20 } }
# … extend for hair, respiratory, pain, immunity, diabetes_support (with strong safety text)
```

> Activity codes must match the French vocabulary already in your dataset (*cicatrisant, antibactérien, anti-inflammatoire, antioxydant…*) via the `activity` table's multilingual labels. Several activity codes above (e.g. `sebum_regulating`, `tyrosinase_inhibiting`) don't exist in the dataset yet — they come from compound-level enrichment (§8.4) or are left out.

### 9.3 Algorithm (hybrid, explainable, safe)

```
INPUT: need_code(s) | free_text, user_profile{pregnant, child, allergies[], route}, optional location

1. PARSE
   - If free text: LLM (JSON mode) → {needs:[…], constraints:[…]}  ← chain §6 (falls back to keyword dictionary FR/EN/AR)
   - Else use selected need codes.

2. CANDIDATE RETRIEVAL (SQL, offline-capable)
   - Plants having plant_use.need_code in needs AND route compatible
   - UNION plants having compounds whose activities overlap the need's activities (indirect evidence)

3. SCORING  (per plant p, need n)
   S_activity = Σ_a  w_n(a) · strength(p,a)         # strength = max over compounds/uses, normalized 0..1
   S_evidence = {A:1.0, B:0.75, C:0.5, D:0.25}[best grade]
   S_local    = 1.0 if native_dz or documented local use, else 0.6   # optional "available locally" weight
   S_route    = 1.0 if route matches, 0.5 if different but allowed, 0 if disallowed
   score = 0.50·S_activity + 0.25·S_evidence + 0.10·S_local + 0.15·S_route

4. SAFETY FILTER (hard rules, applied AFTER scoring, never skipped)
   - Remove plants with severity='avoid' for this profile (pregnancy, child, allergy family) and route
   - Attach 'caution' banners (phototoxic → "avoid sun after use"; allergen → "patch test")
   - If profile unknown → show generic cautions

5. DIVERSIFY & CAP: top-K (e.g. 8) with MMR so results aren't all one family

6. EXPLAIN (LLM optional, grounded)
   - Provide the LLM ONLY the retrieved rows; instruct "use only these facts; do not add claims".
   - Cache; if all LLMs fail → template explanation from rows (rule_based provider).

OUTPUT: ranked list [{plant, score, score_breakdown, evidence_grade, why, how_to_use, safety[], sources[]}]
```

Why this design?
- **Deterministic core** (SQL + weights) → reproducible, offline, testable.
- **LLM only for parsing and phrasing** → hallucinations can't invent a plant or a safety claim.
- **Safety is rule-based**, not LLM-based.
- **Score breakdown** shown to the user = explainability (thesis-friendly).

Optional upgrade: **embeddings** for free-text matching. With ~155–500 plants you can precompute vectors in the pipeline (e.g. a multilingual sentence-embedding model run locally), ship them in SQLite, and compute cosine similarity by brute force — no vector DB required. Embedding the *query* needs the model at runtime (backend) or a small on-device model; otherwise use the keyword dictionary offline.

### 9.4 Example: skin-care mapping (illustrative — must be validated against your dataset)

| Concern | Typical candidate plants in North African/Mediterranean flora | Why they'd rank | Cautions to encode |
|---------|---------------------------------------------------------------|-----------------|--------------------|
| Acne / oily skin | *Thymus* spp., *Myrtus communis*, *Nigella sativa*, *Rosmarinus officinalis* | antibacterial, anti-inflammatory, astringent compounds | Essential oils irritate if undiluted; patch test |
| Dry skin | *Argania spinosa* (argan oil), *Olea europaea*, *Opuntia ficus-indica* seed oil, *Aloe vera* | emollient fatty acids, tocopherols | Rare allergy |
| Wounds / scars | *Calendula officinalis*, *Aloe vera*, *Plantago* spp., *Hypericum* | cicatrisant, anti-inflammatory | *Hypericum* is **phototoxic**; Asteraceae allergy (Calendula) |
| Anti-aging | *Punica granatum*, *Camellia/Green tea*, *Rosa* spp. | antioxidant polyphenols | Sun-protection reminder |
| Hair/skin dye & care | *Lawsonia inermis* (henna) | traditional use | Contact reactions to additives; **never** "black henna" (PPD) |

> These are *examples of the type of output*, **not medical claims**. In production every line must come from your DB with an evidence grade.

### 9.5 Mobile implementation notes

- Recommendation works **offline** (steps 2–5 in local SQLite via a TypeScript port of the scoring function; or the server's endpoint when online for LLM explanations).
- Store the user's safety profile **only on-device** (MMKV). Send flags, not identity.
- Show a persistent **disclaimer** and "Talk to a pharmacist/doctor" CTA for any "avoid/caution" result or oral route.
- Add **"Why this plant?"** bottom sheet showing the score breakdown and sources.
- Log (anonymously, opt-in) which results users open → future ranking improvements.

---

## 10. New Module: Agronomy / Cultivation

### 10.1 Questions the module answers

1. **Can I grow this plant here?** (suitability score for my GPS location)
2. **When should I sow/plant and harvest?**
3. **How much and when should I water?**
4. **Is there a frost/heat/drought risk this week?**
5. **What's wrong with my plant?** (disease)
6. **Which medicinal plants suit my land?** (reverse query → feeds back into recommendations)

### 10.2 Data flow

```
GPS ─► Open-Meteo (forecast, ET₀, soil moisture)  ──┐
   ├─► NASA POWER (30-yr climate normals)    ───────┼─► cultivation_service ─► suitability, calendar, irrigation
   ├─► SoilGrids (pH, texture, organic C)    ───────┤
   └─► plant.cultivation ranges (DB)         ───────┘
(each source is a provider chain with fallback — §6)
```

### 10.3 Suitability score (FAO-ECOCROP-inspired "limiting factor" approach)

For each environmental variable *v* (min temp, mean temp, annual rainfall, soil pH, …) compute a **trapezoidal membership** value in [0,1] from the plant's absolute and optimal ranges:

```
        abs_min   opt_min   opt_max   abs_max
  1.0 |            ┌─────────┐
      |          ╱             ╲
  0.0 |_________╱                 ╲_________   → value of variable
```

`suitability = min over v of f_v(x_v)` (the worst factor limits the crop), with a label: **0.8–1 excellent**, **0.5–0.8 good**, **0.25–0.5 marginal**, **< 0.25 not suitable**. Return the **limiting factor** in plain language ("too cold in winter: −4 °C vs min −2 °C") and a mitigation tip.

```python
def trapezoid(x, a, b, c, d):          # a=abs_min, b=opt_min, c=opt_max, d=abs_max
    if x <= a or x >= d: return 0.0
    if b <= x <= c:      return 1.0
    return (x - a) / (b - a) if x < b else (d - x) / (d - c)
```

### 10.4 Planting calendar & thermal time

- **Growing Degree Days:** `GDD = Σ max(0, (Tmax + Tmin)/2 − Tbase)`. Use Open-Meteo daily temperatures; compare accumulated GDD to `gdd_to_harvest` → "estimated harvest date".
- **Sowing window:** months where the 7-day-mean soil temperature (Open-Meteo soil temp) is within the plant's germination range **and** last-frost risk is low (from NASA POWER history).
- **Harvest advice for medicinal plants:** many aromatic plants are best harvested in dry weather before flowering/at full bloom. Encode as rules in `cultivation` (harvest_months, organ) and warn if rain is forecast.

### 10.5 Irrigation advice

`daily water need (mm) ≈ Kc × ET₀ − effective_rain`, where **ET₀** comes from Open-Meteo's FAO-56 field and **Kc** (crop coefficient) is a stage-dependent constant stored in `cultivation` (start with a single mid-season Kc; refine later). Convert mm → litres per m² (1 mm = 1 L/m²). Include soil moisture (Open-Meteo) and soil texture (SoilGrids) to adjust frequency (sandy soils: smaller, more frequent doses). Mark as **advisory estimate**.

### 10.6 Disease & pest diagnosis

| Tier | Method | Cost |
|------|--------|------|
| 1 | Pl@ntNet disease route (check docs for availability on your plan) | Shares your daily quota |
| 2 | Kindwise plant.health / crop.health | Trial credits, then paid |
| 3 | On-device TFLite model trained on PlantVillage/PlantDoc (limited to crops in those datasets) | Free, offline |
| 4 | Vision-LLM description + knowledge-base lookup | Free quotas, **low reliability** |
| 5 | Symptom checklist (rule-based questionnaire) | Free, always available |

### 10.7 Alerts (local notifications)

Using `expo-notifications` + a daily background fetch (or server cron + Expo Push): frost warning (min temp < plant `tmin_abs + margin`), heat wave, "no rain for 5 days — water", "good harvest window tomorrow".

### 10.8 Extra agronomy ideas (backlog)

- **Companion planting** and pest-repellent plants (Permapeople + literature) → "Plant these together".
- **Soil improvement plants** (nitrogen fixers — Fabaceae are already well represented in your dataset).
- **Cultivation of endemic medicinal species for conservation** (ties to biodiversity angle; GBIF occurrences).
- **Wilaya-level suitability map** (precompute with WorldClim/NASA POWER normals → tiles).
- **Market price context** from FAOSTAT producer prices (national level).
- **Satellite NDVI** for a user-drawn field (phase 6+).

---

## 11. Backend API v2 Contract

All routes under `/v1`. Responses always include `meta: { provider, degraded, cached, request_id }` where relevant.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health`, `/health/providers` | Liveness, per-provider state |
| GET | `/plants/search?q=&lang=&limit=` | Fuzzy multilingual search |
| GET | `/plants/{id}` | Full dossier (names, compounds, uses, safety, cultivation, provenance) |
| GET | `/plants/{id}/predict?lang=` | AI therapeutic hypotheses (labeled AI) |
| POST | `/identify` (multipart: `images[]`, `organs[]`, `lat?`, `lon?`) | Image → candidates → `found_local` |
| POST | `/research` `{taxon, lang}` | Deep research for non-catalog plants |
| POST | `/recommend` `{needs[]\|text, profile{}, route, lang, limit}` | Need-based suggestions |
| POST | `/safety/check` `{plant_ids[], profile{}, route}` | Safety verdicts for any plant list |
| POST | `/cultivation/suitability` `{plant_id, lat, lon}` | Suitability + limiting factor |
| GET | `/cultivation/calendar?plant_id=&lat=&lon=` | Sowing/harvest windows |
| GET | `/cultivation/irrigation?plant_id=&lat=&lon=` | 7-day water plan |
| POST | `/diagnose` (image) | Disease candidates |
| GET | `/sync/manifest` | Offline DB version + hash + URL |

### Example — `POST /v1/recommend`

Request
```json
{
  "needs": ["skin.acne"],
  "profile": { "pregnant": false, "child": false, "allergy_families": ["Asteraceae"] },
  "route": "topical",
  "lang": "fr",
  "limit": 5
}
```
Response
```json
{
  "results": [
    {
      "plant_id": 42,
      "name": { "la": "Myrtus communis L.", "fr": "Myrte commun", "ar": "الريحان البري" },
      "score": 0.84,
      "score_breakdown": { "activity": 0.88, "evidence": 0.50, "local": 1.0, "route": 1.0 },
      "evidence_grade": "C",
      "why": "Contient des composés antibactériens et astringents (…)",
      "how_to_use": [{ "organ": "leaf", "preparation": "lotion (infusion refroidie)", "source": "catalogue / Réf. 12" }],
      "safety": [{ "flag": "patch_test", "severity": "caution", "note": "…" }],
      "sources": [{ "type": "catalog", "ref": "…" }],
      "is_ai_generated_explanation": true
    }
  ],
  "excluded_for_safety": 2,
  "meta": { "provider": "groq", "degraded": false, "cached": false, "request_id": "…" }
}
```

---

## 12. Security, Privacy & Licensing

**Security**
- No third-party keys in the app; use EAS secrets/CI secrets for build-time config only (public URL).
- Per-device rate limiting (anonymous device token in SecureStore) + IP limits to protect *your* free quotas from abuse (a scraper could burn your 500 IDs/day in minutes).
- Validate uploads: type, size (≤ 5–8 MB after client resize), strip EXIF GPS before storing/forwarding unless the user consents.
- Don't store user photos on the server unless the user opts into "contribute to dataset".
- Rotate keys; the README shows key prefixes — keep real keys out of git (`.env` in `.gitignore`, secret scanning on).

**Privacy**
- Health-adjacent data (allergies, pregnancy) stays on-device; the server receives only flags per request, not stored.
- Privacy policy and in-app consent screen (required by app stores).
- Anonymous analytics only, opt-in.

**Licensing & attribution checklist**

| Source | Obligation |
|--------|------------|
| Pl@ntNet | Respect one-account rule and quota; non-profit plan needs "powered by Pl@ntNet" logo; commercial use beyond 500/day is paid |
| Kindwise | Credits/paid after trial |
| Open-Meteo | Attribution (CC BY 4.0); free API restrictions for commercial use **(verify)** |
| Wikipedia/Wikidata | CC BY-SA (Wikipedia text) / CC0 (Wikidata) **(verify)** → attribution screen |
| Perenual | Free tier **non-commercial** |
| Permapeople | Share-alike |
| LOTUS/COCONUT | Open data; check each release's licence and cite papers |
| LLM free tiers | Possible training on your prompts; check terms; no personal data |

**Medical/legal:** keep the disclaimer on every recommendation screen; avoid dosage instructions for oral use unless sourced from a regulatory monograph; state that AI items are hypotheses; follow Google Play / App Store policies for health-related apps (disclaimers, no diagnosis claims).

---

## 13. Testing, CI/CD & Deployment

### 13.1 Testing pyramid

| Layer | Tooling | Focus |
|-------|---------|-------|
| Backend unit | `pytest`, `pytest-asyncio`, `respx` (mock httpx) | Scoring function, breaker, quota, normalizers |
| Provider contract | recorded fixtures | Each adapter parses real vendor sample responses; detect schema drift |
| Failover | pytest + mocks (§6.7) | Chain behavior |
| Data validation | `pandera`/custom | No plant without accepted name; every `plant_use` has provenance and evidence grade |
| Mobile unit | Jest + React Native Testing Library | Normalization, scoring port, components |
| Mobile E2E | **Maestro** (simple YAML flows) or Detox | Scan → result; offline search; language switch |
| Accessibility/RTL | manual + screenshots | All screens in `ar` |

### 13.2 CI (GitHub Actions)
- `ci-api.yml`: lint (ruff), type-check (mypy), tests, build Docker image.
- `ci-mobile.yml`: type-check, lint, Jest.
- `eas-build.yml`: manual/tag-triggered preview builds (Android APK/AAB; iOS needs an Apple developer account).
- Nightly **provider smoke test** that hits each external API once and posts a report (catches vendor changes early).

### 13.3 Deployment

| Piece | Option |
|-------|--------|
| API | Docker on Render/Fly/Railway/HF Spaces/Oracle VM; set `WEB_CONCURRENCY` small; keep **one long-lived process** (or Redis for shared state) |
| DB | Supabase Postgres (or SQLite file for MVP) |
| Cache/quota | Upstash Redis |
| Mobile | EAS Build → Google Play (one-time developer fee) / TestFlight; **EAS Update** for OTA JS fixes |
| Offline DB hosting | Supabase Storage / GitHub Releases (static file + hash manifest) |
| Config | `providers.yaml` baked into image; secrets via platform env vars |

> **Why not keep Vercel serverless for the backend?** It works for simple CRUD, but your breaker/quota/health logic needs shared memory. Either add Redis (works on serverless too) or move to a container. Free-tier containers may sleep when idle — add a cold-start-friendly splash and the offline fallback.

---

## 14. Roadmap

| Phase | Duration (≈) | Deliverables |
|-------|-------------|--------------|
| **0. Prep** | 3–4 days | Monorepo, move code per §4.1, `.env.example`, docker-compose, rotate keys |
| **1. Backend refactor** | 1–2 weeks | Provider framework + YAML, Pl@ntNet & Gemini adapters ported, `/v1` routes, Redis state, tests |
| **2. Resilience expansion** | 1 week | Groq/Cerebras/OpenRouter/Mistral adapters, rule-based fallback, GBIF/POWO/Wikidata taxonomy, health endpoint, failover tests |
| **3. Mobile MVP** | 3 weeks | Expo app: tabs, scan, search, dossier, i18n+RTL, theming, API client |
| **4. Offline & data v2** | 2 weeks | Normalized schema, enrichment pipeline v1, `plants.sqlite`, FTS5 search, DB sync |
| **5. Recommender** | 2 weeks | Need ontology, scoring, safety rules, UI, evaluation with a pharmacist/botanist |
| **6. Agronomy module** | 2–3 weeks | Open-Meteo/NASA/SoilGrids chains, suitability, calendar, irrigation, notifications |
| **7. Diagnosis & on-device ML** | 2–3 weeks | Disease chain, optional TFLite ID/diagnosis |
| **8. Hardening & release** | 1–2 weeks | Perf, accessibility, privacy policy, store listing, beta test with real users |
| **9. Thesis evaluation** | ongoing | Experiments in §15 |

MVP shortcut if time is tight: phases 0 → 1 → 3 → 4 (search only) → 5 (skin care only). Everything else is incremental.

---

## 15. PFE / Thesis Angle

**Contributions you can claim**
1. **Resilient multi-provider orchestration** for free-tier AI/data APIs (circuit breaker + quota-aware routing) — measurable availability gain.
2. **Evidence-graded, safety-filtered plant recommendation** grounded in a curated North-African dataset, with LLMs restricted to parsing/phrasing.
3. **Provenance-first data model** distinguishing literature, API, and AI-generated facts.
4. **Agronomic suitability** from open climate/soil data, linked to phytotherapy use.

**Experiments**
| Experiment | Metric |
|------------|--------|
| Plant ID accuracy by provider (top-1/top-5) on a test set of Algerian field photos | accuracy, per-provider; consensus vs single |
| Availability under injected failures | % requests answered, p95 latency vs naive single-provider baseline |
| Fallback quality | LLM-vs-rule-based explanation faithfulness (expert rating) |
| Recommender quality | expert-rated relevance@5, safety violations (target: 0), comparison to a pure-LLM baseline (hallucination rate) |
| Suitability accuracy | agreement with known cultivation zones / agronomist ratings |
| Offline usability | task success without network; DB size/latency |
| Usability | SUS questionnaire with 15–30 users (pharmacists, farmers, students) |

---

## 16. Appendix: Code Snippets

### A. Provider router (Python)

```python
# services/api/app/providers/base.py
from __future__ import annotations
import abc, time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

class ProviderError(Exception): ...
class RateLimited(ProviderError):
    def __init__(self, retry_after: Optional[float] = None):
        super().__init__("rate limited"); self.retry_after = retry_after
class BadResponse(ProviderError): ...
class AllProvidersFailed(ProviderError):
    def __init__(self, errors: list[tuple[str, str]]):
        super().__init__("; ".join(f"{n}: {e}" for n, e in errors)); self.errors = errors

class Provider(abc.ABC):
    name: str
    timeout_s: float = 15.0
    priority: int = 50

    @abc.abstractmethod
    async def call(self, request: Any) -> Any: ...
```

```python
# services/api/app/providers/breaker.py
import time

class CircuitBreaker:
    def __init__(self, fail_threshold: int = 3, base_cooldown: float = 30.0, max_cooldown: float = 900.0):
        self.fail_threshold, self.base, self.max = fail_threshold, base_cooldown, max_cooldown
        self.fails = 0
        self.open_until = 0.0

    def allow(self) -> bool:                       # closed or half-open (cooldown elapsed)
        return time.monotonic() >= self.open_until

    def on_success(self) -> None:
        self.fails, self.open_until = 0, 0.0

    def on_failure(self, retry_after: float | None = None) -> None:
        self.fails += 1
        if retry_after:                            # server told us when to come back
            self.open_until = time.monotonic() + retry_after
        elif self.fails >= self.fail_threshold:    # exponential backoff
            extra = min(self.fails - self.fail_threshold, 5)
            self.open_until = time.monotonic() + min(self.base * (2 ** extra), self.max)
```

```python
# services/api/app/providers/quota.py
import time, datetime as dt

class QuotaTracker:
    """In-memory version. In production back it with Redis INCR + EXPIRE."""
    def __init__(self, per_minute: int | None = None, per_day: int | None = None):
        self.per_minute, self.per_day = per_minute, per_day
        self.minute_hits: list[float] = []
        self.day = dt.datetime.now(dt.timezone.utc).date()
        self.day_count = 0

    def _roll(self):
        today = dt.datetime.now(dt.timezone.utc).date()
        if today != self.day:
            self.day, self.day_count = today, 0
        cutoff = time.monotonic() - 60
        self.minute_hits = [t for t in self.minute_hits if t > cutoff]

    def has_budget(self) -> bool:
        self._roll()
        if self.per_day is not None and self.day_count >= self.per_day: return False
        if self.per_minute is not None and len(self.minute_hits) >= self.per_minute: return False
        return True

    def consume(self) -> None:
        self._roll()
        self.day_count += 1
        self.minute_hits.append(time.monotonic())

    def exhaust_today(self) -> None:               # called when vendor says "daily quota exceeded"
        if self.per_day is not None: self.day_count = self.per_day
```

```python
# services/api/app/providers/router.py
import asyncio, logging, time
from dataclasses import dataclass
from typing import Any, Callable, Optional
import httpx
from .base import Provider, ProviderError, RateLimited, BadResponse, AllProvidersFailed
from .breaker import CircuitBreaker
from .quota import QuotaTracker

log = logging.getLogger("router")

@dataclass
class Slot:
    provider: Provider
    breaker: CircuitBreaker
    quota: QuotaTracker
    ewma_ok: float = 1.0          # success rate (0..1)
    ewma_ms: float = 1000.0       # latency

    def record(self, ok: bool, ms: float, alpha: float = 0.2):
        self.ewma_ok = (1 - alpha) * self.ewma_ok + alpha * (1.0 if ok else 0.0)
        self.ewma_ms = (1 - alpha) * self.ewma_ms + alpha * ms

@dataclass
class RouterResult:
    value: Any
    provider: str
    attempts: int
    degraded: bool

class ProviderRouter:
    def __init__(self, capability: str, slots: list[Slot], accept: Optional[Callable[[Any], bool]] = None,
                 degraded_after: int = 1):
        self.capability, self.slots, self.accept, self.degraded_after = capability, slots, accept, degraded_after

    def _ordered(self) -> list[Slot]:
        # priority first; within the same priority prefer healthier/faster providers
        return sorted(self.slots, key=lambda s: (s.provider.priority, -s.ewma_ok, s.ewma_ms))

    async def run(self, request: Any) -> RouterResult:
        errors: list[tuple[str, str]] = []
        attempts = 0
        for slot in self._ordered():
            p = slot.provider
            if not slot.breaker.allow():
                errors.append((p.name, "circuit open")); continue
            if not slot.quota.has_budget():
                errors.append((p.name, "quota exhausted")); continue
            attempts += 1
            t0 = time.monotonic()
            try:
                slot.quota.consume()
                value = await asyncio.wait_for(p.call(request), timeout=p.timeout_s)
                if self.accept and not self.accept(value):
                    raise BadResponse("rejected by validator")
                ms = (time.monotonic() - t0) * 1000
                slot.breaker.on_success(); slot.record(True, ms)
                log.info("ok capability=%s provider=%s ms=%.0f attempts=%d", self.capability, p.name, ms, attempts)
                return RouterResult(value, p.name, attempts, degraded=attempts > self.degraded_after)
            except RateLimited as e:
                slot.breaker.on_failure(retry_after=e.retry_after or 60)
                slot.record(False, (time.monotonic() - t0) * 1000)
                errors.append((p.name, "429"))
            except (asyncio.TimeoutError, httpx.HTTPError, ProviderError) as e:
                slot.breaker.on_failure()
                slot.record(False, (time.monotonic() - t0) * 1000)
                errors.append((p.name, type(e).__name__))
        raise AllProvidersFailed(errors)
```

Usage in a service (with terminal local fallback):

```python
async def predict(plant, lang):
    try:
        res = await llm_router.run(LLMRequest(task="predict", plant=plant, lang=lang))
        return {"data": res.value, "meta": {"provider": res.provider, "degraded": res.degraded}}
    except AllProvidersFailed:
        return {"data": rule_based_prediction(plant, lang), "meta": {"provider": "rule_based", "degraded": True}}
```

### B. Generic OpenAI-compatible LLM adapter (covers Groq, Cerebras, OpenRouter, Mistral)

```python
# providers/llm/openai_compat.py
import json, httpx
from ..base import Provider, RateLimited, BadResponse, ProviderError

class OpenAICompatLLM(Provider):
    def __init__(self, name, base_url, api_key, model, timeout_s=20, priority=50):
        self.name, self.base_url, self.api_key, self.model = name, base_url.rstrip("/"), api_key, model
        self.timeout_s, self.priority = timeout_s, priority

    async def call(self, req):                                   # req: LLMRequest(system, user, json_schema?)
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": req.system}, {"role": "user", "content": req.user}],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},          # drop if a provider rejects it
        }
        async with httpx.AsyncClient(timeout=self.timeout_s) as c:
            r = await c.post(f"{self.base_url}/chat/completions", json=payload,
                             headers={"Authorization": f"Bearer {self.api_key}"})
        if r.status_code == 429:
            ra = r.headers.get("retry-after")
            raise RateLimited(float(ra) if ra and ra.isdigit() else None)
        if r.status_code >= 500: raise ProviderError(f"{self.name} {r.status_code}")
        r.raise_for_status()
        text = r.json()["choices"][0]["message"]["content"]
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise BadResponse("invalid JSON") from e
```

### C. Recommender scoring (Python, mirrors the TypeScript port used offline)

```python
EVIDENCE = {"A": 1.0, "B": 0.75, "C": 0.5, "D": 0.25}

def score_plant(plant, need_weights: dict[str, float], profile, route):
    # strength of each activity for this plant (0..1), from compounds + uses
    strengths = plant.activity_strengths                       # {"antibacterial": 0.8, ...}
    s_activity = sum(w * strengths.get(a, 0.0) for a, w in need_weights.items())
    s_evidence = max((EVIDENCE[u.evidence_grade] for u in plant.uses), default=0.25)
    s_local    = 1.0 if plant.native_dz or plant.has_local_use else 0.6
    s_route    = route_match(plant, route)                     # 1.0 / 0.5 / 0.0
    return 0.50 * s_activity + 0.25 * s_evidence + 0.10 * s_local + 0.15 * s_route

def apply_safety(plant, profile, route):
    banners, excluded = [], False
    for f in plant.safety_flags:
        if f.applies_to_route not in (None, route, "any"): continue
        if f.flag == "pregnancy_avoid" and profile.pregnant:        excluded = True
        if f.flag == "child_avoid" and profile.child:               excluded = True
        if f.flag.startswith("allergen_") and f.flag.split("_", 1)[1] in profile.allergy_families: excluded = True
        banners.append(f)
    return excluded, banners
```

### D. Expo app config essentials (`app.config.ts`)

```ts
export default {
  name: 'PhytoSense',
  slug: 'phytosense',
  scheme: 'phytosense',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: [
    'expo-router',
    ['expo-camera', { cameraPermission: 'PhytoSense needs the camera to identify plants.' }],
    ['expo-image-picker', { photosPermission: 'Choose a plant photo to identify.' }],
    ['expo-location', { locationWhenInUsePermission: 'Used to estimate local growing conditions.' }],
    'expo-sqlite',
    'expo-localization',
  ],
  extra: { apiUrl: process.env.EXPO_PUBLIC_API_URL },
};
```

### E. Open-Meteo / SoilGrids / GBIF request examples (for provider adapters)

```text
# Weather + ET0 (daily) — Open-Meteo
GET https://api.open-meteo.com/v1/forecast?latitude=35.70&longitude=-0.63
    &daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration
    &timezone=auto&forecast_days=7

# Climate history (NASA POWER, daily, agro community)
GET https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR
    &community=AG&longitude=-0.63&latitude=35.70&start=20240101&end=20241231&format=JSON

# Soil (ISRIC SoilGrids v2)
GET https://rest.isric.org/soilgrids/v2.0/properties/query?lon=-0.63&lat=35.70
    &property=phh2o&property=clay&property=sand&depth=0-5cm&depth=5-15cm&value=mean

# Accepted name + keys (GBIF)
GET https://api.gbif.org/v1/species/match?name=Rosmarinus%20officinalis

# Occurrences in Algeria (GBIF)
GET https://api.gbif.org/v1/occurrence/search?scientificName=Rosmarinus%20officinalis&country=DZ&limit=50

# Compound properties (PubChem)
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/thymol/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON
```
(Coordinates above are near Oran as an example; use the device location in the app.)

### F. Migration checklist (copy into your issue tracker)

- [ ] Create monorepo, move backend to `services/api`
- [ ] Rotate API keys; add secret scanning
- [ ] Port Pl@ntNet and Gemini into the provider framework
- [ ] Add Redis + breaker/quota state
- [ ] Add 3+ LLM providers + rule-based fallback
- [ ] Failover tests green
- [ ] Normalize DB schema; build provenance
- [ ] Generate `plants.sqlite` + manifest
- [ ] Expo app skeleton, navigation, theme, i18n/RTL
- [ ] Scan, Search (online+offline), Dossier screens
- [ ] Recommender (skin care first) + safety rules + expert review
- [ ] Cultivation module (weather → soil → suitability)
- [ ] Disease diagnosis chain
- [ ] Attribution/legal screen, privacy policy, disclaimer
- [ ] Beta test, fix, release

---

## ⚠️ Medical Disclaimer

PhytoSense is for scientific education, academic research, and botanical exploration. It does **not** provide medical diagnoses, treatment plans, or clinical recommendations. Plant preparations can cause allergic reactions, phototoxicity, organ toxicity, and drug interactions. Always consult a qualified healthcare professional before using any plant medicinally — especially during pregnancy, breastfeeding, in children, or when taking medication.
