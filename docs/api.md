# API

Route handlers under [src/app/api/](../src/app/api/). They are deliberately thin: authenticate, validate,
call a `server/features/*` service, serialize. Business logic in a route handler is a bug.

The client reaches them at `/api` through the single axios instance in
[src/lib/apiClient.ts](../src/lib/apiClient.ts), same-origin, cookie-authenticated, 5s default timeout
(overridden per call for the slow ones).

## The handler pattern

Every handler:

1. `export const runtime = 'nodejs'` ([invariants.md](invariants.md#background-work)). Postgres, bcrypt,
   pdfjs, `@react-pdf` and the R2 SDK all need Node.
2. Calls `requireUser()` from [server/lib/http.ts](../server/lib/http.ts), which resolves the Auth.js
   session, loads the row, and throws `AppError('Unauthorized', 401)` if either is missing. It returns the
   full `User`, so handlers rarely need a second query.
3. Validates input: JSON bodies through `parseJson(req, ZodSchema)`, which throws a 400 carrying the Zod
   issues. Dynamic params are async in Next 15 and typed `{ params: Promise<{ jobId: string }> }`, so
   `const { jobId } = await params`.
4. Calls the service.
5. Returns `NextResponse.json(...)`, with the whole body wrapped in `try/catch` returning
   `toErrorResponse(err)`. That maps `AppError(message, status, data)` to `{ error: message, ...data }` at
   the right status and anything else to a logged 500. It replaces the old Hono `onError`.

The error envelope is always `{ error: string }`, plus any extra `data` keys
([invariants.md](invariants.md#requests)). The axios interceptor unwraps it into `new Error(message)`, which
is why hooks can read `err.message` directly.

Two handlers break the JSON rule on purpose and return a raw `Response`: the CV download (`application/pdf`
with a `Content-Disposition` filename) and the cover letter (`text/plain; charset=utf-8`).

## Auth

`POST /api/auth/[...nextauth]` and friends are Auth.js: sign-in, sign-out and session. The client never
calls them directly, it uses `signIn` / `signOut` / `useSession` from `next-auth/react`. The custom routes
below are the ones Auth.js does not cover. All three are unauthenticated by definition.

| Route | Body | Response |
| --- | --- | --- |
| `POST /api/auth/register` | `{ email, password }` (min 8) | 201 `{ message, email }`. 409 if the email is taken. Does **not** create a session; the client signs in immediately afterwards. |
| `POST /api/auth/forgot-password` | `{ email }` | 200 `{ message }`, always the same message whether or not the account exists. |
| `POST /api/auth/reset-password` | `{ email, code, newPassword }` | 200 `{ message }`. 400 on a wrong or expired code, 404 if no such user. |

There is no `verify-code` route. Email verification was removed; see [auth.md](auth.md).

## Jobs

| Route | Body | Response |
| --- | --- | --- |
| `GET /api/jobs` | | `{ jobs: Job[] }`, newest first. The only read path for job state: ATS scores, generation status and all. Also self-heals stuck tailored scoring. |
| `POST /api/jobs` | `{ description, title?, company? }` | 201, the job row. 400 if `description` is blank, 409 `{ error, jobId }` if the same description already exists for this user. Runs the JD extraction inline, so it is slow: the client allows 30s. |
| `DELETE /api/jobs` | | `{ success: true }`. Deletes every job for the user and their generated PDFs from R2. |
| `DELETE /api/jobs/{jobId}` | | `{ success: true }`. 404 if it is not the user's job. |
| `PATCH /api/jobs/{jobId}/status` | `{ status }` | `{ id, status }` |
| `POST /api/jobs/{jobId}/generate` | `{ userAnswers?, tailored? }` | The job row with generation queued. 403 `No CV on file`, 404 if the job is not the user's. Returns immediately; the work runs in the background. |
| `GET /api/jobs/{jobId}/download` | | Raw PDF. 400 if generation is not `done`. Filename is `first_last_cv.pdf` when the name is known, else `cv_<jobId>.pdf`. |
| `POST /api/jobs/{jobId}/cover-letter` | | `text/plain`. 400 if the CV is not generated yet. Synchronous LLM call: the client allows 60s. |
| `GET /api/jobs/{jobId}/cv-data` | | `{ cvData }`, the structured CV behind the PDF. 404 until generation is `done`. |
| `PATCH /api/jobs/{jobId}/cv-data` | `{ cvData }` | The updated job. Re-renders the PDF to the same R2 key and re-queues tailored scoring. 400 on schema-invalid data. |

`GET /api/jobs/{jobId}/status` exists and returns `{ status, error? }` for generation, but the client does
not use it: everything comes from the `/jobs` poll. It is kept because it is the natural single-job probe
and it performs the same self-heal check.

## CV and profile

| Route | Body | Response |
| --- | --- | --- |
| `POST /api/cv/upload` | multipart, field `file` | `{ cvFileName, cvR2Key }`. 400 for non-PDF or over 10MB. Replaces any previous CV and back-fills ATS scoring for the user's `idle` jobs. |
| `DELETE /api/cv` | | `{ message }`. 404 if there is no CV on file. |
| `GET /api/users/me` | | `{ id, email, firstName, lastName, isAdmin, cvFileName, hasCv }` |
| `POST /api/users/me` | `{ email }` | The same profile shape. 409 if another user already owns the email. |

## Adding a route

Mirror the existing paths and shapes exactly; the feature `api.ts` files on the client are written against
them and there is no generated client to catch a drift. Put the logic in a service, keep the handler to the
five steps above, and give it a Zod schema in the feature's `dto.ts` rather than validating inline.
