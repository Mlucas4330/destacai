import { and, desc, eq } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '@server/db/client'
import { jobs } from '@server/db/schema'
import { logger } from '@server/lib/logger'
import type { CVDataSchema, JDExtractSchema, AtsBreakdown } from '@server/shared/schemas'

const log = logger.child({ repository: 'JobsRepository' })

export async function findJobsByUserId(userId: string) {
  log.debug({ userId }, 'findJobsByUserId')
  return db.query.jobs.findMany({ where: eq(jobs.userId, userId), orderBy: [desc(jobs.createdAt)] })
}

export async function findJobById(id: string, userId: string) {
  log.debug({ id, userId }, 'findJobById')
  return db.query.jobs.findFirst({ where: and(eq(jobs.id, id), eq(jobs.userId, userId)) })
}

export async function findJobByUserAndDescription(userId: string, description: string) {
  log.debug({ userId }, 'findJobByUserAndDescription')
  return db.query.jobs.findFirst({
    where: and(eq(jobs.userId, userId), eq(jobs.description, description)),
  })
}

export async function createJob(id: string, userId: string, title: string, company: string, description: string, jdExtract?: z.infer<typeof JDExtractSchema>) {
  log.debug({ userId, title, company }, 'createJob')
  const [job] = await db.insert(jobs).values({ id, userId, title, company, description, ...(jdExtract ? { jdExtract } : {}) }).returning()
  return job
}

export async function getJobJdExtract(id: string, userId: string) {
  log.debug({ id, userId }, 'getJobJdExtract')
  return db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.userId, userId)),
    columns: { jdExtract: true },
  })
}

export async function updateJobStatus(id: string, userId: string, status: string) {
  log.debug({ id, userId, status }, 'updateJobStatus')
  await db.update(jobs).set({ status: status as any }).where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
}

export async function updateJobAtsStatus(id: string, status: string, score?: number, explanation?: string, breakdown?: AtsBreakdown) {
  log.debug({ id, status, score }, 'updateJobAtsStatus')
  await db.update(jobs).set({ atsStatus: status as any, atsScore: score, atsExplanation: explanation, ...(breakdown !== undefined ? { atsBreakdown: breakdown } : {}) }).where(eq(jobs.id, id))
}

export async function updateJobGeneratedAtsStatus(id: string, status: string, score?: number, explanation?: string, breakdown?: AtsBreakdown) {
  log.debug({ id, status, score }, 'updateJobGeneratedAtsStatus')
  await db.update(jobs).set({ generatedCvAtsStatus: status as any, generatedCvAtsScore: score, generatedCvAtsExplanation: explanation, ...(breakdown !== undefined ? { generatedCvAtsBreakdown: breakdown } : {}) }).where(eq(jobs.id, id))
}

export async function updateJobCvGeneration(id: string, status: string, cvR2Key?: string, bullmqJobId?: string, error?: string, cvData?: z.infer<typeof CVDataSchema>) {
  log.debug({ id, status }, 'updateJobCvGeneration')
  await db.update(jobs).set({ cvGenerationStatus: status as any, cvR2Key, bullmqJobId, cvGenerationError: error, ...(cvData !== undefined ? { cvData } : {}) }).where(eq(jobs.id, id))
}

export async function updateJobConfirmedSkills(id: string, skills: string[]) {
  log.debug({ id, count: skills.length }, 'updateJobConfirmedSkills')
  await db.update(jobs).set({ cvConfirmedSkills: skills }).where(eq(jobs.id, id))
}

export async function getJobCvData(id: string, userId: string) {
  log.debug({ id, userId }, 'getJobCvData')
  return db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.userId, userId)),
    columns: { cvData: true, cvGenerationStatus: true },
  })
}

export async function updateJobCvData(id: string, cvData: z.infer<typeof CVDataSchema>) {
  log.debug({ id }, 'updateJobCvData')
  await db.update(jobs).set({ cvData }).where(eq(jobs.id, id))
}

export async function findIdleJobsForUser(userId: string) {
  log.debug({ userId }, 'findIdleJobsForUser')
  return db.query.jobs.findMany({ where: and(eq(jobs.userId, userId), eq(jobs.atsStatus, 'idle')) })
}

export async function deleteJob(id: string, userId: string) {
  log.debug({ id, userId }, 'deleteJob')
  await db.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
}

export async function deleteAllJobs(userId: string) {
  log.debug({ userId }, 'deleteAllJobs')
  await db.delete(jobs).where(eq(jobs.userId, userId))
}
