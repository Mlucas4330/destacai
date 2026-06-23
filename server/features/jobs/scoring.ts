import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { generateText, Output } from 'ai'
import { getLightweightModel } from '@server/lib/llm'
import { normalizeSkill, skillPresentInText } from '@server/lib/skills/taxonomy'
import { assetsDir } from '@server/lib/paths'
import { logger } from '@server/lib/logger'
import type { JDExtract, AtsBreakdown, AtsGap } from '@server/shared/schemas'

const log = logger.child({ service: 'Scoring' })

const ICON_BY_CANONICAL: Record<string, string> = {
  postgresql: 'database', mysql: 'database', mongodb: 'database', redis: 'database',
  sql: 'database', elasticsearch: 'database', kafka: 'database', rabbitmq: 'database',
  aws: 'cloud', gcp: 'cloud', azure: 'cloud', docker: 'cloud', kubernetes: 'cloud', terraform: 'cloud',
  leadership: 'users', agile: 'users',
  'ci/cd': 'wrench', git: 'wrench',
  rest: 'globe', graphql: 'globe', html: 'globe', css: 'globe',
  'machine learning': 'cpu', tensorflow: 'cpu', pytorch: 'cpu',
  microservices: 'layers',
}

function iconFor(canonical: string): string {
  return ICON_BY_CANONICAL[canonical] ?? 'code-2'
}

export interface SkillMatch {
  canonical: string
  original: string
  required: boolean
  present: boolean
}

export function matchSkills(cvText: string, jdExtract: JDExtract): SkillMatch[] {
  const cvLower = cvText.toLowerCase()

  const seen = new Set<string>()
  const entries: { canonical: string; original: string; required: boolean }[] = []
  for (const original of jdExtract.requiredSkills) {
    const canonical = normalizeSkill(original)
    if (seen.has(canonical)) continue
    seen.add(canonical)
    entries.push({ canonical, original, required: true })
  }
  for (const original of jdExtract.preferredSkills) {
    const canonical = normalizeSkill(original)
    if (seen.has(canonical)) continue
    seen.add(canonical)
    entries.push({ canonical, original, required: false })
  }

  return entries.map((e) => ({ ...e, present: skillPresentInText(cvLower, e.canonical) }))
}

function skillsScore(matches: SkillMatch[]): number {
  const required = matches.filter((m) => m.required)
  const preferred = matches.filter((m) => !m.required)
  const reqCoverage = required.length ? required.filter((m) => m.present).length / required.length : null
  const prefCoverage = preferred.length ? preferred.filter((m) => m.present).length / preferred.length : null

  if (reqCoverage === null && prefCoverage === null) return 100
  if (reqCoverage === null) return Math.round(prefCoverage! * 100)
  if (prefCoverage === null) return Math.round(reqCoverage * 100)
  return Math.round((reqCoverage * 0.75 + prefCoverage * 0.25) * 100)
}

function buildGaps(matches: SkillMatch[]): AtsGap[] {
  const missing = matches.filter((m) => !m.present)
  const gaps: AtsGap[] = missing.map((m) => ({
    label: m.original,
    context: m.required ? 'Required skill' : 'Preferred skill',
    score_impact: m.required ? 15 : 8,
    icon: iconFor(m.canonical),
  }))
  gaps.sort((a, b) => b.score_impact - a.score_impact)
  return gaps
}

const FitJudgeSchema = z.object({
  score: z.number().int().min(0).max(100),
  dimensions: z.object({
    domain_fit: z.number().int().min(0).max(100),
    seniority_fit: z.number().int().min(0).max(100),
  }),
  rationale: z.string(),
  strengths: z.array(z.string()).max(4),
})

type FitJudgeResult = z.infer<typeof FitJudgeSchema>

function buildJobBlock(jdExtract: JDExtract): string {
  return [
    `[Job]:`,
    `Title: ${jdExtract.title}`,
    `Company: ${jdExtract.company}`,
    `Required Skills: ${jdExtract.requiredSkills.join(', ')}`,
    `Preferred Skills: ${jdExtract.preferredSkills.join(', ')}`,
    `Key Responsibilities: ${jdExtract.responsibilities.join('; ')}`,
    `Seniority: ${jdExtract.senioritySignals}`,
    `Qualifications: ${jdExtract.qualifications.join(', ')}`,
  ].join('\n')
}

async function fitJudge(cvText: string, jdExtract: JDExtract): Promise<FitJudgeResult> {
  try {
    const systemPrompt = await readFile(path.join(assetsDir, 'fitPrompt.md'), 'utf-8')
    const { output } = await generateText({
      model: getLightweightModel(),
      output: Output.object({ schema: FitJudgeSchema }),
      temperature: 0,
      system: systemPrompt,
      prompt: `${buildJobBlock(jdExtract)}\n\n[CV]:\n${cvText}`,
    })
    return output
  } catch (err: any) {
    log.warn({ err: err?.message }, 'fit judge failed, defaulting to neutral')
    return {
      score: 50,
      dimensions: { domain_fit: 50, seniority_fit: 50 },
      rationale: '',
      strengths: [],
    }
  }
}

export async function buildAtsBreakdown(
  cvText: string,
  jdExtract: JDExtract,
): Promise<AtsBreakdown> {
  const matches = matchSkills(cvText, jdExtract)
  const fit = await fitJudge(cvText, jdExtract)

  return {
    score: fit.score,
    skills_match: skillsScore(matches),
    domain_fit: fit.dimensions.domain_fit,
    seniority_fit: fit.dimensions.seniority_fit,
    rationale: fit.rationale,
    strengths: fit.strengths,
    gaps: buildGaps(matches),
    keywords: matches.map((m) => ({ label: m.original, required: m.required, present: m.present })),
  }
}
