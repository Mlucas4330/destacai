import { z } from 'zod'

export const JDExtractSchema = z.object({
  title: z.string().describe('The job title'),
  company: z.string().describe('The company name'),
  requiredSkills: z.array(z.string()).describe('Must-have skills, technologies, tools, and frameworks'),
  preferredSkills: z.array(z.string()).describe('Nice-to-have skills and technologies'),
  responsibilities: z.array(z.string()).describe('Key job responsibilities and scope of work'),
  senioritySignals: z.string().describe('Years of experience required, leadership expectations, and scope signals'),
  qualifications: z.array(z.string()).describe('Degrees, certifications, and hard requirements'),
})
export type JDExtract = z.infer<typeof JDExtractSchema>

export const EntrySchema = z.object({
  org: z.string(),
  role: z.string(),
  location: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()),
})

export const CVDataSchema = z.object({
  name: z.string(),
  email: z.string(),
  linkedin: z.string(),
  github: z.string(),
  leadership: z.array(EntrySchema),
  experience: z.array(EntrySchema),
  skills: z.object({
    technical: z.string(),
    languages: z.string(),
  }),
  education: z.array(z.object({
    university: z.string(),
    degree: z.string(),
    location: z.string(),
    dates: z.string(),
  })),
})

export const AtsGapSchema = z.object({
  label: z.string(),
  context: z.string(),
  score_impact: z.number().int().min(1).max(20),
  icon: z.string(),
})
export type AtsGap = z.infer<typeof AtsGapSchema>

export const AtsKeywordSchema = z.object({
  label: z.string(),
  required: z.boolean(),
  present: z.boolean(),
})
export type AtsKeyword = z.infer<typeof AtsKeywordSchema>

export const AtsBreakdownSchema = z.object({
  score: z.number().int().min(0).max(100),
  skills_match: z.number().int().min(0).max(100),
  domain_fit: z.number().int().min(0).max(100),
  seniority_fit: z.number().int().min(0).max(100),
  rationale: z.string().default(''),
  strengths: z.array(z.string()).max(4),
  gaps: z.array(AtsGapSchema).max(5),
  keywords: z.array(AtsKeywordSchema).default([]),
})
export type AtsBreakdown = z.infer<typeof AtsBreakdownSchema>

export const ATSResultSchema = AtsBreakdownSchema
