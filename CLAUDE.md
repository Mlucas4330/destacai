# DestacAI — Developer Context

DestacAI generates a tailored, ATS-optimized CV (and cover letter) for each job a user applies to, and scores their CV against the job description (0–100). It is a **single Next.js 15 (App Router) app**, authenticated-users only.

## Commands

- `npm run dev` — start the app (Next dev server)
- `npm run build` / `npm run start` — production build / serve (long-running Node host, not edge/serverless)
- `npm run lint` — ESLint (next lint)
- `npm run db:generate` / `db:migrate` / `db:push` — Drizzle schema/migrations (needs `DATABASE_URL`)

Env vars live in `.env` (see `.env.example`): `AUTH_SECRET`, `DATABASE_URL`, `R2_*`, `OPENAI_API_KEY`, `BREVO_API_KEY`, `BREVO_SENDER`.

## Architecture

One app, two layers, two path aliases:

- **Client** — `src/` via `@/*`. React 19 client components: React Query (server state), Zustand (cross-component UI/flow state), React Hook Form + Zod (forms), Tailwind v4, Framer Motion.
- **Server** — `server/` via `@server/*`. Ported backend service layer; Postgres (Drizzle), Cloudflare R2 (CV PDFs), Brevo (email), OpenAI (LLM).

```
src/
├── app/                # Next routes + API. Groups (app)=authed shell at /, (auth)=sign-in/up/verify/reset; api/* route handlers
├── screens/            # page-level UI components (NOT src/pages — that's the Pages Router)
├── features/{auth,jobs,config}/   # components/ (pure UI), hooks/, stores/, api.ts, schemas.ts
├── shared/             # components, utils, stores, types
├── lib/                # apiClient, queryClient, storageClient
└── middleware.ts       # Auth.js route guard
server/
├── auth.ts, auth.config.ts        # Auth.js (NextAuth v5): Credentials + JWT session
├── features/{auth,jobs,cv,users}/ # service / repository / dto / model
├── db/ (schema.ts, client.ts, migrations/)
├── lib/ (llm, r2, pdf, http, errors, logger, code, paths, skills/)
└── shared/schemas.ts
```

## Conventions

Detailed, path-scoped conventions live in `.claude/rules/` (loaded when you touch matching files):
- `frontend.md` — component/hook/state rules for `src/`
- `api-routes.md` — route-handler rules for `src/app/api/`
- `backend.md` — service-layer + async-generation rules for `server/`

Cross-cutting essentials:
- **Auth** is Auth.js (Credentials provider, JWT session). Sign-in/out via `next-auth/react`; email-code verification + password reset are custom routes under `src/app/api/auth/*` (Brevo). API routes authenticate with `requireUser()` (`server/lib/http.ts`).
- **No queue.** CV generation and ATS scoring run **in-process** as fire-and-forget background tasks (`server/features/cv/generate.ts`, `server/features/jobs/score.ts`), kicked off (not awaited) from route handlers; the client polls `/jobs` for status.
- **One query per resource** — `/jobs` returns each row with ATS + generation state populated; no per-row endpoints.
- **Auth-only.** No Stripe/payments, guest users, or credit system (all removed). Don't reintroduce them.
- **Model selection is purpose-based** — `gpt-4o` for generation, `gpt-4o-mini` for ATS/extraction (`server/lib/llm.ts`); OpenAI only.

## Changelog

Every code change is logged in `CHANGELOG.md` at the repo root (newest first). Skim it for recent history, and append an entry when you change code.
<!-- Plain reference, not an @import: the changelog grows over time and would otherwise be loaded into context every session. -->
