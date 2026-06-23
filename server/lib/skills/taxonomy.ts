import { readFileSync } from 'node:fs'
import path from 'node:path'
import { assetsDir } from '@server/lib/paths'

type TaxonomyFile = Record<string, string[]>

const raw = JSON.parse(readFileSync(path.join(assetsDir, 'skillsTaxonomy.json'), 'utf-8')) as TaxonomyFile

const aliasToCanonical = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(raw)) {
  aliasToCanonical.set(canonical.toLowerCase(), canonical)
  for (const alias of aliases) aliasToCanonical.set(alias.toLowerCase(), canonical)
}

function clean(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function normalizeSkill(rawSkill: string): string {
  const cleaned = clean(rawSkill)
  return aliasToCanonical.get(cleaned) ?? cleaned
}

export function canonicalSkills(): string[] {
  return Object.keys(raw)
}

export function aliasesFor(canonical: string): string[] {
  const key = normalizeSkill(canonical)
  return [key, ...(raw[key] ?? [])]
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function textContainsPhrase(haystackLower: string, phrase: string): boolean {
  const cleaned = phrase.toLowerCase().trim()
  if (!cleaned) return false
  return new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(cleaned)}(?:[^a-z0-9+#.]|\\.(?![a-z0-9])|$)`).test(haystackLower)
}

export function skillPresentInText(cvText: string, canonical: string): boolean {
  const haystackLower = cvText.toLowerCase()
  for (const alias of aliasesFor(canonical)) {
    if (textContainsPhrase(haystackLower, alias)) return true
  }
  return false
}
