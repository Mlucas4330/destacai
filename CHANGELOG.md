# Changelog

A living changelog for DestacAI. **Every code change gets an entry here.**

## How to use

- Add a new entry at the **top** of the Changelog (newest first).
- Each entry: `### YYYY-MM-DD — <area>` followed by **What** (what changed) and **Why** (the reason / trade-off).
- Keep entries short; link to files with relative paths.
- The **Baseline** and **Roadmap** sections describe where the project is now and where it's going. Update them as reality changes.

---

## Changelog

### 2026-06-19 — Local Postgres via docker-compose
- **What:** Added a Postgres-only `docker-compose.yml` (replacing the old backend one removed in the migration) matching the default `DATABASE_URL`. `docker compose up -d` + `npm run db:push` gives a working local DB. Also fixed the `pino-pretty` transport crash in `server/lib/logger.ts`.
- **Why:** The migration removed the old local DB and secrets; this restores one-command local dev.

### 2026-06-19 — Move changelog to root `CHANGELOG.md`
- **What:** Moved `context/progress-tracker.md` → `./CHANGELOG.md` and removed the `context/` folder. Updated the references in `CLAUDE.md` and `README.md`.
- **Why:** `context/` was a bespoke folder holding a single doc. A root `CHANGELOG.md` is the conventional, instantly-recognized home; `.claude/` stays purely for Claude Code config.

### 2026-06-19 — Adopt Claude Code native config; remove leftover deploy config
- **What:** Moved project documentation onto Claude Code's native, auto-loaded surfaces. Rewrote `CLAUDE.md` to the real Next.js architecture (concise). Added path-scoped rules in `.claude/rules/` (`frontend.md` → `src/`, `api-routes.md` → `src/app/api/`, `backend.md` → `server/`). Migrated `context/code-standards.md` into those and deleted it; this `progress-tracker.md` stays as the changelog (referenced from `CLAUDE.md`, not `@import`-ed, so a growing log doesn't load into every session). Removed the obsolete `netlify.toml` (Vite/Netlify deploy config; `_redirects`/`robots.txt` were already gone).
- **Why:** `/context/*.md` was a custom convention Claude doesn't load automatically; CLAUDE.md + `.claude/rules` are the native mechanisms (CLAUDE.md every session, rules when matching files are touched). Skills/hooks/MCP were intentionally left out for now.

### 2026-06-19 — Step 2: migrated to a single Next.js app (+ Step 3 removals pulled forward)
- **What:** Collapsed the Vite SPA + Hono/BullMQ backend into one **Next.js 15 (App Router)** app at the repo root.
  - Frontend client code stays in `src/` (`src/app/` routes, `src/screens/` page components — renamed from `src/pages/` to avoid the Pages Router collision, `src/features`, `src/shared`, `src/lib`). Backend ported to `server/`.
  - **Auth.js (NextAuth v5)** replaces the custom JWT auth: Credentials provider + JWT sessions (`server/auth.ts`), edge-safe `server/auth.config.ts`, `src/middleware.ts` guard, `requireUser()` in `server/lib/http.ts`. Email-code verification / password reset kept as custom routes under `src/app/api/auth/*` using Brevo.
  - **BullMQ/Redis dropped.** Worker bodies extracted to in-process background functions `runCvGeneration` (`server/features/cv/generate.ts`) and `runAtsScoring` (`server/features/jobs/score.ts`); route handlers fire them without awaiting. Job-status fields + frontend `/jobs` polling unchanged.
  - REST contract re-implemented as App Router route handlers under `src/app/api/*` (users, cv, jobs), mirroring the old paths/shapes.
  - **Removed (Step 3 pulled forward):** Stripe/payments, guest users, credit system, and related DB columns (`isGuest`, `guestIp`, `creditBalance`, `creditChargedAt`, `stripeCustomerId`, `tokenVersion`). Fresh Drizzle migration generated (`server/db/migrations`).
  - Deleted: `backend/`, Vite config, `index.html`, React Router, `_redirects`/`robots.txt`, BullMQ/Redis/Stripe deps.
  - Fix: removed the `pino-pretty` transport from `server/lib/logger.ts` — pino transports spawn worker threads that don't resolve in Next's bundled runtime (caused 500s on `/api/auth/*`). Logs plain JSON now.
- **Why:** One repo, one deploy, far less infra for a portfolio piece. Synchronous in-process generation is fine at this scale and needs only a long-running Node host (`next start`), no Redis/worker process.
- **⚠ Follow-ups:** (1) `.env` must be repopulated — `backend/.env` (real secrets) was removed; see `.env.example`. (2) Rate limiting on auth code endpoints was dropped with Redis (was best-effort). (3) After email verification the app auto-signs-in only if the sign-up password is still in memory; otherwise it routes to `/sign-in`. (4) `src/screens/Privacy.tsx` copy still mentions guest/Stripe — cosmetic, not yet rewritten.

### 2026-06-19 — docs
- **What:** Corrected `README.md` to match the actual codebase (web app, not Chrome extension; purpose-based model selection, not free/paid tiers; credit system with `FREE_CREDITS=3`; added cover-letter and CV-editing features; fixed guest-limit numbers). Created `context/progress-tracker.md` (this file) and `context/code-standards.md`.
- **Why:** The docs were stale and actively misleading ahead of a large refactor. Accurate docs are the foundation for the Next.js migration and the auth-only cleanup. `CLAUDE.md` will be slimmed in a later round as its durable content migrates into `context/`.

---

## Baseline

> **Superseded 2026-06-19** by the Next.js migration (see top changelog entry). The app is now a
> single Next.js 15 App Router project: client code in `src/` (`src/app` routes, `src/screens`,
> `src/features`, `src/shared`, `src/lib`), backend in `server/`, Auth.js for sessions, in-process
> background generation (no Redis/BullMQ), Postgres via Drizzle, R2, Brevo, OpenAI. The snapshot
> below describes the pre-migration architecture and is kept for history.

Two deployables (pre-migration):

**Frontend** — `d:\projetos\destacai` root (`src/`)
- Vite + React 19 + TypeScript SPA; React Router (`src/router.tsx`), React Query (+ idb-keyval persistence, `src/lib/queryClient.ts`), Zustand (`src/features/auth/stores/auth.ts`), React Hook Form + Zod, Tailwind v4, Framer Motion.
- Feature folders: `auth`, `jobs`, `config`; shared in `src/shared`; infra in `src/lib`.
- API access via axios in `src/lib/apiClient.ts` (base URL `/api`, overridable via `VITE_API_URL`); each feature has an `api.ts`.
- Routes: `/` (app), `/sign-in`, `/sign-up`, `/verify-code`, `/forgot-password`, `/reset-password`, `/privacy`, `*` (NotFound).

**Backend** — `d:\projetos\destacai\backend` (`src/`)
- Hono on Railway; REST API + BullMQ workers run in the **same process** (`src/index.ts` imports `cvWorker`, `atsWorker`, and schedules guest cleanup).
- Routers mounted: `/auth`, `/users`, `/cv`, `/jobs`, `/stripe`, plus `/health` and a Bull Board UI at `/queues` (basic-auth).
- Feature structure per area: `router → controller → service → repository → dto → model`.
- Postgres via Drizzle (`src/db/schema.ts`: `users`, `jobs`), Redis for BullMQ (`src/lib/queue.ts`: `cvQueue`, `atsQueue`, `guestCleanupQueue`), Cloudflare R2 (`src/lib/r2.ts`), Brevo email via REST (`src/features/auth/email.ts`; `nodemailer` is an **unused** dep), Stripe (`src/features/stripe/*`).
- LLM: OpenAI only (`src/lib/llm.ts`) — `gpt-4o` for generation, `gpt-4o-mini` for ATS/extraction. `@ai-sdk/google` and `@ai-sdk/groq` installed but unused.
- Auth: custom JWT in httpOnly cookie; `authMiddleware` (strict) and `userMiddleware` (falls back to guest creation by `X-Guest-Id` header / `guest_id` cookie / IP). 6-digit email verification + password reset codes (1h TTL), `tokenVersion` invalidation.
- Monetization: credit system (`users.creditBalance`, default `FREE_CREDITS=3`; packs 10/30/100 in `src/constants.ts`). **Inconsistency:** a leftover `sendSubscriptionEndingEmail` references a "Pro subscription / free plan".

---

## Roadmap

### Step 2 — Migrate to a single Next.js app (App Router) — ✅ DONE (2026-06-19)
Folded the Hono backend into one Next.js app, auth-only, in-process generation. See top changelog
entry. The notes below are the original plan, kept for reference.

Decision: fold the Hono backend into one Next.js app (`/app/api/*`), one repo, one deploy.

- **Routing:** map React Router routes → `app/` files.
  - Auth group `(auth)/`: `sign-in`, `sign-up`, `verify-code`, `forgot-password`, `reset-password`.
  - App route: `/` (`app/page.tsx`); public `/privacy`.
- **API:** port Hono routers to route handlers under `app/api/{auth,users,cv,jobs}/...`. Keep the same paths/contract so the frontend `api.ts` files change only their base URL.
- **API base URL:** replace the axios `/api` + Vite proxy with Next config (rewrites) or `NEXT_PUBLIC_API_URL`; mark client components with `'use client'`.
- **Auth:** move cookie-based guarding into `middleware.ts`.
- **Data/state:** React Query provider in the root layout; Zustand/RHF unchanged.
- **Async (decision):** **drop BullMQ/Redis** and run CV generation + ATS scoring **synchronously** inside the API route handlers (keep client polling, or stream). Trade-off: needs a non-serverless host or long request timeouts — acceptable for a portfolio.

### Step 3 — Remove non-portfolio features (auth-only) — ✅ mostly DONE (folded into Step 2)
Stripe/payments, guest users, and the credit system (frontend + backend + DB columns) were removed
during the migration. Remaining polish: rewrite `src/screens/Privacy.tsx` copy (still references
guest/Stripe), and decide on any new deployment config for the single app. Original removal map below.

Strip deployment, Stripe/payments, guest users, and free/paid tiers; keep authenticated users only. **Removal map (ready-to-execute checklist):**

- **Stripe / payments**
  - Frontend: `src/lib/stripe.ts`, `src/features/config/components/CheckoutModal.tsx`, `useCheckout`/`useDevCredits` in `src/features/config/hooks/useUser.ts`, credit-pack UI in `src/features/config/components/ConfigForm.tsx`, `CREDIT_PACKS` in `src/features/config/constants.ts`, `@stripe/*` deps in `package.json`.
  - Backend: `src/features/stripe/*`, `src/lib/stripe.ts`, webhook route, `STRIPE_*` env vars, `stripe` dep, `CREDIT_PACKS` in `src/constants.ts`.
  - Privacy copy: Stripe mentions in `src/pages/Privacy.tsx`.
- **Guest users**
  - Frontend: `src/lib/guestIdStore.ts`, `src/features/auth/components/GuestLimitModal.tsx`, `X-Guest-Id` interceptor in `src/lib/apiClient.ts`, `showLimitModal`/`triggerLimitModal`/`dismissLimitModal` in the auth store, render in `src/shared/components/RootLayout.tsx`, `initGuestId()` call on rehydrate.
  - Backend: guest fallback chain in `src/middleware/auth.ts` (`userMiddleware`), `src/features/auth/guestCleanupWorker.ts`, guest repo methods in `src/features/auth/repository.ts`, `guest_id` cookie, `IP_GUEST_LIMIT`, guest IP checks in `src/features/jobs/service.ts`.
  - Privacy copy: guest mentions in `src/pages/Privacy.tsx`.
- **Tiers / credits / limits**
  - DB: drop `users.creditBalance` and `jobs.creditChargedAt` (and `isGuest`, `guestIp`, `stripeCustomerId`) in `backend/src/db/schema.ts`.
  - Backend: `decrementCredits`/`incrementCredits` calls in `src/features/jobs/service.ts` and the refund in `src/features/jobs/atsWorker.ts`; `FREE_CREDITS`; `sendSubscriptionEndingEmail` in `src/features/auth/email.ts`.
  - Frontend: credit copy in `src/shared/components/TopBar.tsx` and `ConfigForm.tsx`; "out of credits / upgrade" error mapping in `src/features/jobs/hooks/useJobs.ts`; `creditBalance` in `src/shared/types.ts`.
- **Deployment**
  - Frontend: `public/_redirects`, `public/robots.txt`, Vite proxy in `vite.config.ts`.
  - Backend: `railway.json`, `Dockerfile`, `docker-compose.yml`, Railway-specific env.
- **Workers/queue** (folded into the Next.js sync decision above): `backend/src/lib/queue.ts`, `cvWorker.ts`, `atsWorker.ts`, Bull Board, Redis/`ioredis`/`bullmq` deps.

### Later — slim CLAUDE.md — ✅ DONE (2026-06-19)
Superseded by the native-config adoption (see top changelog entry): `CLAUDE.md` was rewritten lean,
durable standards moved into `.claude/rules/`, and `context/code-standards.md` was removed. This file
remains the changelog.
