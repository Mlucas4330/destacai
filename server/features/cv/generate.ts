import { logger } from '@server/lib/logger'
import type { JDExtract } from '@server/shared/schemas'
import { uploadToR2 } from '@server/lib/r2'
import { generatePDF, splitName } from '@server/features/cv/service'
import { findUserById, updateUserName } from '@server/features/users/repository'
import { updateJobCvGeneration, updateJobGeneratedAtsStatus } from '@server/features/jobs/repository'
import { enqueueAtsScoring } from '@server/features/jobs/score'

export interface CvGenerationTask {
  jobId: string
  userId: string
  jobDescription: string
  cvR2Key: string
  jdExtract?: JDExtract
  userAnswers?: Record<string, boolean>
}

/**
 * Generate a tailored CV (LLM + PDF render), store it in R2, then kick off ATS
 * scoring for the generated CV. Runs in-process (no queue); the frontend reads
 * progress by polling /jobs. All failures are recorded on the job row.
 */
export async function runCvGeneration(data: CvGenerationTask): Promise<void> {
  const { jobId, userId, jobDescription, cvR2Key, jdExtract, userAnswers } = data
  const logCtx = { jobId, userId }
  logger.info({ ...logCtx, hasExtract: !!jdExtract, hasAnswers: !!userAnswers }, 'CV generation started')

  try {
    await updateJobCvGeneration(jobId, 'processing')

    const { output, pdfBuffer } = await generatePDF(cvR2Key, jobDescription, logCtx, jdExtract, userAnswers)

    const r2Key = `generated-cvs/${userId}/${jobId}.pdf`
    await uploadToR2(r2Key, pdfBuffer, 'application/pdf')
    logger.info({ ...logCtx, r2Key }, 'CV uploaded to R2')

    const user = await findUserById(userId)
    const trimmedName = output.name?.trim()
    if (user && !user.firstName && trimmedName) {
      const { firstName, lastName } = splitName(output.name)
      await updateUserName(userId, firstName, lastName)
    }

    await updateJobCvGeneration(jobId, 'done', r2Key, undefined, undefined, output)
    logger.info({ ...logCtx, r2Key }, 'CV generation done')

    const confirmedSkills = userAnswers
      ? Object.entries(userAnswers).filter(([, v]) => v).map(([k]) => k)
      : []
    await updateJobGeneratedAtsStatus(jobId, 'queued')
    enqueueAtsScoring({
      jobId, userId, jobDescription, cvR2Key: r2Key, target: 'generated',
      ...(jdExtract ? { jdExtract } : {}),
      ...(confirmedSkills.length ? { confirmedSkills } : {}),
    })
  } catch (err) {
    logger.error({ ...logCtx, err: (err as Error).message }, 'CV generation failed')
    await updateJobCvGeneration(jobId, 'failed', undefined, undefined, (err as Error).message)
  }
}

/** Fire-and-forget background CV generation. Errors are handled inside runCvGeneration. */
export function enqueueCvGeneration(data: CvGenerationTask): void {
  void runCvGeneration(data)
}
