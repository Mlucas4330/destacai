# Development

## Setup

```bash
npm install
cp .env.example .env
npx auth secret          # writes AUTH_SECRET, paste it into .env if it lands elsewhere

docker compose up -d     # Postgres 16 on 5432
npm run db:push          # create the users and jobs tables
npm run dev              # http://localhost:3000
```

The compose file creates user/password/database all named `destacai`, so the matching URL is:

```
DATABASE_URL=postgres://destacai:destacai@localhost:5432/destacai
```

`.env.example` ships a placeholder with `user:password`; change it or nothing will connect. Stop the
database with `docker compose down`, or `docker compose down -v` to wipe the volume.

## Environment variables

| Variable | Required for | Without it |
| --- | --- | --- |
| `AUTH_SECRET` | signing JWT sessions | Auth.js refuses to start |
| `DATABASE_URL` | everything | nothing works |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | CV upload, generation, scoring | you can sign in and add jobs; uploading a CV fails, so scoring never starts |
| `OPENAI_API_KEY` | every model call | adding a job fails at the extraction step |
| `BREVO_API_KEY`, `BREVO_SENDER` | the password-reset email | the reset code is written to `users.reset_password_code` but never delivered |

So a database and `AUTH_SECRET` are enough to work on auth and the shell; the rest is needed once you touch
CVs, scoring or generation.

**Reading a reset code without Brevo:**

```bash
docker compose exec db psql -U destacai -d destacai \
  -c "select email, reset_password_code from users;"
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` / `npm run start` | production build and serve. `start` is the deploy target: the app needs a long-running Node process, see [architecture.md](architecture.md) |
| `npm run db:generate` | diff `server/db/schema.ts` against the snapshot and write the next migration |
| `npm run db:push` | apply the schema to `DATABASE_URL` directly |
| `npm run db:migrate` | apply the migration files in order |
| `npx tsc --noEmit` | the typecheck. Run it before every commit. |

`npm run lint` is wired to `next lint`, but there is no ESLint config in the repo yet, so it drops into an
interactive setup prompt and cannot be used non-interactively. Treat `npx tsc --noEmit` as the check that
actually runs.

## Tests

There are none. The app has no unit, integration or end-to-end suite, so every change is verified by
typechecking and by driving the flow in a browser. Worth knowing before you assume a refactor is covered.

## Verifying a change by hand

The two paths that break most often:

**Auth.** Sign up with a fresh email; you should land on `/` already signed in, with no code screen in
between. Then forgot-password, read the code (email or the psql query above), enter it at `/verify-code`,
set a new password, sign in with it.

**Generation.** Upload a CV in Settings, add a job by pasting a real description, watch the ATS score arrive
within a few seconds (the board polls every 5s while work is pending), then generate. Expect up to a minute.
Compare the two scores, download the PDF, edit a bullet and confirm the tailored score is recomputed.

Server-side progress is in the terminal: every service and background runner logs through pino with a
`service` or `repository` child binding, and the generation pipeline logs each validation violation it
repairs or strips.

## After changing the schema

```bash
npm run db:generate   # read the generated SQL, especially when columns are dropped
npm run db:push
```

Never hand-edit a file in `server/db/migrations/` ([invariants.md](invariants.md#data)).
