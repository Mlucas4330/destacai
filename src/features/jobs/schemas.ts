import { z } from 'zod'

export const EntrySchema = z.object({
  org: z.string(),
  role: z.string(),
  location: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()),
})

export const CVDataSchema = z.object({
  name: z.string(),
  location: z.string(),
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

export const JobMetadataSchema = z.object({
  title: z.string().describe('The job title'),
  company: z.string().describe('The company name'),
})

export const AddJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  description: z.string().min(1, 'Job description is required'),
})