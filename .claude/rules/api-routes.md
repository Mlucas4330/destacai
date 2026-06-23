---
paths:
  - "src/app/api/**"
---

# API route handlers (`src/app/api/`)

Thin App Router route handlers that expose the REST contract the frontend `api.ts` files expect. Keep them thin — business logic belongs in `server/features/*` services.

## Pattern
Every handler:
1. `export const runtime = 'nodejs'` (these need Node: Postgres, pdfjs, @react-pdf, bcrypt, R2 SDK).
2. Authenticate with `requireUser()` from `@server/lib/http` (throws a 401 `AppError` if no session).
3. Parse/validate input — JSON bodies via `parseJson(req, ZodSchema)`; dynamic params via `await params` (Next 15 params are async, typed `{ params: Promise<{ jobId: string }> }`).
4. Call the matching `server/features/*` service.
5. `return NextResponse.json(...)` on success; wrap the body in `try/catch` and `return toErrorResponse(err)` so `AppError(message, status)` maps to `{ error }` with the right status (this replaces the old Hono `onError`).

## Contract notes
- Mirror the existing paths/shapes exactly — the frontend depends on them (e.g. `GET /jobs` → `{ jobs }`, `POST /jobs` → the job, 201).
- Auth endpoints other than session: `register`, `verify-code`, `forgot-password`, `reset-password` under `api/auth/*`. Session (`signIn`/`signOut`) is handled by Auth.js at `api/auth/[...nextauth]`.
- Binary/text responses (PDF download, cover letter) return a raw `Response` with the right `Content-Type` / `Content-Disposition`, not `NextResponse.json`.
