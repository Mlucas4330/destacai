# DestacAI

DestacAI is a micro-SaaS that generates a custom CV for each job you apply to, optimized for ATS filters, with a built-in score that tells you exactly why your current CV isn't making the cut.

# Problem

Sometimes you're a skilled developer with great side projects and experience, however, still not getting the job you wanted. That happens with all of us. The problem is not you, it's how you're showing it. Nowadays companies are using AI ATS (Applicant Tracking System), automatically filtering you for not using specific keywords related to the job requirements.

Even though you're aware of those filtering methods and manually customize your CV for the position you want, how much time per day can you realistically spend doing this?

# Solution

DestacAI takes the job description for any position you're applying to, scores your current CV against it (0–100), and generates a tailored version that passes ATS filters.

# Project

At the beginning, I wanted to create a solution for the step after the application: How could you reach out the recruiters responsible for that position in order to stand out? Premium LinkedIn users can send AI-generated messages directly to recruiters, giving them an enormous advantage over other candidates. You can find recruiters without premium, but it's hard to know how to approach them. Should the message be friendly? Professional? About previous experiences? How do you show interest without looking desperate?

Even with tools like Claude, Gemini or ChatGPT available, it's easy to lose track of what you sent and whether it's consistent with your information.

This is the first sketch I did for the project.
![Sketch](./docs/sketch.png)

The idea was pretty much the same as now, it would read the job description, find the company's recruiters on LinkedIn, and generate a personalized outreach message based on your CV, keeping your approach consistent across every application. The problem was that I wouldn't know who's specifically responsible for the position and even though I knew, how long would take for the person to accept the connection invitation? How could this be tracked?

While thinking on how to address those problems, I had an even better idea: What if I pivot my solution to the previous step?

Based on this new idea, I created this User Flow using Figma:
![User Flow](./docs/user-flow.png)

Then I evolved the project to include a full backend, authentication and ATS scoring.

```mermaid
flowchart TD
    A([user opens destacai]) --> B{authenticated?}

    B -->|No| C([sign in / sign up with email + password])
    C --> C1([sign-up sends a 6-digit code via email - expires in 1 hour])
    C1 --> D{cv uploaded?}
    B -->|Yes| D

    D -->|No| E([upload CV on settings screen - stored in R2])
    D -->|Yes| F([add job - title/company auto-extracted via AI])
    E --> F

    F --> H([ATS scoring + CV generation run in-process])
    H --> L([ATS score + custom CV ready])

    L --> M([home screen - job saved with status badge])
    M --> N([update job status: Applied / Interview / Rejected / Offer])

    style A fill:#c0392b,color:#fff
    style L fill:#27ae60,color:#fff
```

## Architecture

DestacAI is a **single Next.js 15 (App Router) application** - one repo, one deploy.

- **Frontend** - React 19 client components (React Query, Zustand, React Hook Form + Zod, Tailwind v4, Framer Motion). Routes live in `src/app/` (route groups `(app)` and `(auth)`); page-level UI in `src/screens/`, feature code in `src/features/`, shared UI/utils in `src/shared/`, infra in `src/lib/`.
- **Backend** - Next.js route handlers under `src/app/api/*` calling a ported service layer in `server/` (`features/*` → service/repository/dto/model, plus `db`, `lib`, `shared`). Uses Postgres (Drizzle ORM), Cloudflare R2 for CV PDFs, Brevo for email, and OpenAI for the LLM calls.
- **Auth** - Auth.js (NextAuth v5): Credentials provider + JWT sessions, with email-code verification and password reset as custom API routes. `src/middleware.ts` guards authed routes.
- **Async** - CV generation and ATS scoring run **in-process** as fire-and-forget background tasks (no queue/Redis). The client polls `/jobs` for status. This requires a long-running Node host (`next start`), not edge/serverless.

## Functional Requirements

- User signs up / signs in with email + password (Auth.js Credentials + JWT session cookie)
- Sign-up triggers a 6-digit verification code sent via Brevo (expires in 1 hour)
- Forgot password sends a 6-digit reset code via Brevo
- User uploads their CV once (PDF), stored in Cloudflare R2
- Adding a job auto-extracts title/company and runs ATS scoring (and CV generation when triggered)
- Jobs are persisted in Postgres and synced per user
- Each job has a status badge: Saved / Applied / Interview / Rejected / Offer
- A tailored cover letter can be generated per job
- The generated CV can be edited in-app and re-scored
- User can delete individual jobs or clear all data
- Settings auto-save without a Save button

## Non-Functional Requirements

- Works with a job description from any source
- CV upload format: PDF, max 10MB
- CV files stored in Cloudflare R2
- Jobs and metadata stored in Postgres (Drizzle ORM)
- CV generation runs as an in-process background task; expected time up to ~60 seconds
- Transactional emails (verification code, password reset) sent via Brevo

## How CV Generation Works

The user provides the job description by pasting it into the Add Job form. The backend extracts the title and company via a lightweight LLM call, then a background task fetches the user's CV from R2, extracts its text with `pdfjs-dist`, and calls the LLM with the CV text and job description as context.

The LLM acts as an experienced technical recruiter and follows a strict set of rules:

- **Action verbs** - a curated list of strong, specific verbs
- **Writing style** - should and avoid pattern with a list of avoided words
- **Do's and Don'ts** - explicit rules the model must follow
- **Top 5 resume mistakes** - injected as negative examples so the model learns what to avoid
- **Candidate profile** - the uploaded CV is included as context so the model only adapts existing experience, never invents or exaggerates

The LLM returns structured JSON validated against a Zod schema. The PDF is rendered server-side via `@react-pdf/renderer` and stored in R2 for download.

**Model selection is purpose-based.** `gpt-4o` is used for CV generation and `gpt-4o-mini` for the lighter ATS scoring and job-detail extraction (see `server/lib/llm.ts`). The Vercel AI SDK provides the LLM abstraction; only the OpenAI provider is wired.

## How ATS Scoring Works

The ATS check runs as a separate, lighter LLM call. When a job is added, ATS scoring runs automatically; CV generation can be triggered per job. The model compares the job description keywords and requirements against the user's current CV and returns a score from 0 to 100 with a plain-language explanation of what's missing. A second ATS score is computed after CV generation completes, so the user can compare their original CV score against the generated one.

Both tracks (`uploaded` and `generated`) share the same scoring function, only the R2 key differs. Scores and explanations are written back onto the job row, so the frontend reads them straight from `/jobs` without a dedicated ATS endpoint. If a row ever shows `cvGenerationStatus === 'done'` with `generatedCvAtsStatus === 'idle'` (e.g. a background scoring task failed to start), the next `/jobs` poll re-runs the tailored ATS scoring automatically.

## Local development

```bash
npm install
cp .env.example .env            # then fill in the values
npx auth secret                 # generates AUTH_SECRET (paste into .env)

docker compose up -d            # start local Postgres (matches the default DATABASE_URL)
npm run db:push                 # create the users + jobs tables

npm run dev                     # http://localhost:3000
```

- `AUTH_SECRET` and `DATABASE_URL` are required to sign up / sign in. `R2_*`, `OPENAI_API_KEY`, and `BREVO_*` are only needed once you upload a CV, generate, or send verification emails.
- Stop the database with `docker compose down` (data persists) or `docker compose down -v` (wipes it).
- After changing `server/db/schema.ts`, run `npm run db:generate` then `npm run db:push` (or `db:migrate`).

