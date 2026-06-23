import type { Job } from '@/features/jobs/types'
import type { DerivedKeywords } from './keywords'
import { fitLevel } from './fit'

export interface Badge {
  id: string
  label: string
  description: string
  icon: string
  cls: string
}

const GREEN = 'bg-success-surface text-success-text'
const INK = 'bg-navy text-bg'
const ACCENT = 'bg-accent text-accent-text'

export function scoreTier(score: number): Badge {
  if (score >= 90) return { id: 'tier', label: 'Platinum', description: 'Rank for an ATS score of 90 or above', icon: 'gem', cls: 'bg-navy text-accent' }
  if (score >= 75) return { id: 'tier', label: 'Gold', description: 'Rank for an ATS score of 75-89', icon: 'medal', cls: 'bg-accent text-accent-text' }
  if (score >= 60) return { id: 'tier', label: 'Silver', description: 'Rank for an ATS score of 60-74', icon: 'medal', cls: 'bg-border text-navy' }
  return { id: 'tier', label: 'Bronze', description: 'Rank for an ATS score below 60', icon: 'medal', cls: 'bg-[#e7d6b6] text-[#7a5b2a]' }
}

export function deriveBadges(job: Job, derived: DerivedKeywords): Badge[] {
  const badges: Badge[] = []
  const score = job.generatedCvAtsScore ?? 0
  const base = job.atsBreakdown
  const tailored = job.generatedCvAtsBreakdown
  const delta = score - (job.atsScore ?? 0)
  const coverage = derived.covered.length + derived.missing.length
  const fullCoverage = coverage > 0 && derived.missing.length === 0

  badges.push(scoreTier(score))

  if (score >= 90) badges.push({ id: 'high-scorer', label: 'High Scorer', description: 'Final ATS score of 90 or above', icon: 'trophy', cls: GREEN })
  if (fullCoverage) badges.push({ id: 'keyword-master', label: 'Keyword Master', description: 'Every job keyword is covered in your CV', icon: 'target', cls: GREEN })
  if (delta >= 20) badges.push({ id: 'big-leap', label: 'Big Leap', description: 'Tailoring lifted your score by 20+ points', icon: 'rocket', cls: ACCENT })
  if ((tailored?.skills_match ?? 0) >= 90) badges.push({ id: 'skill-match', label: 'Skill Match', description: 'Your CV strongly demonstrates the required skills (90+)', icon: 'check-check', cls: INK })
  if ((tailored?.domain_fit ?? 0) >= 85) badges.push({ id: 'domain-expert', label: 'Domain Expert', description: "Strong match with the role's industry/domain", icon: 'briefcase', cls: INK })

  const expFit = fitLevel(Math.max(base?.seniority_fit ?? 0, tailored?.seniority_fit ?? 0))
  if (expFit === 'strong') badges.push({ id: 'seniority-fit', label: 'Seniority Fit', description: "Your experience strongly fits the role's seniority", icon: 'award', cls: INK })

  if ((job.cvConfirmedSkills?.length ?? 0) > 0) badges.push({ id: 'refiner', label: 'Refiner', description: 'You refined your CV with confirmed skills', icon: 'wand-2', cls: ACCENT })
  if (score === 100) badges.push({ id: 'flawless', label: 'Flawless', description: 'A perfect ATS score of 100', icon: 'crown', cls: GREEN })
  if (score >= 80 && fullCoverage) badges.push({ id: 'interview-ready', label: 'Interview Ready', description: 'Score 80+ with full keyword coverage', icon: 'badge-check', cls: GREEN })

  return badges
}
