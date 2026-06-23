import type { AtsBreakdown, CVData, JDExtract } from '@/features/jobs/types'

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const matches = (jd: string, cvTokens: string[]) =>
  cvTokens.some((cv) => {
    if (cv === jd) return true
    if (jd.length >= 3 && cv.includes(jd)) return true
    if (cv.length >= 3 && jd.includes(cv)) return true
    return false
  })

export interface DerivedKeywords {
  covered: string[]
  missing: string[]
}

export function keywordsFromBreakdown(breakdown: AtsBreakdown | null): DerivedKeywords {
  const covered: string[] = []
  const missing: string[] = []
  for (const k of breakdown?.keywords ?? []) {
    (k.present ? covered : missing).push(k.label)
  }
  return { covered, missing }
}

export function deriveKeywords(jdExtract: JDExtract | null, cvData: CVData | null): DerivedKeywords {
  if (!jdExtract || !cvData) return { covered: [], missing: [] }

  const cvTokens = cvData.skills.technical
    .split(',')
    .map(normalize)
    .filter(Boolean)

  const covered: string[] = []
  const missing: string[] = []
  const seen = new Set<string>()

  for (const skill of [...jdExtract.requiredSkills, ...jdExtract.preferredSkills]) {
    const norm = normalize(skill)
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    if (matches(norm, cvTokens)) covered.push(skill)
    else missing.push(skill)
  }

  return { covered, missing }
}
