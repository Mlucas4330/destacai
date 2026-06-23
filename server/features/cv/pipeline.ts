import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { generateText, Output } from 'ai'
import { getGenerationModel } from '@server/lib/llm'
import { CVDataSchema } from '@server/shared/schemas'
import type { JDExtract } from '@server/shared/schemas'
import { normalizeSkill, skillPresentInText, textContainsPhrase, canonicalSkills } from '@server/lib/skills/taxonomy'
import { assetsDir } from '@server/lib/paths'
import { AppError } from '@server/lib/errors'
import { logger } from '@server/lib/logger'

const log = logger.child({ service: 'CvPipeline' })

type CvData = z.infer<typeof CVDataSchema>

interface ParsedCv {
  text: string
  textLower: string
}

export function parseOriginalCv(cvText: string): ParsedCv {
  return { text: cvText, textLower: cvText.toLowerCase() }
}

function splitSkills(technical: string): string[] {
  return technical.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
}

function skillTraceable(parsed: ParsedCv, confirmed: Set<string>, skill: string): boolean {
  const canonical = normalizeSkill(skill)
  if (confirmed.has(canonical)) return true
  if (skillPresentInText(parsed.text, canonical)) return true
  return textContainsPhrase(parsed.textLower, skill)
}

interface Violations {
  skills: string[]
  bulletSkills: string[]
  metrics: string[]
  structural: string[]
  missingConfirmed: string[]
}

function bulletText(output: CvData): string {
  return [...output.experience, ...output.leadership].flatMap((entry) => entry.bullets).join('\n')
}

const NUMBER_RE = /(?<![A-Za-z])\$?\d[\d,]*(?:\.\d+)?%?/g

function numericCore(token: string): string {
  return token.replace(/[$,%]/g, '').trim()
}

function extractNumbers(text: string): { token: string; core: string }[] {
  const out: { token: string; core: string }[] = []
  for (const m of text.matchAll(NUMBER_RE)) {
    const core = numericCore(m[0])
    if (core) out.push({ token: m[0], core })
  }
  return out
}

function cvNumberCores(parsed: ParsedCv): Set<string> {
  return new Set(extractNumbers(parsed.text).map((n) => n.core))
}

function untracedMetrics(output: CvData, cvCores: Set<string>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const entry of [...output.experience, ...output.leadership]) {
    for (const bullet of entry.bullets) {
      for (const { token, core } of extractNumbers(bullet)) {
        if (cvCores.has(core) || seen.has(token)) continue
        seen.add(token)
        result.push(token)
      }
    }
  }
  return result
}

export function findFabricatedMetrics(output: CvData, cvText: string): string[] {
  return untracedMetrics(output, cvNumberCores(parseOriginalCv(cvText)))
}

function skillMentioned(haystack: string, skill: string): boolean {
  const canonical = normalizeSkill(skill)
  return skillPresentInText(haystack, canonical) || textContainsPhrase(haystack.toLowerCase(), skill)
}

function missingConfirmedSkills(output: CvData, confirmedSkills: string[]): string[] {
  const haystack = `${output.skills.technical}\n${bulletText(output)}`
  const seen = new Set<string>()
  const result: string[] = []
  for (const skill of confirmedSkills) {
    const canonical = normalizeSkill(skill)
    if (seen.has(canonical)) continue
    seen.add(canonical)
    if (!skillMentioned(haystack, skill)) result.push(skill)
  }
  return result
}

function forceAddConfirmedSkills(output: CvData, missing: string[]): CvData {
  if (!missing.length) return output
  const technical = [...splitSkills(output.skills.technical), ...missing].join(', ')
  return { ...output, skills: { ...output.skills, technical } }
}

export function keywordsToPreserve(parsed: ParsedCv, confirmedSkills: string[], jdSkills: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const add = (skill: string) => {
    const canonical = normalizeSkill(skill)
    if (seen.has(canonical)) return
    seen.add(canonical)
    result.push(skill)
  }
  for (const skill of confirmedSkills) add(skill)
  for (const skill of jdSkills) {
    if (skillPresentInText(parsed.textLower, normalizeSkill(skill))) add(skill)
  }
  return result
}

export function ensureSkillsPreserved(output: CvData, preserve: string[]): CvData {
  const missing = preserve.filter((skill) => !skillPresentInText(output.skills.technical, normalizeSkill(skill)))
  return forceAddConfirmedSkills(output, missing)
}

const AMBIGUOUS_BULLET_SKILLS = new Set(['go', 'next', 'spring', 'react', 'rust'])

function bulletSkillUniverse(jdSkills: string[]): string[] {
  return [...jdSkills, ...canonicalSkills().filter((c) => !AMBIGUOUS_BULLET_SKILLS.has(c))]
}

function untraceableJdSkills(parsed: ParsedCv, confirmed: Set<string>, jdSkills: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const skill of jdSkills) {
    if (skillTraceable(parsed, confirmed, skill)) continue
    const canonical = normalizeSkill(skill)
    if (seen.has(canonical)) continue
    seen.add(canonical)
    result.push(skill)
  }
  return result
}

export function validateGeneratedCv(output: CvData, parsed: ParsedCv, confirmedSkills: string[], jdSkills: string[] = []): Violations {
  const confirmed = new Set(confirmedSkills.map(normalizeSkill))

  const skills = splitSkills(output.skills.technical).filter((skill) => !skillTraceable(parsed, confirmed, skill))

  const bullets = bulletText(output)
  const bulletSkills = untraceableJdSkills(parsed, confirmed, bulletSkillUniverse(jdSkills)).filter((skill) => skillMentioned(bullets, skill))

  const metrics = untracedMetrics(output, cvNumberCores(parsed))

  const structural: string[] = []
  const entries = [...output.experience, ...output.leadership]
  for (const entry of entries) {
    if (entry.org && !textContainsPhrase(parsed.textLower, entry.org)) {
      structural.push(`org "${entry.org}" not found in original CV`)
    }
  }
  for (const edu of output.education) {
    if (edu.university && !textContainsPhrase(parsed.textLower, edu.university)) {
      structural.push(`institution "${edu.university}" not found in original CV`)
    }
  }

  const missingConfirmed = missingConfirmedSkills(output, confirmedSkills)

  return { skills, bulletSkills, metrics, structural, missingConfirmed }
}

function stripUntraceableSkills(output: CvData, parsed: ParsedCv, confirmedSkills: string[]): CvData {
  const confirmed = new Set(confirmedSkills.map(normalizeSkill))
  const kept = splitSkills(output.skills.technical).filter((skill) => skillTraceable(parsed, confirmed, skill))
  return { ...output, skills: { ...output.skills, technical: kept.join(', ') } }
}

function splitClauses(bullet: string): string[] {
  return bullet.split(/\s*(?:,(?!\d)|;| and | & |—)\s*|\.\s+/).map((s) => s.trim()).filter(Boolean)
}

function stripClauses(bullet: string, offending: (clause: string) => boolean): string | null {
  const clauses = splitClauses(bullet)
  const kept = clauses.filter((c) => !offending(c))
  if (!kept.length) return null
  if (kept.length === clauses.length) return bullet
  const joined = kept.join(', ')
  const punctuated = /[.!?]$/.test(joined) ? joined : `${joined}.`
  return punctuated.charAt(0).toUpperCase() + punctuated.slice(1)
}

function transformBullets(output: CvData, transform: (bullet: string) => string | null): CvData {
  const clean = (entries: CvData['experience']) =>
    entries.map((entry) => ({
      ...entry,
      bullets: entry.bullets.map(transform).filter((b): b is string => !!b && b.trim().length > 0),
    }))
  return { ...output, experience: clean(output.experience), leadership: clean(output.leadership) }
}

function stripFabricatedBullets(output: CvData, parsed: ParsedCv, confirmedSkills: string[], jdSkills: string[]): CvData {
  const confirmed = new Set(confirmedSkills.map(normalizeSkill))
  const untraceable = untraceableJdSkills(parsed, confirmed, bulletSkillUniverse(jdSkills))
  if (!untraceable.length) return output
  return transformBullets(output, (b) => stripClauses(b, (clause) => untraceable.some((skill) => skillMentioned(clause, skill))))
}

function stripFabricatedMetrics(output: CvData, parsed: ParsedCv): CvData {
  const cvCores = cvNumberCores(parsed)
  return transformBullets(output, (b) => stripClauses(b, (clause) => extractNumbers(clause).some((n) => !cvCores.has(n.core))))
}

function buildJdRequirementsBlock(jdExtract: JDExtract): string {
  return [
    `[Job Requirements]:`,
    `Title: ${jdExtract.title}`,
    `Company: ${jdExtract.company}`,
    `Required Skills: ${jdExtract.requiredSkills.join(', ')}`,
    `Preferred Skills: ${jdExtract.preferredSkills.join(', ')}`,
    `Key Responsibilities: ${jdExtract.responsibilities.join('; ')}`,
    `Seniority: ${jdExtract.senioritySignals}`,
    `Qualifications: ${jdExtract.qualifications.join(', ')}`,
  ].join('\n')
}

function buildUserAnswersBlock(userAnswers: Record<string, boolean>): string {
  const confirmed = Object.entries(userAnswers).filter(([, v]) => v).map(([k]) => k)
  const denied = Object.entries(userAnswers).filter(([, v]) => !v).map(([k]) => k)
  const lines: string[] = ['[User Confirmed Skills]:']
  if (confirmed.length) lines.push(`Candidate confirmed they have: ${confirmed.join(', ')}. These are verified skills not yet reflected in the [Original CV]. EXCEPTION TO SOURCE FIDELITY: add each one to skills.technical using the [Job Description]'s exact phrasing. Do not skip any confirmed skill. Do not insert these skills into experience bullets.`)
  if (denied.length) lines.push(`Candidate confirmed they do NOT have: ${denied.join(', ')}. Exclude these completely from the output.`)
  return lines.join('\n')
}

interface GenerateArgs {
  cvText: string
  jobDescription: string
  jdExtract?: JDExtract
  userAnswers?: Record<string, boolean>
  logCtx: object
}

async function runModel(systemPrompt: string, prompt: string): Promise<CvData> {
  const { output } = await generateText({
    model: getGenerationModel(),
    output: Output.object({ schema: CVDataSchema }),
    temperature: 0.3,
    system: systemPrompt,
    prompt,
  })
  return output
}

export async function generateTailoredCv(args: GenerateArgs): Promise<CvData> {
  const { cvText, jobDescription, jdExtract, userAnswers, logCtx } = args
  const parsed = parseOriginalCv(cvText)
  const confirmedSkills = userAnswers
    ? Object.entries(userAnswers).filter(([, v]) => v).map(([k]) => k)
    : []

  const systemPrompt = await readFile(path.join(assetsDir, 'cvPrompt.md'), 'utf-8')
  const jdBlock = jdExtract ? buildJdRequirementsBlock(jdExtract) : ''
  const answersBlock = userAnswers && Object.keys(userAnswers).length > 0 ? buildUserAnswersBlock(userAnswers) : ''

  const jdSkills = jdExtract ? [...jdExtract.requiredSkills, ...jdExtract.preferredSkills] : []

  const parts = [`[Original CV]:\n${cvText}`, `[Job Description]:\n${jobDescription}`]
  if (jdBlock) parts.push(jdBlock)
  if (answersBlock) parts.push(answersBlock)
  const basePrompt = parts.join('\n\n')

  log.info(logCtx, 'rewrite: generating tailored CV')
  let output = await runModel(systemPrompt, basePrompt)
  let violations = validateGeneratedCv(output, parsed, confirmedSkills, jdSkills)

  if (violations.skills.length || violations.bulletSkills.length || violations.metrics.length || violations.structural.length || violations.missingConfirmed.length) {
    log.warn({ ...logCtx, skills: violations.skills, bulletSkills: violations.bulletSkills, metrics: violations.metrics, structural: violations.structural, missingConfirmed: violations.missingConfirmed }, 'validation failed, attempting one repair')
    const correction = [
      basePrompt,
      `[Validation Errors]:`,
      `The previous output contained content not supported by the [Original CV]. Fix all of the following using ONLY content present in the [Original CV] or [User Confirmed Skills]:`,
      ...violations.skills.map((s) => `- Remove skill not found in CV: ${s}`),
      ...violations.bulletSkills.map((s) => `- Remove every mention of "${s}" from experience and leadership bullets; the candidate has not demonstrated it. Do not imply or describe this skill.`),
      ...violations.metrics.map((m) => `- Remove the figure "${m}" from the bullets; it does not appear in the [Original CV]. State the achievement without inventing numbers, percentages, or counts.`),
      ...violations.structural.map((s) => `- ${s}; use only organizations and institutions present in the CV`),
      ...violations.missingConfirmed.map((s) => `- Add the confirmed skill "${s}" to skills.technical. The candidate confirmed they have it; do not omit it. Do not insert it into experience bullets.`),
    ].join('\n\n')
    output = await runModel(systemPrompt, correction)
    violations = validateGeneratedCv(output, parsed, confirmedSkills, jdSkills)
  }

  if (violations.structural.length) {
    log.error({ ...logCtx, structural: violations.structural }, 'structural hallucination after repair, failing')
    throw new AppError('CV generation produced unverifiable entries', 422, { violations: violations.structural })
  }

  if (violations.skills.length) {
    log.warn({ ...logCtx, stripped: violations.skills }, 'stripping untraceable skills as final safety net')
    output = stripUntraceableSkills(output, parsed, confirmedSkills)
  }

  if (violations.bulletSkills.length) {
    log.warn({ ...logCtx, strippedBullets: violations.bulletSkills }, 'stripping bullets with untraceable skills as final safety net')
    output = stripFabricatedBullets(output, parsed, confirmedSkills, jdSkills)
  }

  if (violations.metrics.length) {
    log.warn({ ...logCtx, strippedMetrics: violations.metrics }, 'stripping bullets with untraceable figures as final safety net')
    output = stripFabricatedMetrics(output, parsed)
  }

  if (violations.missingConfirmed.length) {
    log.warn({ ...logCtx, forced: violations.missingConfirmed }, 'forcing confirmed skills into skills list as final safety net')
    output = forceAddConfirmedSkills(output, violations.missingConfirmed)
  }

  const preserve = keywordsToPreserve(parsed, confirmedSkills, jdSkills)
  const beforePreserve = output.skills.technical
  output = ensureSkillsPreserved(output, preserve)
  if (output.skills.technical !== beforePreserve) {
    log.info(logCtx, 'preserved original/confirmed keywords in skills list')
  }

  return output
}
