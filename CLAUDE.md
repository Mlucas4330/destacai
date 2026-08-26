## Rules

Always ask instead of guessing.
Don't add unnecessary comments. Let the code explain itself; the reasoning belongs in `docs/`.
Keep it simple.
Don't repeat yourself. If a sentence would have to live in two docs, it belongs in `docs/invariants.md`
and both link to it.
Never use hardcoded hex values or raw Tailwind color classes. Theme tokens live in `src/app/globals.css`.
Never use hardcoded values for strings, values, types and etc. Check `server/constants.ts`,
`src/features/<feature>/constants.ts`, the `pgEnum`s in `server/db/schema.ts`, and the Zod schemas in
`server/shared/schemas.ts`. If you don't find what you need, ask me instead of creating.
Don't add unicode symbols anywhere. Emojis are allowed everywhere.
Keep documentation up to date after changing code.

## Invariants

@docs/invariants.md

## Documentation

Read the file that covers what you are about to touch. Paths are relative to the repo root.

| Doc | Read it when |
| --- | ------------ |
| `docs/product.md` | you need what the product does and for whom |
| `docs/architecture.md` | touching the layering, the `src` / `server` split, or anything background |
| `docs/data-model.md` | touching the schema, a column's contract, or a migration |
| `docs/api.md` | touching a route under `src/app/api` |
| `docs/auth.md` | touching sign-in, the middleware, or the password reset flow |
| `docs/ai-pipeline.md` | touching a prompt, a model call, or CV generation |
| `docs/ats-scoring.md` | touching anything that produces a number the user sees |
| `docs/frontend.md` | touching a screen, a hook, a store or a component |
| `docs/jobs-ui.md` | touching the job cards, the score rings, the badges, the questionnaire or the CV editor |
| `docs/development.md` | running the app locally or verifying a change |
