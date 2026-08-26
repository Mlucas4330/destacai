import { pgTable, text, integer, timestamp, uuid, pgEnum, boolean, jsonb } from 'drizzle-orm/pg-core'
import type { z } from 'zod'
import type { CVDataSchema, JDExtractSchema, AtsBreakdown } from '@server/shared/schemas'

export const jobStatusEnum = pgEnum('job_status', ['saved', 'applied', 'interview', 'rejected', 'offer'])
export const processingStatusEnum = pgEnum('processing_status', ['idle', 'queued', 'processing', 'done', 'failed'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  isAdmin: boolean('is_admin').notNull().default(false),
  cvR2Key: text('cv_r2_key'),
  cvFileName: text('cv_file_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  resetPasswordCode: text('reset_password_code'),
  resetPasswordCodeExpiresAt: timestamp('reset_password_code_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  company: text('company').notNull(),
  description: text('description').notNull(),
  status: jobStatusEnum('status').notNull().default('saved'),
  atsStatus: processingStatusEnum('ats_status').notNull().default('idle'),
  atsScore: integer('ats_score'),
  atsExplanation: text('ats_explanation'),
  cvGenerationStatus: processingStatusEnum('cv_generation_status').notNull().default('idle'),
  cvGenerationError: text('cv_generation_error'),
  cvR2Key: text('cv_r2_key'),
  bullmqJobId: text('bullmq_job_id'),
  generatedCvAtsStatus: processingStatusEnum('generated_cv_ats_status').notNull().default('idle'),
  generatedCvAtsScore: integer('generated_cv_ats_score'),
  generatedCvAtsExplanation: text('generated_cv_ats_explanation'),
  cvData: jsonb('cv_data').$type<z.infer<typeof CVDataSchema>>(),
  cvConfirmedSkills: jsonb('cv_confirmed_skills').$type<string[]>().default([]),
  jdExtract: jsonb('jd_extract').$type<z.infer<typeof JDExtractSchema>>(),
  atsBreakdown: jsonb('ats_breakdown').$type<AtsBreakdown>(),
  generatedCvAtsBreakdown: jsonb('generated_cv_ats_breakdown').$type<AtsBreakdown>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
