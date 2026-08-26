# The jobs UI

`src/features/jobs/` is the largest surface in the repo, about 2,000 lines, and it is where every number the
backend computes finally lands. [frontend.md](frontend.md) covers the conventions; this covers what the
screen actually does.

## The screen is one list

[src/screens/Jobs.tsx](../src/screens/Jobs.tsx) is a three-way switch and nothing else: no CV on file
renders `NoCVState`, no jobs renders `NoJobState`, otherwise `JobList`. There is no job detail route. A job
expands in place inside its card, and the two heavy panels (questionnaire, editor) are overlays.

`JobList` renders the count, a "Clear all" button, a dismissible "click a card to change its status" hint
(`useStatusHint`, remembered in localStorage under `statusHintDismissed_v2`), and a staggered
`AnimatePresence` list of `JobItem`.

## `JobItem` is the whole product in one card

466 lines of `CVEditor` and 381 of `JobItem` exist because this card carries every state a job can be in.
The derived flags at the top are the ones to understand before changing anything:

```
baseReady       atsStatus === 'done' && atsScore !== null
tailoredReady   generatedCvAtsStatus === 'done' && generatedCvAtsScore !== null
bothScoresDone  baseReady && tailoredReady
```

They gate the card's whole behaviour. The ring shows the **tailored** score once `bothScoresDone`, the
original otherwise, and only becomes clickable (expanding the breakdown) when both exist. Badges are
computed only when both exist. This is the rendering side of the rule in
[invariants.md](invariants.md#scores): read the status, never a null score.

The left border colour encodes `job.status`; the status labels, chip colours and border colours are three
`Record<JobStatus, string>` maps at the top of the file.

## Score visualisation

| Component | Shape | Used for |
| --- | --- | --- |
| `ScoreRing` | ring with `n / 100` inside | the headline score on the card |
| `MetricRing` | smaller ring with a label under it | `skills_match`, `domain_fit`, `seniority_fit` in the expanded breakdown |
| `SubScoreBar` | thin bar plus an optional delta | the same sub-scores in compact rows, with the tailored-minus-original delta |
| `BadgeRow` | icon chips | the achievement badges |
| `GapIcon` | one lucide icon | the icon name the backend put on each gap |

All three score components animate from zero with Framer Motion and colour themselves on the same
thresholds: 70 and 40.

**Thresholds are currently defined in four places and do not agree.** `scoreColor` in
[shared/utils/formatters.ts](../src/shared/utils/formatters.ts) uses 70/40, the rings repeat 70/40 inline,
`fitLevel` in [shared/utils/fit.ts](../src/shared/utils/fit.ts) uses 67/34, and `scoreTier` in
[shared/utils/badges.ts](../src/shared/utils/badges.ts) uses 90/75/60. They are answering slightly different
questions, but a reader cannot tell that from the code. If you touch any of them, consolidate rather than
adding a fifth.

The gap icon and badge icon names are strings chosen server-side and mapped to lucide components in
`ICON_MAP` at the top of `GapIcon` and `BadgeRow`. Both fall back to a default icon on an unknown name, so a
typo degrades silently rather than crashing. Adding an icon means editing the map on the client and the
name on the server.

## Badges

`deriveBadges` ([shared/utils/badges.ts](../src/shared/utils/badges.ts)) is pure: a job plus its derived
keywords in, a `Badge[]` out. It always emits one rank tier (Platinum/Gold/Silver/Bronze on the tailored
score) plus any of nine conditional badges: High Scorer, Keyword Master, Big Leap (a 20+ point lift from
tailoring), Skill Match, Domain Expert, Seniority Fit, Refiner, Flawless, Interview Ready.

`JobItem` splits the result into the rank badge and the rest. Badges are pure decoration over numbers that
already exist; no badge should ever be the only place a fact is shown.

## Keyword coverage has two sources

This is the sharp edge in this feature. The covered/missing keyword split can come from either:

- `keywordsFromBreakdown` - reads `breakdown.keywords`, the flags the **server** computed with the skills
  taxonomy. Authoritative.
- `deriveKeywords` - re-derives the split on the **client** by normalising `jdExtract` skills against
  `cvData.skills.technical` with its own substring matcher.

`JobItem` prefers the first and falls back to the second when the tailored breakdown has no keywords. The
fallback exists for jobs scored before `keywords` was added to the breakdown, and its matcher is looser than
the server's taxonomy, so the two can disagree on the same job. Treat `deriveKeywords` as legacy: prefer
widening the server breakdown over teaching the client to match skills.

## The skills questionnaire

`ATSQuestionnaire` is a swipeable card deck over `breakdown.gaps`, one missing skill per card, answered yes
or no by dragging past a 100px threshold or tapping. It shows a projected coverage count that moves as the
user answers, and `rewind()` steps back and deletes the previous answer.

Answers go to `POST /jobs/{id}/generate` as `userAnswers`, and the server merges them cumulatively into
`cv_confirmed_skills`. Re-opening the deck for a re-tailor seeds `initialAnswers` from the stored confirmed
skills and starts at the first unanswered gap, so the user is never asked twice about the same skill.

A "yes" here is the one thing that can put a skill on the CV that the original CV does not evidence. See
[invariants.md](invariants.md#generation) and the confirmed-skills handling in
[ai-pipeline.md](ai-pipeline.md).

## The CV editor

`CVEditor` loads `cvData` through `useGetCvData` (enabled only while open), edits it in local state as a
plain form over the `CVDataSchema` shape (entries, bullets, education, skills), and saves through
`useUpdateCvData`. Saving re-renders the PDF server-side to the same R2 key and re-queues the tailored
score, which is why the optimistic update clears `generatedCvAtsScore` and sets the status back to `queued`.

The structured data is the source of truth; the PDF is a render of it.

## Known rough edges

- `src/features/jobs/hooks/useSelectedJob.ts` is dead code. It reads a `jobId` route param, and no such
  route exists; nothing imports it.
- `badges.ts` emits the icon name `check-check` for the Skill Match badge, which is not in `BadgeRow`'s
  `ICON_MAP`, so that badge silently renders the default medal.
- `ScoreRing`, `MetricRing` and the Bronze tier in `badges.ts` hardcode hex colours, against the project
  rule. They need theme tokens; the ring colours are passed to an SVG `stroke`, so they need the value
  rather than a class, which is why they were written this way.
