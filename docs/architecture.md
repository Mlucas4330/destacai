# Architecture

One Next.js 15 (App Router) application. One repo, one deploy, one process.

## The two halves of the tree

| Path | Alias | Runs where |
| --- | --- | --- |
| `src/` | `@/*` | Client. React 19 components, hooks, stores, plus the thin API route handlers under `src/app/api/`. |
| `server/` | `@server/*` | Server only. Services, repositories, LLM calls, R2, PDF. Never import this from a client component. |

The `server/` tree is a ported standalone backend, which is why it keeps its own alias and its own layering
instead of dissolving into `src/`. It is imported by route handlers and by `server/auth.ts`, nowhere else.

```
src/
  app/            routes: (app) and (auth) route groups, plus api/*
  screens/        one component per route, the page-level composition
  features/       feature folders: api.ts, hooks/, components/, stores/, types.ts, constants.ts
  shared/         cross-feature components, stores and pure utils
  lib/            client infra: apiClient (axios), queryClient, storageClient
  middleware.ts   Auth.js route guard
server/
  features/<name>/  service.ts | repository.ts | dto.ts | model.ts
  lib/              llm, r2, pdf, http, errors, logger, code, paths, password, skills
  db/               schema.ts, client.ts, migrations/
  shared/schemas.ts shared Zod schemas (JD extract, CV data, ATS breakdown)
  assets/           prompts (.md), the CV PDF template, the skills taxonomy
  auth.config.ts    edge-safe Auth.js config
  auth.ts           full Auth.js config with the Credentials provider
```

## Feature slicing in `server/`

Each feature under `server/features/<name>/` is cut the same way:

- `service.ts` - business logic. The only layer that orchestrates other layers.
- `repository.ts` - data access. Drizzle queries, nothing else.
- `dto.ts` - request/response Zod schemas.
- `model.ts` - TypeScript domain types for the feature's entities.

`lib/` is pure infrastructure and knows nothing about features. `shared/schemas.ts` holds the schemas that
cross feature boundaries.

Errors are thrown as `AppError(message, statusCode, data?)` from anywhere in the stack and translated once
at the handler boundary; see [invariants.md](invariants.md#requests).

## Async work: in-process, no queue

CV generation and ATS scoring are slow (LLM calls plus a PDF render) and must not block the request. They
run as fire-and-forget in-process tasks:

- The runnable bodies are `runCvGeneration` ([server/features/cv/generate.ts](../server/features/cv/generate.ts))
  and `runAtsScoring` ([server/features/jobs/score.ts](../server/features/jobs/score.ts)).
- Services start them through `enqueueCvGeneration` / `enqueueAtsScoring`, which call the runner **without
  `await`**, after writing `queued` to the job row.
- The client polls `GET /jobs` and reads the status fields. There is no websocket and no per-job endpoint.

Three rules follow from this and are not optional. All three are stated in
[invariants.md](invariants.md#background-work) because they bind code outside this file:

1. Every failure is caught inside the runner and written to the job row.
2. The host is long-running Node, so every handler declares `runtime = 'nodejs'`.
3. A task lost to a restart is recovered by the `done`/`idle` check, described in
   [ats-scoring.md](ats-scoring.md).

## External services

| Service | Used for | Without it |
| --- | --- | --- |
| Postgres (Drizzle) | users and jobs | nothing works |
| Cloudflare R2 | uploaded CVs and generated PDFs | upload, generation and scoring fail |
| OpenAI | every LLM call | extraction, scoring and generation fail |
| Brevo | the password-reset email | reset codes are written to the DB but never delivered |

## Do not reintroduce

Stripe and payments, guest/anonymous users, the credit system, and BullMQ/Redis. All four were removed in
the Next.js migration and each one leaves a shape that is easier to add back than to reason about:

- **Payments** drag in a webhook surface, a second source of truth about entitlement, and a reason for every
  route to ask "may this user do this" beyond "is this user signed in".
- **Guest users** mean rows without an owner, which means every query needs a second identity path (IP, a
  cookie) and every deletion path needs to handle both.
- **Credits** put a mutable balance next to work that runs in the background, so a failed generation has to
  decide whether to refund.
- **A queue** buys durability across restarts, but costs a Redis dependency, a worker deploy, and a second
  place where "what is this job doing right now" is recorded. The in-process re-queue check covers the one
  failure mode that actually bites.

`jobs.bullmq_job_id` still exists as a dead column from the queue era; see [data-model.md](data-model.md).
