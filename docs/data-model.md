# Data model

Postgres via Drizzle. The schema is [server/db/schema.ts](../server/db/schema.ts); it is the only place a
column is declared, and migrations are generated from it, never written by hand.

Two tables. Both are auth-only: there is no `is_guest`, no `credit_balance`, no `stripe_customer_id`.

## Enums

```
job_status         saved | applied | interview | rejected | offer
processing_status  idle | queued | processing | done | failed
```

`job_status` is user-owned and free-moving. `processing_status` is machine-owned; the user never sets it.

## `users`

| Column | Type | Contract |
| --- | --- | --- |
| `id` | text, PK | A UUID minted in `createUser`, not a serial. It is the Auth.js session subject. |
| `email` | text, unique, nullable | Nullable because the column predates credentials-only auth. In practice every row has one. Lowercased and trimmed by the Zod schema before it reaches here. |
| `password_hash` | text, nullable | bcrypt. Nullable for the same historical reason; `validateCredentials` treats a null hash as "cannot sign in". |
| `is_admin` | boolean, default false | Set by hand in the DB. Surfaced on the profile, not yet gating anything. |
| `cv_r2_key` | text, nullable | The one uploaded CV. Non-null is the definition of "has a CV" (`toProfile` derives `hasCv` from it). Uploading a second CV deletes the first from R2 and overwrites this. |
| `cv_file_name` | text, nullable | Original filename, for display only. |
| `first_name`, `last_name` | text, nullable | Back-filled from the first generated CV's parsed name if still empty. Used to name the downloaded PDF. |
| `reset_password_code` | text, nullable | 6 digits. Set by `forgotPassword`, checked by `resetPassword`. |
| `reset_password_code_expires_at` | timestamp, nullable | One hour after issue (`CODE_TTL_MS`). An absent expiry counts as expired. |
| `created_at` | timestamp, default now | |

**Removed:** `email_verified`, `verification_code`, `verification_code_expires_at`. Sign-up no longer sends
a code, so keeping the columns would have meant keeping a flag nothing writes and something might one day
read. Dropped in migration `0001`.

## `jobs`

One row per job description a user saved. `user_id` references `users.id` with `on delete cascade`.

### Identity and content

| Column | Contract |
| --- | --- |
| `id` | uuid, generated in the service |
| `title`, `company` | Taken from the request if provided, otherwise from the JD extraction. Never null. |
| `description` | The pasted job description, trimmed. **Also the dedupe key**: `findJobByUserAndDescription` rejects a second job with byte-identical text for the same user with a 409 carrying the existing `jobId`. |
| `status` | `job_status`, default `saved` |
| `jd_extract` | jsonb, `JDExtractSchema`. The parsed job: title, company, required/preferred skills, responsibilities, seniority signals, qualifications. Written once at creation and reused by every later scoring and generation run, so the same job is always judged against the same extraction. |
| `created_at` | timestamp, default now |

### The uploaded-CV score track

| Column | Contract |
| --- | --- |
| `ats_status` | `processing_status`. `idle` means "no CV was on file when this job was added" - `findIdleJobsForUser` uses exactly that to back-fill when a CV is later uploaded. |
| `ats_score` | 0-100, null until `done` |
| `ats_explanation` | The first entry of `strengths`, denormalized for the list view |
| `ats_breakdown` | jsonb, the full `AtsBreakdown` |

### The generated-CV track

| Column | Contract |
| --- | --- |
| `cv_generation_status` | `processing_status` for the generation itself |
| `cv_generation_error` | The caught error message when it is `failed` |
| `cv_r2_key` | `generated-cvs/<userId>/<jobId>.pdf`. Deterministic, so re-rendering after an edit overwrites in place. Deleted from R2 when the job is deleted. |
| `cv_data` | jsonb, `CVDataSchema`. The structured CV behind the PDF. This is the editable copy; the PDF is a render of it, not the source. |
| `cv_confirmed_skills` | jsonb string array, default `[]`. Skills the user confirmed in the questionnaire. Cumulative: a later "no" removes a skill, a later "yes" adds one. |
| `generated_cv_ats_status` / `_score` / `_explanation` / `_breakdown` | The same four fields as the uploaded track, for the generated CV. |

Both tracks are stored side by side on purpose: the product's claim is the improvement between them, so
overwriting the original score would erase the evidence.

### `bullmq_job_id`

Dead. It held the BullMQ id back when generation ran on a Redis queue; nothing reads it, and
`updateJobCvGeneration` still accepts a `bullmqJobId` parameter that no caller passes. Left in place rather
than dropped because removing it is a separate, unrelated migration. Do not start writing to it.

## Reading these columns

- A job's two ATS tracks move independently. `ats_status = done` says nothing about
  `generated_cv_ats_status`.
- A score column is only meaningful when its status column says `done`. Read the status, not a null check.
- `cv_generation_status = done` with `generated_cv_ats_status = idle` is an inconsistent state left by a
  restart, and any read path must handle it.
- Deleting a job must delete `cv_r2_key` from R2 first; the cascade will not do it.

The last three bind code outside this file and are stated in [invariants.md](invariants.md).

## Changing the schema

```bash
# edit server/db/schema.ts, then:
npm run db:generate   # diffs against migrations/meta/*_snapshot.json, writes the next migration
npm run db:push       # applies to the database in DATABASE_URL
```

Read the generated SQL before pushing, especially when the diff drops columns.
