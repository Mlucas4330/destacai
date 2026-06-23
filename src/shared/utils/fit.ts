export type FitLevel = 'strong' | 'partial' | 'below'

export function fitLevel(score: number): FitLevel {
  if (score >= 67) return 'strong'
  if (score >= 34) return 'partial'
  return 'below'
}
