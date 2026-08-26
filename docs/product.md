# Product

The pitch, the problem and the user flow diagram are in the [README](../README.md). This file is the spec
behind them: who it is for, and what the app is required to do.

## Who it is for

A candidate applying to a lot of jobs. They have one CV, they know it should be tailored per application,
and they are not going to do that by hand thirty times. Everything here follows from that: one stored CV,
many jobs, and per-job work that is cheap to trigger and never mandatory.

## Job status lifecycle

A job carries a status the user sets by hand: `saved`, `applied`, `interview`, `rejected`, `offer`. It is
free-moving, not a state machine: nothing in the backend advances it and no transition is blocked.

Separately, each job carries three machine-owned statuses the user does not control: `atsStatus`,
`cvGenerationStatus`, `generatedCvAtsStatus`. Do not conflate the two. See
[data-model.md](data-model.md).

## Functional requirements

- Sign up and sign in with email + password. Sign-up signs the user straight in; there is no email
  verification step. See [auth.md](auth.md).
- Forgot password sends a 6-digit code by email that expires in one hour.
- The user uploads one CV (PDF, max 10MB). It is stored in Cloudflare R2 and replaces any previous one.
- Adding a job extracts title/company/requirements and runs ATS scoring automatically, if a CV is on file.
- Uploading a CV back-fills scoring for jobs added before the upload.
- CV generation is per job, triggered by the user, never automatic.
- Before generating, the user can answer a short questionnaire confirming skills the job asks for that the
  CV does not evidence. Confirmed skills are remembered on the job and reused on later generations.
- The generated CV can be edited in-app; saving re-renders the PDF and re-runs the tailored score.
- A cover letter can be generated per job, once its CV is generated.
- The user can delete a single job or clear all jobs, generated PDFs included.
- Settings auto-save; there is no Save button.

## Non-functional requirements

- Works with a job description from any source: it is pasted text, not a scraped URL.
- CV upload: PDF only, 10MB ceiling, enforced server-side in `uploadCv`.
- Generation is expected to take up to roughly 60 seconds. The client polls rather than blocking, and a
  failure surfaces as a `failed` status on the job ([invariants.md](invariants.md#background-work)).
- The model never invents experience. Fabricated skills, metrics, employers and institutions are detected
  and stripped before the PDF is rendered. See [ai-pipeline.md](ai-pipeline.md) and
  [invariants.md](invariants.md#generation).
- Both scores are kept and shown together, so the improvement is visible rather than claimed.
- Transactional email goes through Brevo.

## Deliberately not built

Payments, guest/anonymous usage, a credit system, and a job queue all existed in earlier versions and were
removed. [architecture.md](architecture.md) explains what would have to come back with them.
