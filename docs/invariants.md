# Invariants

The rules that cross subsystems. Each one is stated here once; every other doc links here rather than
restating it. If you find yourself writing one of these sentences into a second file, link instead.

## Background work

**Every background failure lands on the job row.** `runCvGeneration` and `runAtsScoring` are started
without `await`, so by the time they run there is no request left to answer. An uncaught error is not a
500, it is a job stuck in `processing` forever. Catch inside the runner and write `failed`.

**The host must be a long-running Node process.** Every route handler declares
`export const runtime = 'nodejs'`. Edge and serverless runtimes may stop the process once the response is
sent, which is exactly when this work starts. This is why there is no edge deploy target.

**`cv_generation_status = done` with `generated_cv_ats_status = idle` is an inconsistent state.** It means
the process restarted between generation and its follow-up scoring. Any code path that reads jobs must
either re-queue the tailored scoring when it sees that pair, or leave the read to `listJobs`. This check is
what replaces a durable queue.

## Scores

**A score is meaningful only when its status column says `done`.** Never infer readiness from a non-null
score, and never render one without checking the status beside it.

**Both score tracks are preserved.** The uploaded CV's score and the generated CV's score live in separate
columns and neither overwrites the other. The product's claim is the difference between them, so erasing
the original erases the evidence.

## Generation

**The model never invents experience.** No skill, employer, institution or metric may reach the rendered
PDF unless the original CV supports it or the user explicitly confirmed it in the questionnaire. The model
is asked to obey this and then checked; the deterministic strip in `pipeline.ts` is the part that is
actually load-bearing.

**`jd_extract` is written once and reused.** Extraction runs when the job is added; every later scoring and
generation run reads the stored value. The same job must always be judged against the same extraction.

**User text inside a prompt is fenced as data.** The job description and the CV are untrusted input. Every
call that includes them wraps them in labelled markers and states that nothing between the markers is an
instruction. Keep that fence when you add a call.

## Requests

**Identity comes from the session, never from the request.** `requireUser()` resolves the Auth.js session
and returns the row. No handler reads a user id from a body, a query string or a header, and every job
query is filtered by `userId` as well as `id`.

**Errors are `AppError(message, status)`, translated once.** Thrown anywhere in the stack, converted by
`toErrorResponse` at the handler boundary into `{ error }` at the right status. The client's axios
interceptor unwraps that envelope into `Error.message`, which is why hooks can read `err.message`.

**Job state is read from `GET /jobs` only.** One query, no per-row endpoints, and polling is gated on the
cached data so an idle board makes no requests.

## Data

**Deleting a job deletes its R2 object first.** The `on delete cascade` covers rows, not storage.

**Migrations are generated, never hand-written.** Edit `server/db/schema.ts`, run `npm run db:generate`,
read the SQL before pushing.
