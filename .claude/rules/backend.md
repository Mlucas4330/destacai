---
paths:
  - "server/**"
---

# Backend / service layer (`server/`)

Ported backend, imported via the `@server/*` alias (`@server/* → server/*`). Pure server code — never import this from client components.

## Feature structure
Each feature under `server/features/<name>/` is sliced as:
- **service.ts** — business logic; the only layer that orchestrates.
- **repository.ts** — data access; maps Drizzle rows to domain types.
- **dto.ts** — request/response Zod schemas.
- **model.ts** — TypeScript domain types for the feature's entities.

`lib/` is pure infrastructure (llm, r2, pdf, http, errors, logger, code, paths, skills). `shared/schemas.ts` holds shared Zod schemas. Throw `AppError(message, statusCode)`; route handlers translate it via `toErrorResponse`.

## Async generation (no queue)
- CV generation and ATS scoring run **in-process**, not via BullMQ/Redis.
- The runnable bodies are `runCvGeneration` (`features/cv/generate.ts`) and `runAtsScoring` (`features/jobs/score.ts`). Services start them via the fire-and-forget `enqueueCvGeneration` / `enqueueAtsScoring` (called WITHOUT `await`) and set the job's status fields to `queued`; the client polls `/jobs`.
- All failures must be caught inside the runner and written to the job row (`cvGenerationStatus`/`atsStatus` = `failed`) — a thrown background error has no request to surface to.
- This requires a long-running Node host; it is incompatible with edge/serverless.

## Auth
- Auth.js config: `server/auth.config.ts` is **edge-safe** (no DB/bcrypt imports — the middleware uses it). `server/auth.ts` adds the Credentials provider + `validateCredentials` (DB) and exports `handlers`, `auth`, `signIn`, `signOut`. Don't import DB code into `auth.config.ts`.
- Verification/reset codes are generated in `lib/code.ts`; emails sent via Brevo in `features/auth/email.ts`.

## Data & assets
- Drizzle schema in `db/schema.ts`; regenerate migrations with `npm run db:generate` after schema changes. The `users`/`jobs` tables are auth-only — no `isGuest`, `creditBalance`, `stripeCustomerId`, etc.
- Runtime assets (prompts, skills taxonomy) are read from `server/assets` via `lib/paths.ts`, which resolves against `process.cwd()` (stable under `next dev`/`next start`).
- LLM model choice is purpose-based in `lib/llm.ts` (`gpt-4o` generate / `gpt-4o-mini` ATS+extract), OpenAI only.

## Do not reintroduce
Stripe/payments, guest users, the credit system, or BullMQ/Redis — all removed in the Next.js migration.
