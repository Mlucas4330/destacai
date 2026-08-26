# Auth

Auth.js (NextAuth v5) with a Credentials provider and JWT sessions. Email and password, no OAuth providers.

## The two config files, and why

| File | Imports | Used by |
| --- | --- | --- |
| [server/auth.config.ts](../server/auth.config.ts) | nothing Node-only | the middleware, and as the base of the full config |
| [server/auth.ts](../server/auth.ts) | the DB and bcrypt, through `validateCredentials` | route handlers and `requireUser()` |

The split exists because the middleware runs on the edge runtime, where `postgres` and `bcryptjs` cannot
load. `auth.config.ts` holds the session strategy, the sign-in page, and the three callbacks; `auth.ts`
spreads it and adds the Credentials provider, then exports `handlers`, `auth`, `signIn`, `signOut`.

**Never import database code, bcrypt, or anything else Node-only into `auth.config.ts`.** It will typecheck
and then fail at request time in the middleware.

## The guard

[src/middleware.ts](../src/middleware.ts) runs `NextAuth(authConfig).auth` over every path except
`/api/*`, Next internals and static assets. The `authorized` callback allows anything in `PUBLIC_PATHS`
(`/sign-in`, `/sign-up`, `/verify-code`, `/forgot-password`, `/reset-password`, `/privacy`) and requires a
session for everything else, redirecting to `/sign-in`.

API routes are excluded from the matcher on purpose: they guard themselves with `requireUser()`, which
returns a 401 JSON body instead of a redirect. See [api.md](api.md).

The JWT carries `token.id`, copied onto `session.user.id` in the `session` callback. That id is the
`users.id` primary key and the only identity the server trusts
([invariants.md](invariants.md#requests)).

## Sign up

`POST /api/auth/register` hashes the password with bcrypt, mints a UUID, inserts the row, and returns 201.
It does not create a session. The client (`useSignUp`) then calls
`signIn('credentials', { redirect: false })` with the same password it already has in hand and lands the
user on `/`. If that sign-in somehow fails, it falls back to a toast and `/sign-in`.

**Email verification was removed.** There used to be a 6-digit code emailed at sign-up, an
`/api/auth/verify-code` route, an `emailVerified` check inside `validateCredentials`, and three columns on
`users`. All of it is gone: it gated the whole product behind an email round-trip that a portfolio project
does not need, and an unverifiable address costs nothing here because nothing is sent to it except a reset
code the user asked for. If it ever comes back it needs the columns, the route, the provider check, and a
resend path, not just the email.

## Sign in

`useSignIn` calls `signIn('credentials')`. The provider's `authorize` delegates to `validateCredentials`,
which looks the user up by email, compares the bcrypt hash, and returns the row or `null`. A `null` password
hash means the account cannot sign in. Failures are reported to the user as a single "Invalid email or
password" so the response does not distinguish a missing account from a wrong password.

On success the client invalidates the whole React Query cache before redirecting, so no data from a
previous session survives the switch.

## Password reset

This is the one flow that still uses emailed codes, and the only reason `/verify-code` exists.

1. `/forgot-password` posts the email. `forgotPassword` generates a 6-digit code
   ([server/lib/code.ts](../server/lib/code.ts), `randomInt`), stores it with an expiry of `CODE_TTL_MS`
   (one hour) on the user row, and sends it through Brevo. If the email is unknown it returns silently, and
   the route's response is identical either way, so the endpoint does not confirm which addresses exist.
2. The client stores `{ email }` in the Zustand auth store as `pendingVerification` and routes to
   `/verify-code`. That store slice is persisted to `localStorage`, so refreshing the page mid-flow does not
   strand the user.
3. `/verify-code` collects six digits. It does **not** call the server: `usePasswordResetVerification` just
   moves the code into `pendingReset` (memory only) and routes to `/reset-password`. The code is verified
   for the first and only time when the new password is submitted.
4. `POST /api/auth/reset-password` re-checks the code and the expiry, hashes the new password, and clears
   the pending state. A missing expiry counts as expired.

Codes are stored in plaintext. They are single-purpose, expire in an hour, and the row they sit on is the
row they unlock, so hashing them would add a step without changing what an attacker with DB access can do.

## Email delivery

[server/features/auth/email.ts](../server/features/auth/email.ts) posts to the Brevo REST API with
`BREVO_API_KEY` and `BREVO_SENDER`. A non-2xx response is logged and rethrown as
`AppError('Failed to send email', 500)`. Without Brevo configured, reset codes are written to the database
but never delivered, which is exactly how local development reads them.
