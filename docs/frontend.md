# Frontend

Everything under `src/`, imported through the `@/*` alias. React 19 client components; the App Router is
used for routing and the API surface, not for server rendering of data.

This file is the conventions. For what the jobs screen actually renders, which is most of the client code,
see [jobs-ui.md](jobs-ui.md).

## The layers

```
src/app/(app)/page.tsx        route  ->  renders a screen
src/screens/Jobs.tsx          screen ->  composes feature components, owns layout
src/features/jobs/            feature:
  api.ts                        the only file that touches axios
  hooks/                        all logic: queries, mutations, validation, navigation, toasts
  components/                   pure UI, props in and JSX out
  types.ts / constants.ts       shapes and magic values
src/shared/                   cross-feature components, the UI store, pure utils
src/lib/                      apiClient, queryClient, storageClient
```

| Route | Screen |
| --- | --- |
| `/` (route group `(app)`) | `Jobs` |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/verify-code`, `/reset-password` (group `(auth)`) | the matching screen |
| `/privacy`, the not-found page | `Privacy`, `NotFound` |

Settings and Add job are not routes. They are drawers over the jobs screen, driven by `useUiStore`, because
they are overlays rather than destinations.

## Rules that hold everywhere

- **Components are pure UI.** No API calls, no business logic. If a component needs data, it takes it as a
  prop or the screen calls the hook.
- **Hooks own all logic**: queries, mutations, form submission, navigation, toasts.
- **One `api.ts` per feature**, and it is the only place `@/lib/apiClient` is imported. Components and hooks
  never call axios.
- **`shared/utils/` is pure**: no React, no side effects, no network.
- Anything using a hook must sit under a `'use client'` boundary; mark the top of that subtree.
- Navigation is `next/navigation` and `next/link`. There is no `react-router-dom`.
- No hardcoded hex or raw Tailwind color classes. Colors and fonts are theme tokens declared in
  [src/app/globals.css](../src/app/globals.css) (`bg-surface`, `text-navy-muted`, `font-ui`, and so on).

## State: three layers with hard boundaries

**React Query owns all server state.** No raw `fetch`, no `useEffect` data fetching. Defaults are a 60s
stale time and `retry: 0`, set in [src/lib/queryClient.ts](../src/lib/queryClient.ts). The cache is
persisted through `PersistQueryClientProvider` into IndexedDB (`idb-keyval`), not localStorage, because the
serialized job list with its ATS breakdowns can exceed the ~5MB localStorage cap.

**Zustand owns cross-component UI flow state, and nothing else.** Two stores:
`features/auth/stores/auth.ts` for the password-reset flow (`pendingVerification` persisted to localStorage,
`pendingReset` in memory) and `shared/stores/ui.ts` for which drawer is open. Session state is **not** in
Zustand; it comes from Auth.js `useSession()`.

**React Hook Form + Zod own every form.** Schemas live in `features/<name>/schemas.ts`. The component
registers fields; the hook owns submit and wires it to a mutation.

`storageClient` (localStorage, JSON round-tripping) is for small drafts and flags only: a half-typed job
description, a pending sign-up email. Never for server data.

## One query per resource

Job state is read from a single `GET /jobs` query in
[src/features/jobs/hooks/useJobs.ts](../src/features/jobs/hooks/useJobs.ts), per
[invariants.md](invariants.md#requests). ATS scores, generation status, the generated CV's score: all of it
arrives in that one list, and `/jobs/{id}/status` goes unused even though the server offers it.

**Polling is conditional.** `refetchInterval` is a function over the cached data: it returns
`POLLING_INTERVAL_MS` (5s) only while some job has a `queued` or `processing` status on any of its three
status fields, and `false` otherwise. An idle board makes no requests. This is the pattern to preserve when
adding a background-backed feature: gate the poll on the data, do not poll unconditionally.

A `useEffect` in the same hook watches for a job's `cvGenerationStatus` crossing into `done` and refetches
the user profile, because generation can back-fill the user's first and last name.

## Optimistic writes

Status changes, deletes and generation kicks use `onMutate` to patch the cached list, keep the previous
value in the mutation context, roll back in `onError`, and `invalidateQueries` in `onSettled`. Those three
actions are the ones where the user expects the UI to move immediately.

CV upload and delete instead write the result with `setQueryData`, since the response already contains the
new profile and a refetch would be redundant.

Slow endpoints get an explicit timeout in `api.ts` (30s for adding a job, 60s for a cover letter) because
the shared axios default is 5s.

## Errors

The axios interceptor unwraps `{ error }` into `new Error(message)`, so hooks read `err.message` and hand it
to `react-hot-toast`. Toasts belong in hooks, never in components.
