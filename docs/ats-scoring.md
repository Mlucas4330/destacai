# ATS scoring

The score is the product's core claim, so how it is produced matters more than the number itself.

It is **hybrid**: the keyword half is arithmetic over a taxonomy match and never involves a model; the fit
half is a model judging domain and seniority. They are computed separately and reported separately, so a
reader can see which half moved.

## The output shape

`AtsBreakdown` ([server/shared/schemas.ts](../server/shared/schemas.ts)) is what gets stored and rendered:

| Field | Source | Meaning |
| --- | --- | --- |
| `score` | model | The headline 0-100. The fit judge's holistic call, not a formula over the other fields. |
| `skills_match` | computed | Keyword coverage, 0-100. No model involved. |
| `domain_fit` | model | Does this experience match the role's domain and responsibilities. |
| `seniority_fit` | model | Does the depth and scope match the seniority asked for. |
| `rationale` | model | One sentence. |
| `strengths` | model | Up to 4 concrete overlaps. `strengths[0]` is denormalized onto `ats_explanation` for the list view. |
| `gaps` | computed | Every unmatched skill, with a `score_impact` and an icon. |
| `keywords` | computed | Every JD skill with `required` and `present` flags. This is what the UI checklist renders. |

Note the asymmetry that is easy to misread: `score` is **not** derived from `skills_match`. The headline
number is the fit judge's holistic call; keyword coverage is a separate, model-free number. Do not compute
one from the other in either direction. A CV can match every keyword and still score in the sixties on
seniority grounds.

## The computed half

`matchSkills` in [server/features/jobs/scoring.ts](../server/features/jobs/scoring.ts) canonicalizes every
required and preferred skill through the taxonomy, drops duplicates across the two lists, and asks
`skillPresentInText` whether the CV text contains it.

`skillsScore` weighs coverage 75/25 in favour of required over preferred, and degrades gracefully: if the
job lists only preferred skills, that coverage is the whole score; if it lists neither, the score is 100.

`buildGaps` turns every miss into a gap worth 15 points if required and 8 if preferred, sorted by impact.
These weights are presentational, they explain the shortfall rather than compute it.

## The skills taxonomy

[server/lib/skills/taxonomy.ts](../server/lib/skills/taxonomy.ts) loads `server/assets/skillsTaxonomy.json`,
a canonical-name to aliases map, and builds a reverse index at module load. `normalizeSkill` maps any alias
to its canonical form; unknown skills pass through cleaned but unmapped, so the taxonomy is an improvement
layer, not a whitelist.

Presence testing is a word-boundary regex tuned for technology names: `+`, `#` and `.` are treated as part
of a token, so `C++`, `C#` and `Node.js` match without `c` matching inside every word, and `.` followed by a
letter does not end a token. Add an alias to the JSON rather than special-casing a skill in code.

## The fit judge

`fitJudge` sends the structured `[Job]` block and the CV text to the lightweight model with `fitPrompt.md`,
temperature 0, and a Zod-constrained output. The prompt tells it to judge substance rather than polish, not
to credit anything the CV does not evidence, and not to penalize concision.

**A failed fit judge does not fail the scoring run.** It is caught and defaults to a neutral 50/50/50 with
an empty rationale, so a model outage produces a visibly bland score rather than a `failed` job. The keyword
half is unaffected because it never called a model.

## Two tracks, one function

Scoring runs against two targets, distinguished only by `target: 'uploaded' | 'generated'` on the task:

- `uploaded` reads the user's CV from R2 and extracts its text.
- `generated` prefers the stored `cv_data`, flattening it to text with `cvDataToText`, and only falls back
  to fetching the generated PDF from R2 if the structured data is missing. Scoring the data avoids a
  render-and-re-extract round trip that could only lose information.

Both paths converge on `scoreCvText` -> `buildAtsBreakdown`, and both write to their own four columns. See
[data-model.md](data-model.md).

## When scoring runs

| Trigger | Target |
| --- | --- |
| A job is added while the user has a CV | `uploaded` |
| A CV is uploaded, for every job still `idle` | `uploaded` |
| CV generation finishes | `generated` |
| The user saves an edit to a generated CV | `generated` |
| The self-heal check, below | `generated` |

If the user had no CV when a job was added, `ats_status` stays `idle`, and that is precisely the flag
`findIdleJobsForUser` uses to back-fill later.

## The self-heal

Generation and its follow-up scoring are two separate in-process tasks. A process restart between them
leaves `cv_generation_status = done` with `generated_cv_ats_status = idle`, and nothing would ever retry it.

Both `listJobs` and `getGenerationStatus` check for that pair on every call and re-queue the tailored
scoring, logging a warning. It costs one predicate on a list the caller already has in hand, and it is the
whole reason the app can survive without a durable queue. What that obliges any new read path to do is in
[invariants.md](invariants.md#background-work).
