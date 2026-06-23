---
paths:
  - "src/screens/**"
  - "src/features/**"
  - "src/shared/**"
  - "src/lib/**"
---

# Frontend conventions (`src/`)

Client code only. Imported via the `@/*` alias (`@/* → src/*`).

## Component / hook split
- **Components are pure UI** — props in, JSX out. No API calls, no business logic.
- **Hooks own all logic** — mutations, queries, validation, navigation, toasts.
- **One `api.ts` per feature** is the only place that calls axios (`@/lib/apiClient`). Components/hooks never call axios directly.
- **`shared/utils/`** are pure functions — no side effects, no React, no axios.
- A component that uses a hook (state, router, query) must be reachable from a `'use client'` boundary; mark the top of such a subtree with `'use client'`.

## State — three layers, clear scopes
- **React Query** — all server state. No raw `fetch`, no `useEffect` data fetching. Optimistic writes via `onMutate` + rollback for status changes/deletes; CV upload/delete use `setQueryData` (not `invalidateQueries`) to skip a redundant refetch.
- **Zustand** (`features/auth/stores/auth.ts`) — cross-component UI/flow state only (e.g. the pending email-verification / password-reset flow). Auth *session* state comes from Auth.js `useSession()`, not the store.
- **React Hook Form + Zod** — all forms. Components register fields; the hook owns submit and wires it to a React Query mutation.

## Routing & data
- Navigation uses `next/navigation` (`useRouter`, `useParams`) and `next/link` — never `react-router-dom`.
- **One query per resource**: read jobs (with ATS + generation state) from the single `/jobs` poll in `useJobs`; no per-row endpoints. Polling is enabled only while a job is `queued`/`processing`.

## Auth
- Sign in via `signIn('credentials', { redirect: false })` from `next-auth/react`; sign out via `signOut()`.
- Email verification / password reset hooks call the custom API routes (`/api/auth/*`) and drive the flow through the Zustand store (`pendingVerification`, `pendingReset`).

## Conventions
- Path alias `@/*` → `src/*`. Feature-based folders. Tailwind v4 theme tokens in `src/app/globals.css`.
